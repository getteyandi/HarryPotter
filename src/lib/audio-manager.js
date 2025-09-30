// Minimal Web Audio manager for SFX/OST
class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.categories = new Map(); // name -> { gainNode, volume }
    this.buffers = new Map(); // key -> AudioBuffer
    this.meta = new Map(); // key -> { url, category, volume }
    this.instances = new Map(); // id -> { src, gain, ended }
    this.music = { current: null, next: null }; // { id, key, gain }
    this._id = 0;
    this._unlocked = false;
    this._pending = [];
    this._unlockListeners = new Set(); // NEW
  }

  get isReady() {
    return !!this.ctx;
  }

  get unlocked() {
    // NEW
    return !!this._unlocked;
  }

  onUnlock(fn) {
    // NEW: subscribe to unlock
    if (this._unlocked) {
      try {
        fn();
      } catch {}
      return () => {};
    }
    this._unlockListeners.add(fn);
    return () => this._unlockListeners.delete(fn);
  }

  whenUnlocked(fn) {
    // NEW: run immediately if already unlocked, else queue
    if (this._unlocked && this.ctx && this.ctx.state !== "suspended") {
      try {
        fn();
      } catch {}
      return;
    }
    this._pending.push(fn);
  }

  ensureCtx() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 1;
      this.master.connect(this.ctx.destination);
      // init default categories
      ["music", "sfx", "ui"].forEach((name) => this.addCategory(name));
    }
  }

  addCategory(name, volume = 1) {
    this.ensureCtx();
    if (this.categories.has(name)) return this.categories.get(name);
    const g = this.ctx.createGain();
    g.gain.value = volume;
    g.connect(this.master);
    const cat = { gain: g, volume };
    this.categories.set(name, cat);
    return cat;
  }

  setMasterVolume(v) {
    this.ensureCtx();
    this.master.gain.value = Math.max(0, Math.min(1, v));
  }

  setCategoryVolume(name, v) {
    this.ensureCtx();
    const cat = this.addCategory(name);
    cat.volume = Math.max(0, Math.min(1, v));
    cat.gain.gain.value = cat.volume;
  }

  async load(manifest, opts = {}) {
    this.ensureCtx();
    const entries = Object.entries(manifest);
    let done = 0;
    const total = entries.length;
    const onProgress = opts.onProgress;

    await Promise.all(
      entries.map(async ([key, def]) => {
        this.meta.set(key, { ...def });
        const buf = await this._fetchBuffer(def.url);
        this.buffers.set(key, buf);
        done++;
        if (typeof onProgress === "function") {
          try {
            onProgress(done, total, key);
          } catch {}
        }
      })
    );
  }

  async _fetchBuffer(url) {
    const res = await fetch(url);
    const arr = await res.arrayBuffer();
    return await this.ctx.decodeAudioData(arr);
  }

  // Play one-shot or looped instance
  // opts: { loop, volume, rate, fadeInMs, fadeOutMs, startAt, stopAfterMs, category, oneAtATime }
  play(key, opts = {}) {
    this.ensureCtx();
    const meta = this.meta.get(key);
    const buf = this.buffers.get(key);
    if (!meta || !buf) {
      console.warn("[audio] Missing buffer:", key);
      return null;
    }

    // optional "one at a time" per key: stop previous instances of same key
    if (opts.oneAtATime) {
      Array.from(this.instances.entries()).forEach(([id, inst]) => {
        if (inst.key === key) this.stop(id, opts.fadeOutMs || 0);
      });
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = !!opts.loop;
    if (opts.rate) src.playbackRate.value = opts.rate;

    const catName = opts.category || meta.category || "sfx";
    const cat = this.addCategory(catName);
    const gain = this.ctx.createGain();
    const baseVol = (meta.volume ?? 1) * (opts.volume ?? 1);
    const now = this.ctx.currentTime;

    // route: src -> inst gain -> category gain -> master
    gain.gain.setValueAtTime(0, now);
    gain.connect(cat.gain);
    src.connect(gain);

    // fade in
    const fadeInSec = Math.max(0, (opts.fadeInMs ?? 0) / 1000);
    if (fadeInSec > 0) {
      gain.gain.linearRampToValueAtTime(baseVol, now + fadeInSec);
    } else {
      gain.gain.setValueAtTime(baseVol, now);
    }

    // schedule stop
    let stopTimer = null;
    if (opts.stopAfterMs && opts.stopAfterMs > 0) {
      stopTimer = setTimeout(() => {
        this._fadeAndStop(src, gain, opts.fadeOutMs ?? 0);
      }, opts.stopAfterMs);
    }

    const id = ++this._id;
    const inst = { id, key, src, gain, stopTimer, onEnded: null };
    this.instances.set(id, inst);

    src.onended = () => {
      this.instances.delete(id);
      if (inst.onEnded) inst.onEnded();
      if (stopTimer) clearTimeout(stopTimer);
    };

    const startAt = Math.max(0, opts.startAt || 0);
    try {
      src.start(0, startAt);
    } catch (e) {
      console.warn("[audio] start failed", e);
    }

    return {
      id,
      stop: (fadeMs = 0) => this.stop(id, fadeMs),
      onEnded: (fn) => (inst.onEnded = fn),
    };
  }

  stop(id, fadeMs = 0) {
    const inst = this.instances.get(id);
    if (!inst) return;
    if (fadeMs > 0) {
      this._fadeAndStop(inst.src, inst.gain, fadeMs);
      return;
    }
    try {
      inst.src.stop();
    } catch {}
    this.instances.delete(id);
    if (inst.stopTimer) clearTimeout(inst.stopTimer);
  }

  stopAll(fadeMs = 0) {
    Array.from(this.instances.keys()).forEach((id) => this.stop(id, fadeMs));
  }

  _fadeAndStop(src, gain, fadeMs) {
    const now = this.ctx.currentTime;
    const t = Math.max(0.01, fadeMs / 1000);
    const cur = gain.gain.value;
    gain.gain.setValueAtTime(cur, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + t);
    setTimeout(() => {
      try {
        src.stop();
      } catch {}
    }, fadeMs + 10);
  }

  // Music helpers
  async playMusic(key, { fadeMs = 500, loop = true, volume = 1 } = {}) {
    // crossfade if something is already playing
    if (this.music.current) {
      await this.crossfadeMusic(key, { fadeMs, loop, volume });
      return;
    }
    const inst = this.play(key, {
      loop,
      volume,
      category: "music",
      fadeInMs: fadeMs,
      oneAtATime: true,
    });
    if (!inst) return;
    this.music.current = inst;
    this.music.current.key = key;
  }

  async crossfadeMusic(
    nextKey,
    { fadeMs = 700, loop = true, volume = 1 } = {}
  ) {
    const prev = this.music.current;
    const next = this.play(nextKey, {
      loop,
      volume,
      category: "music",
      fadeInMs: fadeMs,
      oneAtATime: true,
    });
    if (!next) {
      if (prev) prev.stop(fadeMs);
      this.music.current = null;
      return null;
    }
    if (prev) prev.stop(fadeMs);
    this.music.current = next;
    this.music.current.key = nextKey;
    return next;
  }

  duck(categoryNames = ["music"], to = 0.3, fadeMs = 200) {
    this.ensureCtx();
    const now = this.ctx.currentTime;
    const t = Math.max(0.01, fadeMs / 1000);
    categoryNames.forEach((name) => {
      const cat = this.addCategory(name);
      const cur = cat.gain.gain.value;
      cat.gain.gain.setValueAtTime(cur, now);
      cat.gain.gain.linearRampToValueAtTime(
        Math.max(0, Math.min(1, to)),
        now + t
      );
    });
  }

  unduck(categoryNames = ["music"], to = null, fadeMs = 250) {
    this.ensureCtx();
    const now = this.ctx.currentTime;
    const t = Math.max(0.01, fadeMs / 1000);
    categoryNames.forEach((name) => {
      const cat = this.addCategory(name);
      const target = to == null ? cat.volume : to;
      const cur = cat.gain.gain.value;
      cat.gain.gain.setValueAtTime(cur, now);
      cat.gain.gain.linearRampToValueAtTime(
        Math.max(0, Math.min(1, target)),
        now + t
      );
    });
  }

  // Unlock on first user gesture (required by browsers)
  attachUnlock(el = document, onUnlock) {
    if (this._unlocked) {
      if (onUnlock)
        try {
          onUnlock();
        } catch {}
      // flush queued
      const pending = this._pending.splice(0);
      pending.forEach((f) => {
        try {
          f();
        } catch {}
      });
      return;
    }
    const tryUnlock = () => {
      this.ensureCtx();
      const resume =
        this.ctx.state === "suspended" ? this.ctx.resume() : Promise.resolve();
      Promise.resolve(resume).finally(() => {
        this._unlocked = true;
        if (onUnlock)
          try {
            onUnlock();
          } catch {}
        // notify listeners
        Array.from(this._unlockListeners).forEach((f) => {
          try {
            f();
          } catch {}
        });
        this._unlockListeners.clear();
        // flush queued
        const pending = this._pending.splice(0);
        pending.forEach((f) => {
          try {
            f();
          } catch {}
        });
      });
      el.removeEventListener("pointerdown", tryUnlock);
      el.removeEventListener("keydown", tryUnlock);
      el.removeEventListener("touchstart", tryUnlock);
    };
    el.addEventListener("pointerdown", tryUnlock, { once: true });
    el.addEventListener("keydown", tryUnlock, { once: true });
    el.addEventListener("touchstart", tryUnlock, { once: true });
  }

  has(key) {
    return this.buffers?.has?.(key) === true;
  }

  // Unlock immediately (call inside a user gesture handler)
  async unlockNow() {
    this.ensureCtx();
    try {
      if (this.ctx.state === "suspended") {
        await this.ctx.resume();
      }
    } catch {}
    if (!this._unlocked) {
      this._unlocked = true;
      // notify listeners
      if (this._unlockListeners) {
        Array.from(this._unlockListeners).forEach((fn) => {
          try {
            fn();
          } catch {}
        });
        this._unlockListeners.clear();
      }
      // flush queued
      if (this._pending) {
        const pending = this._pending.splice(0);
        pending.forEach((f) => {
          try {
            f();
          } catch {}
        });
      }
    }
  }
}

const audio = new AudioManager();
export default audio;

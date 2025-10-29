import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "framer-motion";
import HpButton from "../../components/hp-button";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Play,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
  Wand2,
} from "lucide-react";
import audio from "../../lib/audio-manager";
import useAssetPreloader from "../hooks/useAssetPreloader";

const PLACEHOLDER = "/images/hero.png";

// 14 spell cards (names + image paths; replace images if you have them)
const BASE_CARDS = [
  {
    id: "expelliarmus",
    name: "Expelliarmus",
    img: "/images/cards/expelliarmus.png",
  },
  { id: "lumos", name: "Lumos", img: "/images/cards/lumos.png" },
  {
    id: "transformation",
    name: "Transformation",
    img: "/images/cards/transformation.png",
  },
  { id: "accio", name: "Accio", img: "/images/cards/accio.png" },
  { id: "evanesco", name: "Evanesco", img: "/images/cards/evanesco.png" },
  { id: "crucio", name: "Crucio", img: "/images/cards/crucio.png" },
  { id: "incendio", name: "Incendio", img: "/images/cards/incendio.png" },
  { id: "reparo", name: "Reparo", img: "/images/cards/reparo.png" },
  { id: "levioso", name: "Levioso", img: "/images/cards/levioso.png" },
  { id: "flipendo", name: "Flipendo", img: "/images/cards/flipendo.png" },
  {
    id: "altering-spell",
    name: "Altering Spell",
    img: "/images/cards/altering-spell.png",
  },
  {
    id: "avada-kedavra",
    name: "Avada Kedavra",
    img: "/images/cards/avada-kedavra.png",
  },
  { id: "bombarda", name: "Bombarda", img: "/images/cards/bombarda.png" },
  { id: "confundo", name: "Confundo", img: "/images/cards/confundo.png" },
];

// Power-up catalog
const POWER_UPS = {
  normal: [
    {
      id: "tempo-i",
      name: "Calm Tempo I",
      tier: "normal",
      desc: "+60ms shuffle delay.",
      effect: { delayMsAdd: 60 },
    },
    {
      id: "tempo-lite",
      name: "Gentle Tempo",
      tier: "normal",
      desc: "+40ms shuffle delay.",
      effect: { delayMsAdd: 40 },
    },
    {
      id: "focus-i",
      name: "Focused Mind",
      tier: "normal",
      desc: "Score ×1.1.",
      effect: { scoreFactor: 1.1 },
    },
    {
      id: "loose-i",
      name: "Fewer Shuffles I",
      tier: "normal",
      desc: "Shuffles -2.",
      effect: { swapsDelta: -2 },
    },
    {
      id: "extra-i",
      name: "Extra Shuffles I",
      tier: "normal",
      desc: "Shuffles +2 and Score ×1.05.",
      effect: { swapsDelta: +2, scoreFactor: 1.05 },
    },
  ],
  epic: [
    {
      id: "tempo-ii",
      name: "Calm Tempo II",
      tier: "epic",
      desc: "+100ms shuffle delay.",
      effect: { delayMsAdd: 100 },
    },
    {
      id: "flow",
      name: "Deep Calm",
      tier: "epic",
      desc: "+80ms shuffle delay.",
      effect: { delayMsAdd: 80 },
    },
    {
      id: "mastery",
      name: "Mastery",
      tier: "epic",
      desc: "Score ×1.25.",
      effect: { scoreFactor: 1.25 },
    },
  ],
  legendary: [
    {
      id: "timewarp",
      name: "Time Dilation",
      tier: "legendary",
      desc: "+160ms shuffle delay.",
      effect: { delayMsAdd: 160 },
    },
    {
      id: "jackpot",
      name: "Jackpot",
      tier: "legendary",
      desc: "Score ×1.5.",
      effect: { scoreFactor: 1.5 },
    },
  ],
};

// Weighted RNG: Normal 70%, Epic 25%, Legendary 5%
const RNG_WEIGHTS = [
  { tier: "legendary", w: 5 },
  { tier: "epic", w: 25 },
  { tier: "normal", w: 70 },
];

const SPEED_LIMITS = { minMs: 120, maxMs: 1200 };

// NEW: rotating tips for the loader
const LOADING_TIPS = [
  "Tip: Follow the rhythm — shuffles have a cadence.",
  "Tip: Keep your eyes near the target’s lane.",
  "Tip: Faster speeds reward more points.",
  "Tip: Boons apply from the next round onward.",
  "Tip: The target appears more often with Trace Lock.",
];

function rollTier() {
  const total = RNG_WEIGHTS.reduce((a, b) => a + b.w, 0);
  let r = Math.random() * total;
  for (const t of RNG_WEIGHTS) {
    if ((r -= t.w) <= 0) return t.tier;
  }
  return "normal";
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function swapAt(arr, i, j) {
  const copy = arr.slice();
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

function sampleWithout(array, n, excludeId) {
  const pool = array.filter((x) => x.id !== excludeId);
  return shuffle(pool).slice(0, n);
}

// NEW: rotate a cycle of indices (3 or 4 cards at once)
function rotateCycle(arr, indices) {
  const copy = arr.slice();
  const last = copy[indices[indices.length - 1]];
  for (let i = indices.length - 1; i > 0; i--) {
    copy[indices[i]] = copy[indices[i - 1]];
  }
  copy[indices[0]] = last;
  return copy;
}

// NEW: pick distinct indices; optionally force-include one index
function pickDistinct(count, max, mustIncludeIndex) {
  const set = new Set();
  if (typeof mustIncludeIndex === "number" && mustIncludeIndex >= 0) {
    set.add(mustIncludeIndex);
  }
  while (set.size < count) {
    set.add(Math.floor(Math.random() * max));
  }
  return Array.from(set);
}

function clampSpeedMs(ms) {
  return Math.min(SPEED_LIMITS.maxMs, Math.max(SPEED_LIMITS.minMs, ms));
}

// NEW: decide cycle size by difficulty
function getCycleSize(cardCount, round) {
  if (round >= 10) {
    const r = Math.random();
    if (r < 0.45) return 3;
    if (r < 0.85) return 3;
    return 2;
  }
  if (round >= 7) {
    return Math.random() < 0.65 ? 3 : 2;
  }
  return 2;
}

function drawPowerUp(excludeIds = []) {
  // Try to pick a tier, then a card not excluded
  for (let attempts = 0; attempts < 10; attempts++) {
    const tier = rollTier();
    const pool = POWER_UPS[tier].filter((p) => !excludeIds.includes(p.id));
    if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
  }
  // Fallback to any available
  const all = [
    ...POWER_UPS.normal,
    ...POWER_UPS.epic,
    ...POWER_UPS.legendary,
  ].filter((p) => !excludeIds.includes(p.id));
  return all[Math.floor(Math.random() * all.length)];
}

function drawDraftPicks(count, excludeIds = []) {
  const picks = [];
  const used = new Set(excludeIds);
  while (picks.length < count) {
    const p = drawPowerUp([...used]);
    if (!p) break;
    picks.push(p);
    used.add(p.id);
  }
  return picks;
}

// Aggregate active modifiers from inventory for a nextRound
function getActiveModifiers(inventory, nextRound) {
  const agg = {
    delayMsAdd: 0, // +ms to slow shuffles
    scoreFactor: 1, // × score
    swapsDelta: 0, // ± total shuffles
  };
  for (const p of inventory) {
    const fx = p.effect || {};
    if (fx.delayMsAdd) agg.delayMsAdd += fx.delayMsAdd;
    if (fx.scoreFactor) agg.scoreFactor *= fx.scoreFactor;
    if (fx.swapsDelta) agg.swapsDelta += fx.swapsDelta;
  }
  return agg;
}

export default function SpellShuffle() {
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [cards, setCards] = useState([]);
  const [targetId, setTargetId] = useState(null);
  const [targetName, setTargetName] = useState(null);
  const [phase, setPhase] = useState("init"); // init | enter | showTarget | cover | shuffling | guess | result | gameover
  const [shufflesLeft, setShufflesLeft] = useState(0);
  const [speedMs, setSpeedMs] = useState(computeDifficulty(1).speed); // CHANGED: start at Slow
  const baseRoundMultiplierRef = useRef(1); // NEW: base tier multiplier for scoring
  const [clickedId, setClickedId] = useState(null);
  const [tossingId, setTossingId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [showTips, setShowTips] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [heroOut, setHeroOut] = useState(false);
  const [enterDelayMs, setEnterDelayMs] = useState(700); // NEW: phase enter delay
  const { multiplier: currentMultiplier } = getSpeedMeta(speedMs);
  const displayScore = Math.round(score * 10) / 10; // Tidy score display
  const [inventory, setInventory] = useState([]); // array of power-up objects
  const [draftPicks, setDraftPicks] = useState([]);
  const [modPreview, setModPreview] = useState(null); // NEW: last compute vs modified
  const [showModPreview, setShowModPreview] = useState(false); // NEW: panel visibility
  const shufflesPerSec = Math.round((1000 / speedMs) * 10) / 10; // Human-readable speed
  const speedLabel =
    shufflesPerSec >= 3
      ? "Very fast"
      : shufflesPerSec >= 2
      ? "Fast"
      : shufflesPerSec >= 1.2
      ? "Normal"
      : "Slow";
  const [tooltip, setTooltip] = useState({
    // NEW: inventory tooltip
    visible: false,
    x: 0,
    y: 0,
    item: null,
  });
  const [inventoryOpen, setInventoryOpen] = useState(false); // NEW: bottom drawer open/close
  const [lastGain, setLastGain] = useState(0); // NEW: show +points bubble
  const STATUS_CHIME_PHASES = new Set([
    "init",
    "enter",
    "showTarget",
    "ready",
    "guess",
    "draft",
  ]);
  const { pathname, search } = useLocation();
  const isSpellShuffle = pathname.startsWith("/spell-shuffle");
  // Force intro gate when ?intro is present in the URL (from Home CTA)
  const forceIntroGate = useMemo(
    () => new URLSearchParams(search).has("intro"),
    [search]
  );
  const [introGateDone, setIntroGateDone] = useState(!forceIntroGate);
  const [musicVolume, setMusicVolume] = useState(0.6);
  const [musicMuted, setMusicMuted] = useState(false);
  const [musicPopoverOpen, setMusicPopoverOpen] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(audio.unlocked || false); // NEW
  const musicPopoverCloseTimer = useRef(null);
  const MIN_LOADER_MS = 1200;
  const [minLoaderDone, setMinLoaderDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMinLoaderDone(true), MIN_LOADER_MS);
    return () => clearTimeout(t);
  }, []);

  // Safe guards for audio (require preloaded buffers)
  const canPlay = (key) =>
    assetsReady &&
    audioUnlocked &&
    (typeof audio.has !== "function" || audio.has(key));
  const playSafe = (key, opts) => {
    if (canPlay(key)) audio.play(key, opts);
  };
  const playMusicSafe = (key, opts) => {
    if (canPlay(key)) audio.playMusic(key, opts);
  };
  const crossfadeMusicSafe = (key, opts) => {
    if (canPlay(key)) audio.crossfadeMusic(key, opts);
  };

  const openMusicPopover = () => {
    if (musicPopoverCloseTimer.current) {
      clearTimeout(musicPopoverCloseTimer.current);
      musicPopoverCloseTimer.current = null;
    }
    setMusicPopoverOpen(true);
  };
  const scheduleCloseMusicPopover = () => {
    if (musicPopoverCloseTimer.current)
      clearTimeout(musicPopoverCloseTimer.current);
    musicPopoverCloseTimer.current = setTimeout(() => {
      setMusicPopoverOpen(false);
      musicPopoverCloseTimer.current = null;
    }, 150); // small grace to cross the gap
  };

  // Refs for timers and intervals
  const startOverlayTimerRef = useRef(null);
  const startRoundTimerRef = useRef(null); // NEW: delay kickoff until curtains are in
  const lastCardCountRef = useRef(0);
  const lastBaseSpeedRef = useRef(computeDifficulty(1).speed);
  const lastBaseSwapsRef = useRef(computeDifficulty(1).swaps);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);
  // const targetShuffleCountRef = useRef(0);
  const totalShufflesRef = useRef(0);
  const minTargetShuffleFracRef = useRef(1 / 3);
  const revealBonusMsRef = useRef(0);
  const scoringFactorRef = useRef(1);
  const modPanelTimerRef = useRef(null); // NEW: auto-hide timer for mods panel
  const wasStartingRef = useRef(false);
  const prevVisibleRef = useRef(0);
  const lastHoverAtRef = useRef(0); // NEW: throttle hover SFX
  const roundPointsRef = useRef(1); // NEW: canonical points for this round
  const continueAfterDraftRef = useRef(false); // NEW: gate curtain until draft closes

  // Shuffle progress
  const totalShuffles = totalShufflesRef.current || 0;
  const doneShuffles = Math.max(0, totalShuffles - Math.max(shufflesLeft, 0));
  const progressPct = totalShuffles
    ? Math.min(100, Math.round((doneShuffles / totalShuffles) * 100))
    : 0;
  const lastSpeedLabelSfxRef = useRef(speedLabel);

  // Build asset lists
  const audioManifest = useMemo(
    () => ({
      ost_title: { url: "/sounds/ost_title.mp3", category: "music", volume: 1 },
      ost_game: { url: "/sounds/ost_game.mp3", category: "music", volume: 1 },
      curtain_in: {
        url: "/sounds/curtain_in.mp3",
        category: "sfx",
        volume: 0.9,
      },
      curtain_out: {
        url: "/sounds/curtain_out.mp3",
        category: "sfx",
        volume: 0.5,
      },
      status_changed: {
        url: "/sounds/status_changed.mp3",
        category: "sfx",
        volume: 0.5,
      },
      card_flip: { url: "/sounds/card_flip.mp3", category: "sfx", volume: 1 },
      card_shuffle: {
        url: "/sounds/card_shuffle.mp3",
        category: "sfx",
        volume: 1,
      },
      card_placed: {
        url: "/sounds/card_placed.mp3",
        category: "sfx",
        volume: 1,
      },
      card_hover: {
        url: "/sounds/card_hover.mp3",
        category: "ui",
        volume: 0.5,
      },
      speed_changed: {
        url: "/sounds/speed_changed.mp3",
        category: "sfx",
        volume: 0.5,
      },
      correct_guess: {
        url: "/sounds/correct_guess.mp3",
        category: "sfx",
        volume: 0.7,
      },
      wrong_guess: {
        url: "/sounds/wrong_guess.mp3",
        category: "sfx",
        volume: 0.7,
      },
      button_click: {
        url: "/sounds/button_click.mp3",
        category: "ui",
        volume: 0.5,
      },
      general_hover: {
        url: "/sounds/general_hover.mp3",
        category: "ui",
        volume: 0.5,
      },
      general_click: {
        url: "/sounds/general_click.mp3",
        category: "ui",
        volume: 1,
      },
      boon_picked: {
        url: "/sounds/boon_picked.mp3",
        category: "sfx",
        volume: 0.5,
      },
      boon_draft_opened: {
        url: "/sounds/boon_draft_opened.mp3",
        category: "sfx",
        volume: 0.8,
      },
      card_highlighted: {
        url: "/sounds/card_highlighted.mp3",
        category: "ui",
        volume: 0.3,
      },
    }),
    []
  );

  const imageAssets = useMemo(
    () =>
      Array.from(
        new Set([
          "/images/bg.png",
          "/images/hero.png",
          "/images/cards/back.png",
          ...BASE_CARDS.map((c) => c.img),
        ])
      ),
    []
  );

  const {
    ready: assetsReady,
    progress,
    total,
  } = useAssetPreloader({
    audioManifest,
    imageUrls: imageAssets,
  });
  const loadingTip = LOADING_TIPS[(progress || 0) % LOADING_TIPS.length];
  const showLoading =
    !introGateDone || !assetsReady || !minLoaderDone || !audioUnlocked;

  // Initialize audio context, watch unlock
  useEffect(() => {
    const off = audio.onUnlock(() => setAudioUnlocked(true));
    audio.setCategoryVolume("music", musicMuted ? 0 : musicVolume);
    audio.setCategoryVolume("sfx", 0.9);
    audio.setCategoryVolume("ui", 0.8);
    return () => off && off();
  }, [musicMuted, musicVolume]);

  // Start/stop OST based on route + readiness + unlock (robust re-entry)
  useEffect(() => {
    const intendedKey =
      isSpellShuffle && assetsReady && audioUnlocked
        ? phase === "init"
          ? "ost_title"
          : "ost_game"
        : null;

    audio.whenUnlocked(() => {
      // Left the route → stop Spell Shuffle music
      if (!isSpellShuffle) {
        if (
          audio.music.current &&
          ["ost_game", "ost_title"].includes(audio.music.current.key)
        ) {
          audio.music.current.stop(250);
        }
        return;
      }

      // Not ready or still locked → ensure no OST is lingering
      if (!assetsReady || !audioUnlocked) {
        if (
          audio.music.current &&
          ["ost_game", "ost_title"].includes(audio.music.current.key)
        ) {
          audio.music.current.stop(250);
        }
        return;
      }

      // Ready: ensure the correct track is playing (don’t rely on current being null)
      if (intendedKey && canPlay(intendedKey)) {
        if (audio.music.current?.key !== intendedKey) {
          crossfadeMusicSafe(intendedKey, {
            fadeMs: 450,
            loop: true,
            volume: musicMuted ? 0 : musicVolume,
          });
        } else if (
          audio.music.current &&
          audio.music.current.isPlaying === false
        ) {
          // Edge case: manager kept a stopped handle; resume it
          audio.music.current.play?.({
            fadeMs: 200,
            loop: true,
            volume: musicMuted ? 0 : musicVolume,
          });
        }
      }
    });
  }, [isSpellShuffle, assetsReady, audioUnlocked, phase]); // volume handled by separate effect

  // Keep audio category volume in sync with UI
  useEffect(() => {
    audio.setCategoryVolume("music", musicMuted ? 0 : musicVolume);
  }, [musicMuted, musicVolume]);

  // Also stop OST on unmount (safety)
  useEffect(() => {
    return () => {
      if (
        audio.music.current &&
        ["ost_game", "ost_title"].includes(audio.music.current.key)
      ) {
        audio.music.current.stop(250);
      }
    };
  }, []);

  // Play card hover SFX (throttled)
  const playCardHover = () => {
    if (phase !== "guess") return;
    const now = performance.now();
    if (now - lastHoverAtRef.current < 90) return; // ~90ms throttle
    lastHoverAtRef.current = now;
    audio.play("card_hover", {
      category: "ui",
      volume: 0.7,
      oneAtATime: true, // avoid stacking
      rate: 0.96 + Math.random() * 0.08, // slight pitch variance
    });
  };

  const [curtainMeta, setCurtainMeta] = useState({
    round: 1,
    cards: computeDifficulty(1).count,
    showCards: false,
  });

  // Play SFX when any curtain chip (cards/speed/shuffles) is displayed
  useEffect(() => {
    if (!isStarting) return;
    if (
      curtainMeta.showCards ||
      curtainMeta.showSpeed ||
      curtainMeta.showSwaps
    ) {
      audio.play("speed_changed", {
        category: "sfx",
        oneAtATime: true,
        volume: 0.8,
      });
    }
  }, [
    isStarting,
    curtainMeta.round,
    curtainMeta.showCards,
    curtainMeta.showSpeed,
    curtainMeta.showSwaps,
  ]);

  // Phase → SFX (fires once per phase change)
  const lastPhaseRef = useRef(null);
  useEffect(() => {
    if (phase === lastPhaseRef.current) return;
    const prev = lastPhaseRef.current;
    lastPhaseRef.current = phase;

    // Status chime (only after assets are ready)
    if (STATUS_CHIME_PHASES.has(phase)) {
      playSafe("status_changed", { category: "sfx", oneAtATime: true });
    }

    switch (phase) {
      case "init":
        if (isSpellShuffle) {
          crossfadeMusicSafe("ost_title", { fadeMs: 600, loop: true });
        }
        break;
      case "enter":
        if (prev === "init" && isSpellShuffle) {
          crossfadeMusicSafe("ost_game", { fadeMs: 800, loop: true });
        }
        break;
      default:
        break;
    }
  }, [phase]);

  // Speed tone classes
  function speedBadgeClass(label) {
    switch (label) {
      case "Very fast":
        return "bg-rose-400/10 text-rose-200 border-rose-400/30";
      case "Fast":
        return "bg-orange-400/10 text-orange-200 border-orange-400/30";
      case "Normal":
        return "bg-amber-300/10 text-amber-200 border-amber-300/30";
      default:
        return "bg-slate-300/10 text-slate-200 border-slate-200/30";
    }
  }

  // Sequential chip entrance variants (top → bottom)
  const chipStackVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.14, delayChildren: 0.06 },
    },
  };

  const chipVariants = {
    hidden: { y: 8, opacity: 0, scale: 0.98 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.25, ease: "easeOut" },
    },
  };

  // Reset all power-ups and their aggregated refs
  function clearPowerUps() {
    setInventory([]);
    setDraftPicks([]);
    // setReplacingIndex(null); // removed: no replace flow
    // minTargetShuffleFracRef.current = 1 / 3;
    revealBonusMsRef.current = 0;
    scoringFactorRef.current = 1;
  }

  // Clear only phase timers (used by the phase effect)
  function clearPhaseTimers() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  // Helpers to toggle mute and change volume
  function toggleMusicMute() {
    // clicking toggles between muted and last non-zero volume (default 0.6)
    if (musicMuted || musicVolume === 0) {
      setMusicMuted(false);
      const v = lastNonZeroMusicVolRef.current || 0.6;
      setMusicVolume(v);
    } else {
      setMusicMuted(true);
    }
    audio.play("general_click", { category: "ui", oneAtATime: true });
  }

  // Helper: should draft after finishing rounds 3, 6, 9, 12 (if inventory not full)
  function shouldOpenDraft(currentRound, inv) {
    return currentRound % 3 === 0 && (inv?.length ?? 0) < 4;
  }

  function handleMusicVolumeChange(e) {
    const v = Math.max(0, Math.min(1, parseFloat(e.target.value)));
    setMusicVolume(v);
    if (v <= 0.001) {
      setMusicMuted(true);
    } else {
      setMusicMuted(false);
      lastNonZeroMusicVolRef.current = v;
    }
  }

  useEffect(() => {
    if (wasStartingRef.current && !isStarting) {
      // overlay is starting to exit now → panels slide out
      // Curtain out
      audio.play("curtain_out", { category: "sfx" });
    }
    wasStartingRef.current = isStarting;
  }, [isStarting]);

  useEffect(() => {
    if (phase !== "enter") {
      prevVisibleRef.current = visibleCount;
      return;
    }
    if (visibleCount > prevVisibleRef.current && visibleCount > 0) {
      const rate = 0.95 + Math.random() * 0.1; // slight pitch variation
      audio.play("card_placed", { category: "sfx", rate, volume: 1 });
    }
    prevVisibleRef.current = visibleCount;
  }, [visibleCount, phase]);

  // Clear everything (use for reset)
  function clearAllTimers() {
    clearPhaseTimers();
    if (startOverlayTimerRef.current) {
      clearTimeout(startOverlayTimerRef.current);
      startOverlayTimerRef.current = null;
    }
    if (startRoundTimerRef.current) {
      clearTimeout(startRoundTimerRef.current);
      startRoundTimerRef.current = null;
    }
    if (modPanelTimerRef.current) {
      clearTimeout(modPanelTimerRef.current);
      modPanelTimerRef.current = null;
    } // NEW
  }

  // Helper to compute label + SPS + multiplier from ms (for upcoming round preview and scoring)
  function getSpeedMeta(ms) {
    const sps = Math.round((1000 / ms) * 10) / 10;
    const label =
      sps >= 3
        ? "Very fast"
        : sps >= 2
        ? "Fast"
        : sps >= 1.2
        ? "Normal"
        : "Slow";
    // keep a UI multiplier if you show it elsewhere; not used for scoring
    const multiplier =
      label === "Very fast"
        ? 3
        : label === "Fast"
        ? 2
        : label === "Normal"
        ? 1
        : 0.5;
    return { label, sps, multiplier };
  }

  // NEW: base multiplier by round-block (0.5 → 3.0 cap)
  function getBaseMultiplierForRound(r) {
    const block = Math.floor((r - 1) / 3); // 0,1,2,3,4,...
    const base = 0.5 + 0.5 * Math.min(block, 5); // 0.5,1.0,1.5,2.0,2.5,3.0
    return +Math.min(3, base).toFixed(1);
  }

  // NEW: speed bonus from current speed label (after boons)
  function getSpeedBonusFromLabel(label) {
    return label === "Very fast"
      ? 3
      : label === "Fast"
      ? 2
      : label === "Normal"
      ? 1
      : 0;
  }

  // Format helpers (UI only)
  function pct(n) {
    return `${Math.round(n * 100)}%`;
  }
  function msToSec(ms) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  function fmtFrac(frac) {
    return `${Math.round(frac * 100)}%`;
  }
  function effectLines(effect = {}) {
    const lines = [];
    if (effect.delayMsAdd) lines.push(`+${effect.delayMsAdd}ms shuffle delay`);
    if (effect.swapsDelta)
      lines.push(
        `${effect.swapsDelta > 0 ? "+" : ""}${effect.swapsDelta} shuffles`
      );
    if (effect.scoreFactor) lines.push(`Score ×${effect.scoreFactor}`);
    if (!lines.length) lines.push("No additional effects");
    return lines;
  }

  // Difficulty scaling (3-round blocks; caps cards at 12)
  function computeDifficulty(r) {
    // Block: 0 = rounds 1-3, 1 = 4-6, 2 = 7-9, 3 = 10-12, etc.
    const block = Math.floor((r - 1) / 3);

    // Cards per block (cap at 12)
    const countSeq = [4, 6, 8, 10, 12];
    const count = countSeq[Math.min(block, countSeq.length - 1)];

    // Base speed per block (ms) → aligns with getSpeedMeta thresholds:
    // Slow(<1.2sps), Normal(>=1.2), Fast(>=2), Very fast(>=3)
    const speedTable = [1000, 700, 450, 300]; // Slow, Normal, Fast, Very fast
    let speed;
    if (r <= 12) {
      speed =
        block < speedTable.length
          ? speedTable[block]
          : speedTable[speedTable.length - 1];
    } else {
      const base = 300;
      const extraRounds = r - 12;
      speed = Math.max(SPEED_LIMITS.minMs, base - extraRounds * 20);
    }

    // Base swaps per block; after block 4, add +2 per block
    const swapsTable = [8, 12, 16, 20, 24];
    let swaps =
      block < swapsTable.length
        ? swapsTable[block]
        : swapsTable[swapsTable.length - 1] +
          (block - (swapsTable.length - 1)) * 2;

    return { count, speed, swaps };
  }

  function clearTimers() {
    clearPhaseTimers();
  }

  // Prepare and start a specific round (button-driven)
  function startRound(nextRound = 1) {
    clearPhaseTimers();

    const { count, speed, swaps } = computeDifficulty(nextRound);

    // APPLY ACTIVE MODIFIERS (rebalance)
    const mods = getActiveModifiers(inventory, nextRound);
    const rawMs = speed + (mods.delayMsAdd || 0);
    const modSpeed = clampSpeedMs(rawMs);
    const modSwaps = Math.max(0, swaps + (mods.swapsDelta || 0));
    scoringFactorRef.current = mods.scoreFactor || 1;

    // Build preview (now use base + speed-bonus → points)
    const baseMeta = getSpeedMeta(speed);
    const modMeta = getSpeedMeta(modSpeed);

    const baseMult = getBaseMultiplierForRound(nextRound);
    const speedBonus = getSpeedBonusFromLabel(modMeta.label);

    baseRoundMultiplierRef.current = baseMult; // now stores base multiplier for round

    const canonicalPoints = +(
      (baseMult + speedBonus) *
      scoringFactorRef.current
    ).toFixed(1);
    roundPointsRef.current = canonicalPoints; // single source of truth

    setModPreview({
      base: {
        speedMs: speed,
        sps: baseMeta.sps,
        swaps,
        baseMult,
      },
      mod: {
        speedMs: modSpeed,
        sps: modMeta.sps,
        swaps: modSwaps,
        speedBonus,
        powMult: scoringFactorRef.current,
      },
      totalPoints: canonicalPoints,
    });

    // Build round cards
    const target = BASE_CARDS[Math.floor(Math.random() * BASE_CARDS.length)];
    const distractors = sampleWithout(BASE_CARDS, count - 1, target.id);
    const subset = shuffle([target, ...distractors]);

    setCards(subset);
    setTargetId(target.id);
    setTargetName(target.name);
    setRound(nextRound);
    setShufflesLeft(modSwaps);
    totalShufflesRef.current = modSwaps;
    setSpeedMs(modSpeed);
    setClickedId(null);
    setVisibleCount(0);

    const showCardsIncreased = (lastCardCountRef.current ?? 0) < count;
    lastCardCountRef.current = count;

    // Curtains / hold time: extend if any base stat changed
    const cardsChanged = (lastCardCountRef.current ?? 0) < count;
    const speedChanged = (lastBaseSpeedRef.current ?? speed) > speed; // faster (ms down)
    const swapsChanged = (lastBaseSwapsRef.current ?? 0) < swaps;

    // Update "last" refs to new base values for subsequent comparisons
    lastCardCountRef.current = count;
    lastBaseSpeedRef.current = speed;
    lastBaseSwapsRef.current = swaps;

    const baseCurtainHoldMs = 900;
    const hasChips = cardsChanged || speedChanged || swapsChanged;
    const overlayHideMs = baseCurtainHoldMs + (hasChips ? 2000 : 0); // keep curtain closed +2000ms when showing chips

    const extraHold = overlayHideMs - baseCurtainHoldMs;
    setEnterDelayMs(700 + extraHold);

    if (startOverlayTimerRef.current)
      clearTimeout(startOverlayTimerRef.current);
    startOverlayTimerRef.current = setTimeout(() => {
      setIsStarting(false);
      setShowModPreview(inventory.length > 0);
    }, overlayHideMs);

    setPhase("enter");
  }
  // Phase machine (timed transitions)
  useEffect(() => {
    clearTimers();

    if (phase === "enter") {
      // use the dynamic enterDelayMs instead of a fixed 700ms
      timerRef.current = setTimeout(() => {
        intervalRef.current = setInterval(() => {
          setVisibleCount((v) => {
            const next = Math.min(v + 1, cards.length);
            if (next === cards.length) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
              timerRef.current = setTimeout(() => setPhase("showTarget"), 1000);
            }
            return next;
          });
        }, 250);
      }, enterDelayMs);
    } else if (phase === "showTarget") {
      audio.play("card_highlighted", { category: "ui", oneAtATime: true });
      // After minimum reveal, pause in 'ready' until user begins shuffling
      timerRef.current = setTimeout(
        () => setPhase("ready"),
        2000 + (revealBonusMsRef.current || 0)
      );
    } else if (phase === "ready") {
      // No timers; user decides when to proceed
    } else if (phase === "cover") {
      audio.play("card_flip", {
        category: "sfx",
        oneAtATime: true,
      });
      timerRef.current = setTimeout(() => setPhase("shuffling"), 1500);
    } else if (phase === "shuffling") {
      if (shufflesLeft <= 0) {
        setPhase("guess");
      } else {
        timerRef.current = setTimeout(() => {
          audio.play("card_shuffle", {
            category: "sfx",
            oneAtATime: true,
          });

          setCards((prev) => {
            if (prev.length < 2) return prev;

            // Simple random swap/rotate; no forced target inclusion
            const size = getCycleSize(prev.length, round);
            const indices = pickDistinct(size, prev.length);

            if (size === 2) {
              const [i, j] = indices;
              return swapAt(prev, i, j);
            }
            return rotateCycle(prev, indices);
          });

          setShufflesLeft((n) => n - 1);
        }, speedMs);
      }
    }

    return clearPhaseTimers;
  }, [phase, shufflesLeft, speedMs, round, targetId, cards.length]);

  function handleGuess(id) {
    if (phase !== "guess") return;
    setClickedId(id);
    audio.play("card_flip", { category: "sfx" });

    if (id === targetId) {
      const total = roundPointsRef.current; // canonical points for this round
      setLastGain(total);
      setScore((s) => s + total);
      audio.play("correct_guess", { category: "sfx" });
      setPhase("result");
    } else {
      audio.play("wrong_guess", { category: "sfx" });
      setLastGain(0);
      setPhase("gameover");
    }
  }

  // Drafting
  function openDraft() {
    // Force curtain to stay open until user selects/skip a boon
    setIsStarting(false);

    // If full, skip draft entirely
    if (inventory.length >= 4) {
      continueToNextRound();
      return;
    }
    // 3 random picks, avoid duplicates already owned
    const ownedIds = inventory.map((p) => p.id);
    const picks = drawDraftPicks(3, ownedIds);
    audio.play("boon_draft_opened", { category: "sfx" });
    setDraftPicks(picks);
    setPhase("draft"); // NEW phase
  }

  function continueToNextRound() {
    // Curtain in only happens here (after boon chosen or skip)
    audio.play("curtain_in", { category: "sfx" });

    const next = round + 1;
    primeCurtainForRound(next);
    setIsStarting(true);
    setHeroOut(false);
    if (startRoundTimerRef.current) clearTimeout(startRoundTimerRef.current);
    startRoundTimerRef.current = setTimeout(() => {
      startRound(next);
    }, 520);
  }

  function goToNextRound() {
    // If a boon draft should appear, DO NOT close curtains yet — open draft first
    if (shouldOpenDraft(round, inventory)) {
      openDraft();
      return;
    }
    continueToNextRound();
  }

  // Start the game from hero (always round 1) using curtains, not onExitComplete
  function startGameFromHero() {
    // audio.play("click", { category: "ui" });
    // curtain in
    audio.play("curtain_in", { category: "sfx", fadeInMs: 60 });

    // Prep curtain meta for Round 1
    primeCurtainForRound(1);
    // Show curtains and exit hero
    setIsStarting(true);
    setHeroOut(true);

    // Kick off the round only after curtains finish sliding in
    if (startRoundTimerRef.current) clearTimeout(startRoundTimerRef.current);
    startRoundTimerRef.current = setTimeout(() => {
      startRound(1);
      // Debugging, start from round 3
      // startRound(3);
    }, 520); // match curtain slide-in
  }

  function resetGame() {
    clearTimers();
    clearAllTimers(); // ensure overlay/start timers are cleared
    setShowModPreview(false); // NEW
    setModPreview(null); // NEW
    setTooltip({ visible: false, x: 0, y: 0, item: null }); // NEW
    setScore(0);
    setRound(1);
    setCards([]);
    setTargetId(null);
    setTargetName(null);
    setClickedId(null);
    setShufflesLeft(0);
    setSpeedMs(computeDifficulty(1).speed); // CHANGED: reset to Slow base
    setIsStarting(false);
    setHeroOut(false);
    setVisibleCount(0);
    setEnterDelayMs(700);
    // targetShuffleCountRef.current = 0;
    totalShufflesRef.current = 0;
    lastCardCountRef.current = 0;
    clearPowerUps();
    setCurtainMeta({
      round: 1,
      cards: computeDifficulty(1).count,
      showCards: false, // keep hidden on first round
    });
    setPhase("init");
  }

  // Helpers
  function showFrontForCard(id) {
    // During enter, showTarget, and ready: ALL are face up
    if (phase === "enter" || phase === "showTarget" || phase === "ready")
      return true;
    if (phase === "result") return id === clickedId || id === targetId;
    if (phase === "gameover") return id === targetId || id === clickedId;
    return false; // cover, shuffling, guess
  }
  const isClickable = phase === "guess";
  const twoRowsMd = cards.length > 7;

  function primeCurtainForRound(nextRound) {
    const next = computeDifficulty(nextRound);

    const isFirstRound = nextRound === 1;
    const showCards =
      !isFirstRound && (lastCardCountRef.current ?? 0) < next.count;
    const showSpeed = (lastBaseSpeedRef.current ?? next.speed) > next.speed; // ms down = faster
    const showSwaps = (lastBaseSwapsRef.current ?? 0) < next.swaps;

    setCurtainMeta({
      round: nextRound,

      // Cards
      cards: next.count,
      cardsPrev: isFirstRound
        ? next.count
        : lastCardCountRef.current || next.count,
      showCards,

      // Base shuffle delay (ms)
      speed: next.speed,
      speedPrev: lastBaseSpeedRef.current || next.speed,
      showSpeed,

      // Total shuffles
      swaps: next.swaps,
      swapsPrev: lastBaseSwapsRef.current || next.swaps,
      showSwaps,
    });
  }

  function AnimatedDots() {
    return (
      <span className="inline-flex w-5 justify-between ml-1 align-baseline">
        <motion.span
          initial={{ opacity: 0.2 }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        >
          .
        </motion.span>
        <motion.span
          initial={{ opacity: 0.2 }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.15,
          }}
        >
          .
        </motion.span>
        <motion.span
          initial={{ opacity: 0.2 }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
        >
          .
        </motion.span>
      </span>
    );
  }

  // Keyboard shortcut: Enter or Space to start from hero screen
  useEffect(() => {
    function onKey(e) {
      if ((e.key === "Enter" || e.key === " ") && phase === "ready") {
        e.preventDefault();
        setPhase("cover");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  // Cursor-parallax for the background (translate + tilt)
  // Background parallax (scroll repeating pattern opposite to deck)
  const bgX = useMotionValue(0);
  const bgY = useMotionValue(0);
  const bgXSpring = useSpring(bgX, { stiffness: 120, damping: 20, mass: 0.5 });
  const bgYSpring = useSpring(bgY, { stiffness: 120, damping: 20, mass: 0.5 });
  const bgPosition = useMotionTemplate`${bgXSpring}px ${bgYSpring}px`;

  useEffect(() => {
    const isFinePointer =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(pointer: fine)").matches;
    const active = !isStarting && phase !== "init" && phase !== "draft";

    function resetBg() {
      bgX.set(0);
      bgY.set(0);
    }

    if (!isFinePointer) {
      resetBg();
      return;
    }

    const maxBgShift = 12; // px
    let raf = 0;
    let nx = 0;
    let ny = 0;

    const update = () => {
      raf = 0;
      // Opposite-direction background scroll for depth
      bgX.set(nx * -maxBgShift);
      bgY.set(ny * -maxBgShift);
    };

    function onMove(e) {
      if (!active) {
        resetBg();
        return;
      }
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      nx = (e.clientX - cx) / cx; // -1..1
      ny = (e.clientY - cy) / cy; // -1..1
      if (!raf) raf = requestAnimationFrame(update);
    }

    function onLeave() {
      resetBg();
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isStarting, phase]);

  // 1) Enhanced assets loading screen (now also hosts Start button)
  if (showLoading) {
    const pct = total ? Math.round((progress / total) * 100) : 0;
    const displayPct = assetsReady ? 100 : pct;
    const canShowStart =
      assetsReady && minLoaderDone && (!audioUnlocked || !introGateDone);

    return (
      <main>
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0e0b24] via-hp-royal to-[#0e0b24]">
          {/* Starfield (restored) */}
          <div className="pointer-events-none absolute inset-0 opacity-30">
            {[...Array(20)].map((_, i) => (
              <motion.span
                key={`star-${i}`}
                className="absolute w-[2px] h-[2px] rounded-full bg-amber-200/80"
                style={{
                  left: `${(i * 173) % 100}%`,
                  top: `${(i * 97) % 100}%`,
                  filter: "drop-shadow(0 0 6px rgba(255,214,127,0.6))",
                }}
                initial={{ opacity: 0.1, scale: 0.7 }}
                animate={{ opacity: [0.1, 0.9, 0.1], scale: [0.7, 1, 0.7] }}
                transition={{
                  duration: 2.2 + (i % 6) * 0.25,
                  repeat: Infinity,
                  delay: i * 0.08,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* Vignette glow (restored) */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_50%,rgba(255,214,127,0.14),transparent_60%)]" />

          <motion.div
            className="relative z-10 w-full max-w-md mx-auto rounded-2xl border border-amber-200/20 bg-black/35 backdrop-blur-md p-6 text-hp-ivory shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
            initial={{ y: 10, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {/* Crest (restored) */}
            <div className="flex items-center justify-center mb-4">
              <motion.div
                className="relative w-20 h-20 rounded-full bg-amber-200/10 border border-amber-200/30 grid place-items-center"
                animate={{ rotate: [0, 7, 0, -7, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Wand2 className="w-8 h-8 text-amber-200" />
                <span className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_30px_rgba(255,214,127,0.25)_inset]" />
              </motion.div>
            </div>

            <h2 className="text-2xl font-extrabold text-center">
              Loading Spell Shuffle
            </h2>

            <p className="text-sm opacity-80 text-center mt-1 mb-4">
              {canShowStart ? "Click to enter the game" : "Preparing assets…"}
              {!canShowStart && <span className="ml-1">{displayPct}%</span>}
            </p>

            <div className="relative h-3 w-full rounded-full bg-black/40 overflow-hidden border border-amber-200/20">
              <motion.div
                className="relative h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300"
                initial={{ width: 0 }}
                animate={{ width: `${displayPct}%` }}
                transition={{ type: "spring", stiffness: 160, damping: 24 }}
              >
                <motion.span
                  className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                  animate={{ x: ["-20%", "120%"] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            </div>

            <div className="mt-4 text-xs opacity-80 text-center">
              {loadingTip}
            </div>

            {/* Start button (unchanged) */}
            {canShowStart && (
              <motion.button
                type="button"
                className="cursor-pointer mt-5 w-full inline-flex items-center justify-center gap-3 px-6 py-3 rounded-full bg-amber-300/20 border border-amber-200/40 text-amber-50 hover:brightness-110 shadow-lg"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={async () => {
                  await audio.unlockNow();
                  setAudioUnlocked(true);
                  setIntroGateDone(true); // acknowledge the intro gate
                }}
                onKeyDown={async (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    await audio.unlockNow();
                    setAudioUnlocked(true);
                    setIntroGateDone(true); // acknowledge the intro gate
                  }
                }}
                title="Enable audio"
              >
                <Play className="w-5 h-5" />
                <span className="font-semibold">Enter Game</span>
              </motion.button>
            )}
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="relative min-h-screen flex items-center flex-col justify-center bg-hp-royal px-6 md:px-12 overflow-x-hidden">
        <motion.div
          className="absolute inset-0 bg-[url('/images/bg.png')] bg-repeat bg-auto opacity-20 pointer-events-none"
          style={{
            backgroundPosition: bgPosition, // cursor-parallax on pattern
          }}
        />

        {/* INIT: Hero title screen */}
        <AnimatePresence mode="wait" initial={true}>
          {phase === "init" && !heroOut && (
            <motion.section
              key="hero"
              className="relative z-10 max-w-5xl mx-auto text-center text-hp-ivory"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.98, filter: "blur(2px)" }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              {/* Soft glow behind */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-72 h-72 md:w-96 md:h-96 rounded-full bg-amber-300/25 blur-3xl opacity-20" />
              </div>

              {/* Sparkles */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {[...Array(12)].map((_, i) => (
                  <motion.span
                    key={i}
                    className="absolute w-[2px] h-[2px] rounded-full bg-amber-200/70"
                    style={{
                      left: `${(i * 83) % 100}%`,
                      top: `${(i * 37) % 100}%`,
                    }}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: [0, 1, 0], scale: [0.6, 1, 0.6] }}
                    transition={{
                      duration: 2.8 + (i % 5) * 0.3,
                      repeat: Infinity,
                      delay: i * 0.12,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-hp-royal/60 border border-hp-ivory/15 text-xs tracking-wider uppercase">
                  Hogwarts Ledger
                  <span className="block w-1 h-1 rounded-full bg-hp-ivory/40" />
                  Memory Trial
                </span>

                <h1 className="mt-4 text-5xl sm:text-7xl font-extrabold leading-tight">
                  <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400 bg-clip-text text-transparent drop-shadow">
                    Spell Shuffle
                  </span>
                </h1>

                <p className="mt-3 text-hp-ivory/80 max-w-2xl mx-auto font-bold text-lg">
                  Track the target spell through flips and shuffles. Focus.
                  Remember. Pick the right card.
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
                  <div className="px-3 py-1 rounded-full bg-hp-royal/60 border border-hp-ivory/15">
                    Up to 12 cards
                  </div>
                  <div className="px-3 py-1 rounded-full bg-hp-royal/60 border border-hp-ivory/15">
                    Speed: <span className="font-semibold">{speedLabel}</span>
                    <span className="ml-1 opacity-70">
                      ({shufflesPerSec}/s)
                    </span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-hp-royal/60 border border-hp-ivory/15">
                    Rounds:{" "}
                    <span className="font-semibold">get harder every 3</span>
                  </div>
                </div>

                <div className="mt-8 flex flex-col items-center justify-center gap-3">
                  <HpButton
                    onClick={() => {
                      startGameFromHero();
                      audio.play("button_click", {
                        category: "ui",
                        oneAtATime: true,
                      });
                    }}
                    onMouseEnter={() =>
                      audio.play("general_hover", {
                        category: "ui",
                        oneAtATime: true,
                      })
                    }
                    onFocus={() =>
                      audio.play("general_hover", {
                        category: "ui",
                        oneAtATime: true,
                      })
                    }
                    text={"Start Game"}
                  />

                  <Link to="/home">
                    <button
                      className="flex items-center gap-2 px-3 py-1 rounded-full bg-hp-royal/60 border border-hp-ivory/15 text-sm text-hp-ivory transition duration-200 hover:bg-hp-royal/80 hover:brightness-125 hover:shadow-lg cursor-pointer"
                      onClick={() =>
                        audio.play("general_click", {
                          category: "ui",
                          oneAtATime: true,
                        })
                      }
                      onMouseEnter={() =>
                        audio.play("general_hover", {
                          category: "ui",
                          oneAtATime: true,
                        })
                      }
                      onFocus={() =>
                        audio.play("general_hover", {
                          category: "ui",
                          oneAtATime: true,
                        })
                      }
                    >
                      <ArrowLeft className="w-4" />
                      <span>Back to Home</span>
                    </button>
                  </Link>

                  <span
                    className="text-sm cursor-pointer pt-6 hover:brightness-125"
                    onClick={() => {
                      setShowTips((s) => !s);
                      audio.play("general_click", {
                        category: "ui",
                        oneAtATime: true,
                      });
                    }}
                    onMouseEnter={() =>
                      audio.play("general_hover", {
                        category: "ui",
                        oneAtATime: true,
                      })
                    }
                    onFocus={() =>
                      audio.play("general_hover", {
                        category: "ui",
                        oneAtATime: true,
                      })
                    }
                    title={
                      inventoryOpen
                        ? "Hide Arsenal and modifiers"
                        : "Show Arsenal and modifiers"
                    }
                  >
                    {showTips ? "Hide how to play" : "How to play?"}
                  </span>
                </div>

                <AnimatePresence>
                  {showTips && (
                    <motion.div
                      className="mt-6 mx-auto max-w-2xl text-left bg-hp-royal/50 border border-hp-ivory/15 rounded-xl p-4 sm:p-5"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ul className="list-disc pl-5 space-y-2 text-hp-ivory/85 text-sm">
                        <li>Cards enter gradually. All face up at first.</li>
                        <li>We spotlight the target spell. Memorize it.</li>
                        <li>Cards flip down, then shuffle several times.</li>
                        <li>Pick the card that hides the target. One try.</li>
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.section>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {isStarting && (
            <motion.div
              className="fixed inset-0 z-40 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* Dim layer */}
              <motion.div
                className="absolute inset-0 bg-black/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              />
              {/* Radial glow */}
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                style={{
                  background:
                    "radial-gradient(80% 60% at 50% 50%, rgba(255,214,127,0.18), rgba(255,214,127,0.0) 60%)",
                }}
              />
              {/* Top curtain */}
              <motion.div
                className="absolute left-0 right-0 top-0 h-1/2 bg-hp-royal"
                initial={{ y: "-100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-100%" }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}
              />
              {/* Bottom curtain */}
              <motion.div
                className="absolute left-0 right-0 bottom-0 h-1/2 bg-hp-royal"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{ boxShadow: "0 -10px 30px rgba(0,0,0,0.4)" }}
              />
              {/* Title crest */}
              <motion.div
                className="absolute inset-0 grid place-items-center"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.05, opacity: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              >
                <div className="relative flex flex-col items-center gap-3">
                  {/* Round plaque (larger, more emphasis; no shine) */}
                  <motion.div
                    className="relative px-7 py-4 rounded-2xl border border-amber-300/50 bg-black/45 text-amber-200/95 shadow-[0_0_40px_rgba(255,214,127,0.18)_inset,0_0_24px_rgba(255,214,127,0.08)]"
                    initial={{ scale: 0.96, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <div className="text-[11px] uppercase tracking-wider opacity-85 text-amber-100/90 text-center">
                      Round
                    </div>
                    <div className="leading-none text-center mt-0.5">
                      <span className="text-4xl sm:text-5xl font-black drop-shadow">
                        {curtainMeta.round}
                      </span>
                    </div>
                  </motion.div>

                  {/* Staggered value chips (top → bottom) */}
                  <motion.div
                    className="flex flex-col items-center gap-2.5"
                    variants={chipStackVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {/* Cards chip (only when card count increased) */}
                    {curtainMeta.showCards && (
                      <motion.div
                        className="curtain-chip inline-flex items-center justify-center px-3 py-1.5 leading-none rounded-full border border-amber-200/40 bg-black/35 text-amber-100/95 text-sm shadow-[0_0_20px_rgba(0,0,0,0.25)]"
                        variants={chipVariants}
                      >
                        <span className="inline-flex items-center gap-2 align-middle">
                          <ArrowUp className="w-4 h-4 opacity-80 relative top-[0.5px]" />
                          <span>Cards:</span>
                          <span className="font-semibold opacity-90">
                            {curtainMeta.cardsPrev}
                          </span>
                          <span className="opacity-70">→</span>
                          <span className="new">{curtainMeta.cards}</span>
                        </span>
                      </motion.div>
                    )}

                    {/* Base shuffle delay chip (shows when faster than before) */}
                    {curtainMeta.showSpeed && (
                      <motion.div
                        className="curtain-chip inline-flex items-center justify-center px-3 py-1.5 leading-none rounded-full border border-amber-200/40 bg-black/35 text-amber-100/95 text-sm shadow-[0_0_20px_rgba(0,0,0,0.25)]"
                        variants={chipVariants}
                      >
                        <span className="inline-flex items-center gap-2 align-middle">
                          <ArrowUp className="w-4 h-4 opacity-80 relative top-[0.5px]" />
                          <span>Shuffle delay:</span>
                          <span className="font-semibold opacity-90">
                            {curtainMeta.speedPrev}ms
                          </span>
                          <span className="opacity-70">→</span>
                          <span className="new">{curtainMeta.speed}ms</span>
                        </span>
                      </motion.div>
                    )}

                    {/* Shuffles chip (only when increased) */}
                    {curtainMeta.showSwaps && (
                      <motion.div
                        className="curtain-chip inline-flex items-center justify-center px-3 py-1.5 leading-none rounded-full border border-amber-200/40 bg-black/35 text-amber-100/95 text-sm shadow-[0_0_20px_rgba(0,0,0,0.25)]"
                        variants={chipVariants}
                      >
                        <span className="inline-flex items-center gap-2 align-middle">
                          <ArrowUp className="w-4 h-4 opacity-80 relative top-[0.5px]" />
                          <span>Shuffles:</span>
                          <span className="font-semibold opacity-90">
                            {curtainMeta.swapsPrev}
                          </span>
                          <span className="opacity-70">→</span>
                          <span className="new">{curtainMeta.swaps}</span>
                        </span>
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* // HUD (persistent, above flow but below overlays) */}
        {phase !== "init" && !isStarting && (
          <AnimatePresence initial={false}>
            <motion.div
              key="hud" // stable key
              className="fixed top-3 left-1/2 -translate-x-1/2 z-30 w-full max-w-7xl px-4"
              initial={{ opacity: 0, y: -8, scale: 0.98, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, scale: 0.98, filter: "blur(2px)" }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              {/* Button to go back to home page */}
              <div
                className="absolute -bottom-12 "
                onClick={() => {
                  audio.play("general_click", {
                    category: "ui",
                    oneAtATime: true,
                  });
                }}
                onMouseEnter={() =>
                  audio.play("general_hover", {
                    category: "ui",
                    oneAtATime: true,
                  })
                }
                onFocus={() =>
                  audio.play("general_hover", {
                    category: "ui",
                    oneAtATime: true,
                  })
                }
              >
                <Link to="/home">
                  <button className="flex items-center cursor-pointer gap-2 px-3 py-1 rounded-full z-20 bg-hp-royal/60 border border-hp-ivory/15 text-sm text-hp-ivory transition duration-200 hover:bg-hp-royal/80 hover:brightness-125 hover:shadow-lg">
                    <ArrowLeft className="w-4" />
                    <span>Back to Home</span>
                  </button>
                </Link>
              </div>

              {/* OST volume control (bottom-right under HUD, hover to reveal slider) */}
              <div className="absolute -bottom-12 right-0 z-20 cursor-pointer">
                <div
                  className="relative inline-block cursor-pointer"
                  onMouseEnter={openMusicPopover}
                  onMouseLeave={scheduleCloseMusicPopover}
                  onFocusCapture={openMusicPopover} // keep open while slider focused
                  onBlurCapture={scheduleCloseMusicPopover}
                >
                  <button
                    type="button"
                    aria-expanded={musicPopoverOpen}
                    aria-label={
                      musicMuted || musicVolume === 0
                        ? "Unmute music"
                        : "Mute music"
                    }
                    onClick={toggleMusicMute}
                    className="cursor-pointer flex items-center gap-2 px-3 py-1 rounded-full bg-hp-royal/60 border border-hp-ivory/15 text-sm text-hp-ivory transition duration-200 hover:bg-hp-royal/80 hover:brightness-125 hover:shadow-lg"
                    onMouseEnter={() =>
                      audio.play("general_hover", {
                        category: "ui",
                        oneAtATime: true,
                      })
                    }
                  >
                    {musicMuted || musicVolume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : musicVolume > 0.66 ? (
                      <Volume2 className="w-4 h-4" />
                    ) : musicVolume > 0.33 ? (
                      <Volume1 className="w-4 h-4" />
                    ) : (
                      <Volume className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">
                      {musicMuted || musicVolume === 0
                        ? "Muted"
                        : `${Math.round(musicVolume * 100)}%`}
                    </span>
                  </button>

                  {/* Volume rocker (state-driven; no group-hover) */}
                  <div
                    className={[
                      "absolute right-0 cursor-pointer top-full mt-2 transition-all duration-150",
                      musicPopoverOpen
                        ? "opacity-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 translate-y-1 pointer-events-none",
                    ].join(" ")}
                    onMouseEnter={openMusicPopover}
                    onMouseLeave={scheduleCloseMusicPopover}
                  >
                    <div className="rounded-xl border border-hp-ivory/15 bg-hp-royal/80 backdrop-blur px-3 py-2 shadow-lg">
                      <div className="flex items-center gap-2">
                        <Volume className="w-4 h-4 text-hp-ivory/70" />
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={musicMuted ? 0 : musicVolume}
                          onChange={handleMusicVolumeChange}
                          className="w-36 accent-amber-300 cursor-pointer"
                          aria-label="Music volume"
                        />
                        <Volume2 className="w-4 h-4 text-hp-ivory/70" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <motion.div
                className="w-full flex flex-wrap gap-3 items-center rounded-2xl border border-hp-ivory/15 bg-hp-royal/60 backdrop-blur px-4 sm:px-6 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                layout
                transition={{
                  layout: { type: "spring", stiffness: 260, damping: 28 },
                }}
              >
                {/* Round (primary) */}
                <div className="px-3 py-2 rounded-xl bg-black/20 border border-hp-ivory/20 text-hp-ivory">
                  <span className="uppercase tracking-wider text-xs opacity-70">
                    Round
                  </span>
                  <span className="ml-2 font-bold text-lg align-middle">
                    {round}
                  </span>
                </div>
                {/* Score + multiplier (prominent) */}
                <div className="px-3 py-2 rounded-xl bg-black/20 border border-hp-ivory/20 text-hp-ivory flex items-center gap-2">
                  <span className="uppercase tracking-wider text-xs opacity-70">
                    Score
                  </span>
                  <span className="font-extrabold text-xl">{displayScore}</span>
                  <span className="text-xs opacity-75">•</span>
                  <span className="text-sm">
                    x{modPreview.totalPoints.toFixed(1)}
                  </span>
                </div>
                {/* Speed chip (color-coded, animates on tier change) */}
                <motion.div
                  key={speedLabel}
                  className={[
                    "px-3 py-2 rounded-xl border text-sm",
                    speedBadgeClass(speedLabel),
                  ].join(" ")}
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <span className="uppercase tracking-wider text-[11px] opacity-80 mr-2">
                    Speed
                  </span>
                  <span className="font-semibold">{speedLabel}</span>
                  <span className="ml-2 opacity-70 text-xs">
                    ({shufflesPerSec}/s)
                  </span>
                </motion.div>
                {/* Cards count */}
                <div className="px-3 py-2 rounded-xl bg-black/20 border border-hp-ivory/20 text-hp-ivory">
                  <span className="uppercase tracking-wider text-xs opacity-70">
                    Cards
                  </span>
                  <span className="ml-2 font-semibold">
                    {cards.length || "-"}
                  </span>
                </div>
                {/* Shuffles meter (grows as shuffles progress) */}
                <div className="ml-auto md:min-w-[200px] flex-1 sm:flex-none">
                  <div className="px-3 py-2 rounded-xl bg-black/20 border border-hp-ivory/20">
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-hp-ivory/70">
                      <span>Shuffles</span>
                      <span>
                        {doneShuffles}/{totalShuffles || 0}
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-hp-ivory/10 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{
                          type: "spring",
                          stiffness: 180,
                          damping: 24,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Status (flow-based, sits under HUD, still above overlays) */}
        {phase !== "init" && (
          <AnimatePresence mode="popLayout">
            <motion.div
              key="status-root" // stable: no phase/targetName to prevent remount/restart
              className=" z-[60] mx-auto max-w-6xl min-w-2xl md:min-w-auto px-4 fixed top-60 md:top-40 left-1/2 -translate-x-1/2"
              initial={{ opacity: 0, y: -6, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="flex justify-center">
                <motion.div
                  className={[
                    "status-chip",
                    "relative overflow-visible inline-flex items-center gap-3 rounded-2xl border px-2 py-2 sm:px-4 sm:py-3 shadow-lg backdrop-blur pointer-events-none",
                    "w-full max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-4xl",
                    phase === "result"
                      ? "bg-emerald-500/10 border-emerald-300/30 text-emerald-100"
                      : phase === "gameover"
                      ? "bg-rose-500/10 border-rose-300/30 text-rose-100"
                      : phase === "showTarget"
                      ? "bg-amber-400/10 border-amber-300/30 text-amber-100"
                      : phase === "guess"
                      ? "bg-blue-400/10 border-blue-300/30 text-blue-100"
                      : "bg-black/30 border-hp-ivory/20 text-hp-ivory/90",
                  ].join(" ")}
                  variants={{
                    idle: { scale: 1, x: 0 },
                    success: {
                      scale: [1, 1.05, 1],
                      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                    },
                    fail: {
                      x: [0, -6, 6, -4, 4, 0],
                      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                    },
                  }}
                  initial={false}
                  animate={
                    phase === "result"
                      ? "success"
                      : phase === "gameover"
                      ? "fail"
                      : "idle"
                  }
                >
                  {/* Inline FX spans: mount once per phase; no AnimatePresence */}
                  {phase === "result" && (
                    <>
                      <span className="fx fx-ring success-sm" />
                      <span className="fx fx-ring success-lg" />
                      <span className="fx fx-shine" />
                    </>
                  )}
                  {phase === "gameover" && (
                    <>
                      <span className="fx fx-ring fail" />
                      <span className="fx fx-crack a" />
                      <span className="fx fx-crack b" />
                    </>
                  )}

                  {/* +points bubble stays as-is */}
                  <AnimatePresence>
                    {phase === "result" && lastGain > 0 && (
                      <motion.div
                        className="absolute -top-2 -right-2 px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-400/20 border border-emerald-300/40 text-emerald-100 shadow"
                        initial={{ y: 8, opacity: 0, scale: 0.9 }}
                        animate={{ y: -6, opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                      >
                        +{lastGain.toFixed(1)}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.span
                    aria-hidden
                    animate={{ y: [0, -2, 0] }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="text-lg"
                  >
                    {phase === "enter" && "🔮"}
                    {phase === "showTarget" && "🎯"}
                    {phase === "cover" && "🪄"}
                    {phase === "ready" && "▶️"}
                    {phase === "shuffling" && "🌀"}
                    {phase === "guess" && "🧠"}
                    {phase === "result" && "✅"}
                    {phase === "gameover" && "❌"}
                  </motion.span>

                  <div className="flex flex-col text-sm sm:text-base text-left">
                    <motion.span
                      key={`title-${phase}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="font-semibold"
                    >
                      {phase === "enter" && (
                        <>
                          Preparing the spell cards
                          <AnimatedDots />
                        </>
                      )}
                      {phase === "showTarget" && (
                        <>
                          Memorize the target:{" "}
                          <span className="underline decoration-amber-300/60">
                            {targetName}
                          </span>
                        </>
                      )}
                      {phase === "cover" && (
                        <>
                          Get ready
                          <AnimatedDots />
                        </>
                      )}
                      {phase === "ready" && (
                        <>Ready to shuffle. Press Begin when ready.</>
                      )}
                      {phase === "shuffling" && (
                        <>
                          Shuffling—keep your eyes on it
                          <AnimatedDots />
                        </>
                      )}
                      {phase === "guess" && (
                        <>
                          Which card hides{" "}
                          <span className="underline decoration-blue-300/60">
                            {targetName}
                          </span>
                          ?
                        </>
                      )}
                      {phase === "result" && <>Brilliant! Correct.</>}
                      {phase === "gameover" && <>Wrong card. Game over.</>}
                    </motion.span>

                    <motion.span
                      key={`sub-${phase}`}
                      className="text-xs opacity-80"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2, delay: 0.02 }}
                    >
                      {phase === "showTarget" &&
                        "We will flip all cards down next."}
                      {phase === "cover" && "Cards are about to flip down."}
                      {phase === "ready" &&
                        "You can review your Arsenal below before starting."}
                      {phase === "shuffling" &&
                        `Shuffles: ${doneShuffles}/${totalShuffles}`}
                      {phase === "guess" && "Tap a card to make your guess."}
                      {phase === "result" && "Press Next Round to continue."}
                      {phase === "gameover" && "Press Restart to try again."}
                    </motion.span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        <div className="pt-10" />

        {/* Spotlight overlay during showTarget */}
        <AnimatePresence>
          {phase === "showTarget" && (
            <motion.div
              className="fixed inset-0 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ pointerEvents: "none", zIndex: 20 }}
            />
          )}
        </AnimatePresence>
        {/* Cards Grid (7 columns → two rows at 14) */}
        <div className="relative max-w-7xl pt-60 md:pt-0 mx-auto flex flex-col items-center justify-center h-full">
          <motion.div
            className={[
              "grid gap-4 sm:gap-5 place-items-center",
              "grid-cols-3 sm:grid-cols-4",
              "md:grid-cols-none",
              twoRowsMd
                ? "md:grid-rows-2 md:grid-flow-col md:place-content-center"
                : "md:grid-rows-1 md:grid-flow-col md:place-content-center",
              "transform-gpu",
            ].join(" ")}
          >
            {/* NEW: render only the first visibleCount cards during 'enter' */}
            {cards
              .slice(0, phase === "enter" ? visibleCount : cards.length)
              .map((c) => {
                const showFront = showFrontForCard(c.id);
                const isTarget = c.id === targetId;
                // NEW: keep target highlighted in 'ready' too
                const highlighting =
                  (phase === "showTarget" || phase === "ready") && isTarget;

                return (
                  <motion.button
                    key={c.id}
                    layout
                    // Entrance animation similar to character-spread
                    initial={{ opacity: 0, y: -50, scale: 0.8, rotateZ: -5 }}
                    animate={{ opacity: 1, y: 0, scale: 1, rotateZ: 0 }}
                    transition={{ type: "spring", stiffness: 250, damping: 20 }}
                    onMouseEnter={playCardHover} // NEW: hover SFX
                    onFocus={playCardHover} // NEW: keyboard focus SFX
                    onClick={() => {
                      if (!isClickable) return;
                      setTossingId(c.id);
                      handleGuess(c.id);
                    }}
                    disabled={!isClickable}
                    className={`scale-50 md:scale-100 relative block text-left active:scale-95 focus:outline-none transition-[scale,filter] ${
                      phase === "guess"
                        ? "hover:brightness-120 hover:scale-[1.05] cursor-pointer"
                        : ""
                    }`}
                    whileTap={isClickable ? { scale: 0.96 } : undefined}
                    style={{ zIndex: highlighting ? 30 : "auto" }}
                  >
                    {/* Tossing wrapper (size + perspective) */}
                    <motion.div
                      className="relative mx-auto w-[180px] aspect-[3/4] rounded-xl"
                      style={{ perspective: 1200, willChange: "transform" }}
                      animate={
                        tossingId === c.id
                          ? {
                              // smooth arc with just 3 points
                              y: [0, -100, 0],
                              scale: [1, 1.04, 1],
                              rotateZ: [0, -1.2, 0],
                            }
                          : highlighting
                          ? { y: 0, rotateZ: 0, scale: 1.12 }
                          : { y: 0, rotateZ: 0, scale: 1 }
                      }
                      transition={
                        tossingId === c.id
                          ? {
                              duration: 0.9,
                              times: [0, 0.45, 1],
                              ease: [
                                [0.22, 1, 0.36, 1], // up
                                [0.4, 0, 0.2, 1], // apex → down
                                [0.22, 1, 0.36, 1], // settle
                              ],
                            }
                          : { duration: 0.25, ease: "easeOut" }
                      }
                      onAnimationComplete={() => {
                        if (tossingId === c.id) setTossingId(null);
                      }}
                    >
                      {/* State ring overlay lives in the viewport */}
                      <div
                        className={[
                          "pointer-events-none absolute inset-0 rounded-xl animate-all transition-[box-shadow]",
                          highlighting && phase === "showTarget"
                            ? "shadow-[0_0_32px_8px_rgba(255,214,127,0.7),0_0_0_2px_rgba(255,214,127,0.6)]"
                            : phase === "ready" && isTarget
                            ? "shadow-[0_0_0_3px_rgba(255,214,127,0.7)]"
                            : "shadow-none",
                        ].join(" ")}
                      />
                      {/* 3D viewport wrapper: carries border/clip, NOT the rotator */}
                      <div className="absolute inset-0 rounded-xl overflow-hidden shadow-sm">
                        {/* Rotator (flip) - only responsible for 3D transform */}
                        <motion.div
                          className="absolute inset-0"
                          animate={{ rotateY: showFront ? 0 : 180 }}
                          initial={{ rotateY: 180 }}
                          transition={{
                            duration: tossingId === c.id ? 0.65 : 0.5,
                            ease: "easeInOut",
                          }}
                          style={{
                            transformStyle: "preserve-3d",
                            willChange: "transform",
                          }}
                        >
                          {/* Front face (image) */}
                          <div
                            className="absolute inset-0"
                            style={{
                              transform: "rotateY(0deg)",
                              backfaceVisibility: "hidden",
                              WebkitBackfaceVisibility: "hidden",
                            }}
                          >
                            <img
                              src={c.img}
                              alt={c.name}
                              className="w-full border rounded-xl border-hp-ivory/50 h-full object-cover select-none"
                              draggable={false}
                              loading="lazy"
                            />

                            {/* Target badge */}
                            {isTarget &&
                              (phase === "showTarget" ||
                                phase === "result" ||
                                phase === "ready" ||
                                phase === "gameover") && (
                                <span className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded-full bg-hp-royal border-hp-ivory border text-white">
                                  Target
                                </span>
                              )}

                            {/* Shine sweep while highlighted */}
                            {highlighting && <span className="card-shine" />}
                          </div>

                          {/* Back face (solid) */}
                          <div
                            className="absolute inset-0 grid place-items-center rounded-xl overflow-hidden"
                            style={{
                              transform: "rotateY(180deg)",
                              backfaceVisibility: "hidden",
                              WebkitBackfaceVisibility: "hidden",
                            }}
                          >
                            {/* Use back.png instead of gradient + ? */}
                            <img
                              src="/images/cards/back.png"
                              alt="Card back"
                              className="w-full h-full object-cover border rounded-xl border-hp-ivory/25 select-none"
                              draggable={false}
                              loading="lazy"
                            />
                            {/* Optional subtle inner border */}
                            <div className="absolute inset-0 rounded-xl border border-hp-ivory/15 pointer-events-none" />
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  </motion.button>
                );
              })}
          </motion.div>
        </div>
        {/* // Draft overlay */}
        <AnimatePresence
          onExitComplete={() => {
            // Fire after draft overlay fully unmounts
            if (continueAfterDraftRef.current) {
              continueAfterDraftRef.current = false;
              continueToNextRound(); // triggers curtain-in → speed-change SFX via chips effect
            }
          }}
        >
          {phase === "draft" && (
            <motion.div
              className="fixed inset-0 z-[70] grid place-items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/70" />
              <motion.div
                className="relative z-10 w-full max-w-3xl mx-auto rounded-2xl border border-hp-ivory/20 bg-hp-royal/90 backdrop-blur p-5 sm:p-6 text-hp-ivory"
                initial={{ scale: 0.96, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.98, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-extrabold">Choose a boon</h3>
                  <span className="text-xs opacity-80">
                    Inventory {inventory.length}/4
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {draftPicks.map((p) => (
                    <div
                      key={p.id}
                      className={[
                        "rounded-xl border p-3 bg-black/20  flex flex-col justify-between h-full",
                        p.tier === "legendary"
                          ? "border-amber-400/40"
                          : p.tier === "epic"
                          ? "border-purple-400/40"
                          : "border-hp-ivory/20",
                      ].join(" ")}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold">{p.name}</div>
                          <span
                            className={[
                              "text-[10px] px-2 py-0.5 rounded-full border",
                              p.tier === "legendary"
                                ? "bg-amber-300/10 text-amber-200 border-amber-300/40"
                                : p.tier === "epic"
                                ? "bg-purple-300/10 text-purple-200 border-purple-300/40"
                                : "bg-slate-300/10 text-slate-200 border-slate-300/40",
                            ].join(" ")}
                          >
                            {p.tier.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm opacity-85">{p.desc}</p>
                      </div>

                      {/* Only selection, no replace UI */}
                      <button
                        className="self-end flex items-center justify-center justify-self-end mt-3 w-full cursor-pointer rounded-lg bg-emerald-600 text-white text-sm py-1.5 hover:brightness-110"
                        onClick={() => {
                          // Guard in case of race; shouldn't open when full
                          if (inventory.length >= 4) {
                            continueAfterDraftRef.current = true;
                            setPhase("result"); // close draft first
                            return;
                          }
                          setInventory((inv) => [...inv, p]);
                          audio.play("boon_picked");
                          continueAfterDraftRef.current = true;
                          setPhase("result"); // close draft, then curtain
                        }}
                        onMouseEnter={() =>
                          audio.play("general_hover", {
                            category: "ui",
                            oneAtATime: true,
                          })
                        }
                        onFocus={() =>
                          audio.play("general_hover", {
                            category: "ui",
                            oneAtATime: true,
                          })
                        }
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    className="cursor-pointer rounded-lg bg-black/30 border border-hp-ivory/20 text-sm px-3 py-1.5 hover:brightness-110"
                    onClick={() => {
                      continueAfterDraftRef.current = true;
                      setPhase("result"); // close draft first
                      audio.play("button_click", {
                        category: "ui",
                        oneAtATime: true,
                      });
                    }}
                    onMouseEnter={() =>
                      audio.play("general_hover", {
                        category: "ui",
                        oneAtATime: true,
                      })
                    }
                    onFocus={() =>
                      audio.play("general_hover", {
                        category: "ui",
                        oneAtATime: true,
                      })
                    }
                  >
                    Skip
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Footer controls */}
        <div className="fixed bottom-25 z-30 text-center flex justify-center ">
          {phase === "ready" && (
            <HpButton
              glow
              text={"Begin Shuffling"}
              onClick={() => {
                setPhase("cover");
                audio.play("button_click", {
                  category: "ui",
                  oneAtATime: true,
                });
              }}
              onMouseEnter={() =>
                audio.play("general_hover", {
                  category: "ui",
                  oneAtATime: true,
                })
              }
              onFocus={() =>
                audio.play("general_hover", {
                  category: "ui",
                  oneAtATime: true,
                })
              }
            />
          )}

          {phase === "guess" && (
            <HpButton
              text={"Replay Round"}
              onClick={() => {
                startRound(round);
                audio.play("button_click", {
                  category: "ui",
                  oneAtATime: true,
                });
              }}
              onMouseEnter={() =>
                audio.play("general_hover", {
                  category: "ui",
                  oneAtATime: true,
                })
              }
              onFocus={() =>
                audio.play("general_hover", {
                  category: "ui",
                  oneAtATime: true,
                })
              }
            />
          )}

          {phase === "result" && (
            <HpButton
              text={"Next Round"}
              onClick={() => {
                goToNextRound();
                audio.play("button_click", {
                  category: "ui",
                  oneAtATime: true,
                });
              }}
              onMouseEnter={() =>
                audio.play("general_hover", {
                  category: "ui",
                  oneAtATime: true,
                })
              }
              onFocus={() =>
                audio.play("general_hover", {
                  category: "ui",
                  oneAtATime: true,
                })
              }
            />
          )}

          {phase === "gameover" && (
            <HpButton
              text={"Restart"}
              onClick={() => {
                resetGame();
                audio.play("button_click", {
                  category: "ui",
                  oneAtATime: true,
                });
              }}
              onMouseEnter={() =>
                audio.play("general_hover", {
                  category: "ui",
                  oneAtATime: true,
                })
              }
              onFocus={() =>
                audio.play("general_hover", {
                  category: "ui",
                  oneAtATime: true,
                })
              }
            />
          )}
        </div>

        {/* Inventory bar with hover tooltips */}
        {phase !== "init" && !isStarting && (
          <AnimatePresence initial={false}>
            <motion.div
              key="arsenal" // stable key
              className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 w-full max-w-7xl px-4"
              initial={{ opacity: 0, y: 8, scale: 0.98, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 6, scale: 0.98, filter: "blur(2px)" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                layout
                transition={{
                  layout: { type: "spring", stiffness: 260, damping: 28 },
                }}
                className="mx-auto max-w-7xl pointer-events-auto"
              >
                <div className="rounded-t-2xl border border-hp-ivory/15 bg-hp-royal/80 backdrop-blur">
                  {/* Drawer header row */}
                  <div className="flex items-center gap-3 justify-between px-4 py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs uppercase tracking-wider text-hp-ivory/70">
                        Arsenal
                      </span>
                      <div className="min-w-0 overflow-x-auto no-scrollbar">
                        <div className="flex gap-2">
                          {[0, 1, 2, 3].map((slot) => {
                            const p = inventory[slot];
                            if (!p) {
                              return (
                                <div
                                  key={slot}
                                  className="rounded-lg border border-dashed border-hp-ivory/20 px-2 py-1 text-xs text-hp-ivory/50 shrink-0"
                                >
                                  Empty
                                </div>
                              );
                            }
                            const cls =
                              p.tier === "legendary"
                                ? "bg-amber-300/10 text-amber-200 border-amber-300/30"
                                : p.tier === "epic"
                                ? "bg-purple-300/10 text-purple-200 border-purple-300/30"
                                : "bg-slate-300/10 text-slate-200 border-slate-300/30";
                            return (
                              <div
                                key={p.id}
                                className={`rounded-lg border px-2 py-1 text-xs shrink-0 ${cls}`}
                                onMouseEnter={(e) =>
                                  setTooltip({
                                    visible: true,
                                    x: e.clientX + 12,
                                    y: e.clientY + 12,
                                    item: p,
                                  })
                                }
                                onMouseMove={(e) =>
                                  setTooltip((t) =>
                                    t.visible
                                      ? {
                                          ...t,
                                          x: e.clientX + 12,
                                          y: e.clientY + 12,
                                        }
                                      : t
                                  )
                                }
                                onMouseLeave={() =>
                                  setTooltip({
                                    visible: false,
                                    x: 0,
                                    y: 0,
                                    item: null,
                                  })
                                }
                              >
                                <span className="font-semibold">{p.name}</span>
                                <span className="ml-2 opacity-80">
                                  {p.tier}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <button
                      className="text-xs flex gap-1 items-center cursor-pointer rounded-lg border border-hp-ivory/20 bg-black/30 px-3 py-1.5 hover:brightness-120 transition-[filter]"
                      onClick={() => {
                        setInventoryOpen((v) => !v);
                        audio.play("general_click", {
                          category: "ui",
                          oneAtATime: true,
                        });
                      }}
                      onMouseEnter={() =>
                        audio.play("general_hover", {
                          category: "ui",
                          oneAtATime: true,
                        })
                      }
                      onFocus={() =>
                        audio.play("general_hover", {
                          category: "ui",
                          oneAtATime: true,
                        })
                      }
                      title={
                        inventoryOpen
                          ? "Hide Arsenal and modifiers"
                          : "Show Arsenal and modifiers"
                      }
                    >
                      {inventoryOpen ? "Close All" : "Open All"}
                      <span>
                        {inventoryOpen ? (
                          <ChevronDown className="w-4" />
                        ) : (
                          <ChevronUp className="w-4" />
                        )}
                      </span>
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {inventoryOpen && (
                      <motion.div
                        key="drawer-body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-3">
                          <AnimatePresence initial={false}>
                            {modPreview && (
                              <motion.div
                                key="mods-panel"
                                className="rounded-xl border border-hp-ivory/20 bg-black/30 backdrop-blur px-4 py-3 text-hp-ivory"
                                initial={{
                                  opacity: 0,
                                  y: 6,
                                  filter: "blur(2px)",
                                }}
                                animate={{
                                  opacity: 1,
                                  y: 0,
                                  filter: "blur(0px)",
                                }}
                                exit={{ opacity: 0, y: 6, filter: "blur(2px)" }}
                                transition={{ duration: 0.22, ease: "easeOut" }}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="font-semibold">
                                    Applied modifiers
                                  </div>
                                  {/* Remove close button since mod preview is always shown */}
                                </div>
                                {/* Information saying boon effects are applied on the next round */}
                                <div className="text-xs opacity-70 italic">
                                  Modifiers from newly acquired boons apply
                                  starting the next round.
                                </div>

                                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                                  {/* Shuffle delay + SPS */}
                                  <div className="rounded-lg bg-black/20 border border-hp-ivory/15 p-3">
                                    <div className="text-xs uppercase opacity-70">
                                      Shuffle delay
                                    </div>
                                    <div className="mt-1 font-semibold">
                                      {modPreview.base.speedMs}ms
                                      {modPreview.mod.speedMs !==
                                        modPreview.base.speedMs && (
                                        <>
                                          {" "}
                                          →{" "}
                                          <span className="text-emerald-300">
                                            {modPreview.mod.speedMs}ms
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    <div className="text-xs opacity-80">
                                      SPS: {modPreview.base.sps}/s
                                      {modPreview.mod.sps !==
                                        modPreview.base.sps && (
                                        <>
                                          {" "}
                                          →{" "}
                                          <span className="text-emerald-300">
                                            {modPreview.mod.sps}/s
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  {/* Shuffles */}
                                  <div className="rounded-lg bg-black/20 border border-hp-ivory/15 p-3">
                                    <div className="text-xs uppercase opacity-70">
                                      Shuffles
                                    </div>
                                    <div className="mt-1 font-semibold">
                                      {modPreview.base.swaps}
                                      {modPreview.mod.swaps !==
                                        modPreview.base.swaps && (
                                        <>
                                          {" "}
                                          →{" "}
                                          <span className="text-emerald-300">
                                            {modPreview.mod.swaps}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  {/* Points math */}

                                  <div className="rounded-lg bg-black/20 border border-hp-ivory/15 p-3">
                                    <div className="text-xs uppercase opacity-70">
                                      Points (per correct)
                                    </div>
                                    <div className="mt-1 font-semibold">
                                      Base {modPreview.base.baseMult.toFixed(1)}{" "}
                                      <span className="opacity-70">+</span>{" "}
                                      Speed{" "}
                                      {modPreview.mod.speedBonus.toFixed(1)}{" "}
                                      <span className="opacity-70">=</span>{" "}
                                      {(
                                        modPreview.base.baseMult +
                                        modPreview.mod.speedBonus
                                      ).toFixed(1)}
                                      x
                                      {modPreview.mod.powMult !== 1 && (
                                        <>
                                          {" "}
                                          <span className="text-emerald-300">
                                            {" "}
                                            <span className="opacity-70">
                                              ×
                                            </span>{" "}
                                            POWER{" "}
                                            {modPreview.mod.powMult.toFixed(2)}{" "}
                                            <span className="opacity-70">
                                              =
                                            </span>{" "}
                                            {modPreview.totalPoints.toFixed(1)}x
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    <div className="text-xs opacity-80">
                                      Base by Difficulty, Speed, and Power-up
                                      bonus
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Tooltip for inventory items */}
        <AnimatePresence>
          {tooltip.visible && tooltip.item && (
            <motion.div
              className="fixed z-[80] max-w-xs rounded-lg border border-hp-ivory/20 bg-black/80 text-hp-ivory text-sm p-3 pointer-events-none"
              style={{
                left: tooltip.x,
                // Show upwards: calculate bottom from window height minus mouse Y
                bottom: `calc(100vh - ${tooltip.y}px)`,
              }}
              initial={{ opacity: 0, scale: 0.96, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">{tooltip.item.name}</div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    tooltip.item.tier === "legendary"
                      ? "bg-amber-300/10 text-amber-200 border-amber-300/40"
                      : tooltip.item.tier === "epic"
                      ? "bg-purple-300/10 text-purple-200 border-purple-300/40"
                      : "bg-slate-300/10 text-slate-200 border-slate-300/40"
                  }`}
                >
                  {tooltip.item.tier.toUpperCase()}
                </span>
              </div>
              <div className="mt-1 text-xs opacity-85">{tooltip.item.desc}</div>
              <ul className="mt-2 text-xs list-disc pl-4 space-y-0.5">
                {effectLines(tooltip.item.effect).map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

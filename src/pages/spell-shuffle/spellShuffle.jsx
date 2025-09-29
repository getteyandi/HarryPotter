import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import HpButton from "../../components/hp-button";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import audio from "../../lib/audio-manager";

const PLACEHOLDER = "/images/hero.png";

// 14 spell cards (names + image paths; replace images if you have them)
const BASE_CARDS = [
  { id: "expelliarmus", name: "Expelliarmus", img: PLACEHOLDER },
  { id: "lumos", name: "Lumos", img: PLACEHOLDER },
  { id: "alohomora", name: "Alohomora", img: PLACEHOLDER },
  { id: "accio", name: "Accio", img: PLACEHOLDER },
  { id: "stupefy", name: "Stupefy", img: PLACEHOLDER },
  { id: "protego", name: "Protego", img: PLACEHOLDER },
  { id: "petrificus-totalus", name: "Petrificus Totalus", img: PLACEHOLDER },
  { id: "wingardium-leviosa", name: "Wingardium Leviosa", img: PLACEHOLDER },
  { id: "rictusempra", name: "Rictusempra", img: PLACEHOLDER },
  { id: "expecto-patronum", name: "Expecto Patronum", img: PLACEHOLDER },
  { id: "obliviate", name: "Obliviate", img: PLACEHOLDER },
  { id: "reducto", name: "Reducto", img: PLACEHOLDER },
  { id: "sectumsempra", name: "Sectumsempra", img: PLACEHOLDER },
  { id: "confundo", name: "Confundo", img: PLACEHOLDER },
];

// Power-up catalog
const POWER_UPS = {
  normal: [
    {
      id: "fleet-i",
      name: "Fleet Footed I",
      tier: "normal",
      desc: "Every even round: -60ms shuffle delay.",
      effect: { evenRoundSpeedBonusMs: -60 },
    },
    {
      id: "quick-i",
      name: "Quick Hands I",
      tier: "normal",
      desc: "Shuffle delay -5%.",
      effect: { speedMsFactor: 0.95 },
    },
    {
      id: "focus-i",
      name: "Focused Mind",
      tier: "normal",
      desc: "Score x1.1.",
      effect: { scoreFactor: 1.1 },
    },
    {
      id: "loose-i",
      name: "Looser Shuffle I",
      tier: "normal",
      desc: "Shuffles -2.",
      effect: { swapsDelta: -2 },
    },
    {
      id: "trace-i",
      name: "Trace Lock I",
      tier: "normal",
      desc: "Target included in ≥ 30% of shuffles.",
      effect: { minTargetShuffleFraction: 0.3 },
    },
    {
      id: "reveal-i",
      name: "Longer Reveal I",
      tier: "normal",
      desc: "Spotlight lasts +200ms.",
      effect: { revealMsAdd: 200 },
    },
    {
      id: "tempo-i",
      name: "Calm Tempo",
      tier: "normal",
      desc: "Score x1.2 but -60ms delay.",
      effect: { scoreFactor: 1.2, speedMsDelta: -60 },
    },
    {
      id: "extra-i",
      name: "Extra Shuffles I",
      tier: "normal",
      desc: "Shuffles +2 and Score x1.05.",
      effect: { swapsDelta: +2, scoreFactor: 1.05 },
    },
    {
      id: "fleet-ii-lite",
      name: "Fleet Tweak",
      tier: "normal",
      desc: "Shuffle delay -3%.",
      effect: { speedMsFactor: 0.97 },
    },
    {
      id: "reveal-lite",
      name: "Reveal Tweak",
      tier: "normal",
      desc: "Spotlight lasts +100ms.",
      effect: { revealMsAdd: 100 },
    },
  ],
  epic: [
    {
      id: "fleet-ii",
      name: "Fleet Footed II",
      tier: "epic",
      desc: "Every even round: -100ms shuffle delay.",
      effect: { evenRoundSpeedBonusMs: -100 },
    },
    {
      id: "quick-ii",
      name: "Quick Hands II",
      tier: "epic",
      desc: "Shuffle delay -10%.",
      effect: { speedMsFactor: 0.9 },
    },
    {
      id: "mastery",
      name: "Mastery",
      tier: "epic",
      desc: "Score x1.25.",
      effect: { scoreFactor: 1.25 },
    },
    {
      id: "reveal-ii",
      name: "Longer Reveal II",
      tier: "epic",
      desc: "Spotlight lasts +400ms.",
      effect: { revealMsAdd: 400 },
    },
    {
      id: "trace-ii",
      name: "Trace Lock II",
      tier: "epic",
      desc: "Target included in ≥ 40% of shuffles.",
      effect: { minTargetShuffleFraction: 0.4 },
    },
  ],
  legendary: [
    {
      id: "timewarp",
      name: "Time Warp",
      tier: "legendary",
      desc: "Shuffle delay -20% and -120ms on even rounds.",
      effect: { speedMsFactor: 0.8, evenRoundSpeedBonusMs: -120 },
    },
    {
      id: "jackpot",
      name: "Jackpot",
      tier: "legendary",
      desc: "Score x1.5.",
      effect: { scoreFactor: 1.5 },
    },
    {
      id: "oracle",
      name: "Oracle",
      tier: "legendary",
      desc: "Spotlight +600ms and target in ≥ 50% of shuffles.",
      effect: { revealMsAdd: 600, minTargetShuffleFraction: 0.5 },
    },
  ],
};

// Weighted RNG: Normal 70%, Epic 25%, Legendary 5%
const RNG_WEIGHTS = [
  { tier: "legendary", w: 5 },
  { tier: "epic", w: 25 },
  { tier: "normal", w: 70 },
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

// NEW: decide cycle size by difficulty
function getCycleSize(cardCount, round) {
  if (cardCount >= 12 || round >= 8) {
    const r = Math.random();
    if (r < 0.45) return 4;
    if (r < 0.85) return 3;
    return 2;
  }
  if (cardCount >= 9 || round >= 5) {
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
    speedMsDelta: 0,
    speedMsFactor: 1,
    scoreFactor: 1,
    swapsDelta: 0,
    minTargetShuffleFraction: null,
    revealMsAdd: 0,
  };
  for (const p of inventory) {
    const fx = p.effect || {};
    if (fx.speedMsDelta) agg.speedMsDelta += fx.speedMsDelta;
    if (fx.speedMsFactor) agg.speedMsFactor *= fx.speedMsFactor;
    if (fx.scoreFactor) agg.scoreFactor *= fx.scoreFactor;
    if (fx.swapsDelta) agg.swapsDelta += fx.swapsDelta;
    if (fx.revealMsAdd) agg.revealMsAdd += fx.revealMsAdd;
    if (typeof fx.minTargetShuffleFraction === "number") {
      agg.minTargetShuffleFraction =
        agg.minTargetShuffleFraction == null
          ? fx.minTargetShuffleFraction
          : Math.max(agg.minTargetShuffleFraction, fx.minTargetShuffleFraction);
    }
    if (fx.evenRoundSpeedBonusMs && nextRound % 2 === 0) {
      agg.speedMsDelta += fx.evenRoundSpeedBonusMs;
    }
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
  const [speedMs, setSpeedMs] = useState(700);
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
  const [replacingIndex, setReplacingIndex] = useState(null); // pick slot to replace when full
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
  const { pathname } = useLocation();
  const isSpellShuffle = pathname.startsWith("/spell-shuffle");
  const [musicVolume, setMusicVolume] = useState(0.6);
  const [musicMuted, setMusicMuted] = useState(false);
  const [musicPopoverOpen, setMusicPopoverOpen] = useState(false);
  const musicPopoverCloseTimer = useRef(null);

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
  const lastSpeedLabelRef = useRef(null);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);
  const targetShuffleCountRef = useRef(0);
  const totalShufflesRef = useRef(0);
  const minTargetShuffleFracRef = useRef(1 / 3);
  const revealBonusMsRef = useRef(0);
  const scoringFactorRef = useRef(1);
  const modPanelTimerRef = useRef(null); // NEW: auto-hide timer for mods panel
  const wasStartingRef = useRef(false);
  const prevVisibleRef = useRef(0);
  const lastHoverAtRef = useRef(0); // NEW: throttle hover SFX

  // Shuffle progress
  const totalShuffles = totalShufflesRef.current || 0;
  const doneShuffles = Math.max(0, totalShuffles - Math.max(shufflesLeft, 0));
  const progressPct = totalShuffles
    ? Math.min(100, Math.round((doneShuffles / totalShuffles) * 100))
    : 0;
  const lastSpeedLabelSfxRef = useRef(speedLabel);

  useEffect(() => {
    audio.attachUnlock(document);
    audio.setCategoryVolume("music", 0.6);
    audio.setCategoryVolume("sfx", 0.9);
    audio.setCategoryVolume("ui", 0.8);

    audio
      .load({
        ost_title: {
          url: "/sounds/ost_title.mp3",
          category: "music",
          volume: 1,
        },
        ost_game: {
          url: "/sounds/ost_game.mp3",
          category: "music",
          volume: 1,
        },
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
        card_flip: {
          url: "/sounds/card_flip.mp3",
          category: "sfx",
          volume: 1,
        },
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
      })
      .then(() => {});
  }, []);

  // Keep audio category volume in sync with UI
  useEffect(() => {
    audio.setCategoryVolume("music", musicMuted ? 0 : musicVolume);
  }, [musicMuted, musicVolume]);

  // Start/stop OST based on route
  useEffect(() => {
    audio.whenUnlocked(() => {
      if (isSpellShuffle) {
        // ensure game OST is playing when on this page
        if (audio.music.current?.key !== "ost_title") {
          audio.playMusic("ost_title", {
            fadeMs: 200,
            loop: true,
            volume: 0.6,
          });
        }
      } else {
        // leaving this page: stop our OST
        if (
          audio.music.current &&
          ["ost_game", "ost_title"].includes(audio.music.current.key)
        ) {
          audio.music.current.stop(250);
        }
      }
    });
  }, [isSpellShuffle]);

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

  // Play speed change SFX (throttled)
  useEffect(() => {
    const prev = lastSpeedLabelSfxRef.current;
    if (prev && prev !== speedLabel) {
      audio.play("speed_changed", {
        category: "sfx",
        oneAtATime: true,
        volume: 0.8,
      });
    }
    lastSpeedLabelSfxRef.current = speedLabel;
  }, [speedLabel]);

  // Phase → SFX (fires once per phase change)
  const lastPhaseRef = useRef(null);
  useEffect(() => {
    if (phase === lastPhaseRef.current) return;
    const prev = lastPhaseRef.current;
    lastPhaseRef.current = phase;

    // Chime for status text changes (skip init and phases with their own SFX)
    // Status Changed
    if (STATUS_CHIME_PHASES.has(phase)) {
      audio.play("status_changed", {
        category: "sfx",
        oneAtATime: true,
      });
    }

    switch (phase) {
      case "init":
        // Back on hero: ensure Title OST
        if (isSpellShuffle && audio.music.current?.key !== "ost_title") {
          audio.crossfadeMusic("ost_title", { fadeMs: 600, loop: true });
        }
        break;

      case "enter":
        // From hero into game: switch to Game OST
        if (prev === "init" && isSpellShuffle) {
          audio.crossfadeMusic("ost_game", { fadeMs: 800, loop: true });
        }
        break;
      case "cover":
        // audio.play("flip_all", { oneAtATime: true });
        break;
      case "shuffling":
        // // start-of-shuffle cue (optional)
        // audio.play("shuffle", { volume: 0.6, oneAtATime: true });
        break;
      case "result":
        // audio.duck(["music"], 0.4, 120);
        // audio
        //   .play("success", { oneAtATime: true })
        //   .onEnded(() => audio.unduck(["music"], null, 160));
        break;
      case "gameover":
        // audio.duck(["music"], 0.3, 120);
        // audio
        //   .play("fail", { oneAtATime: true })
        //   .onEnded(() => audio.unduck(["music"], null, 200));
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

  // Reset all power-ups and their aggregated refs
  function clearPowerUps() {
    setInventory([]);
    setDraftPicks([]);
    setReplacingIndex(null);
    minTargetShuffleFracRef.current = 1 / 3;
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

    // Points multiplier mapping
    let multiplier = 1;
    if (label === "Slow") multiplier = 0.5;
    else if (label === "Normal") multiplier = 1;
    else if (label === "Fast") multiplier = 2;
    else {
      const extra = Math.max(0, Math.floor((sps - 3) * 10) / 10);
      multiplier = +(3 + extra).toFixed(1);
    }

    return { label, sps, multiplier };
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
    // simple descriptions for tooltip
    const lines = [];
    if (effect.evenRoundSpeedBonusMs)
      lines.push(`Even rounds: ${effect.evenRoundSpeedBonusMs}ms faster`);
    if (effect.speedMsDelta)
      lines.push(
        `${effect.speedMsDelta > 0 ? "+" : ""}${
          effect.speedMsDelta
        }ms shuffle delay`
      );
    if (effect.speedMsFactor)
      lines.push(`Shuffle delay ×${effect.speedMsFactor}`);
    if (effect.scoreFactor) lines.push(`Score ×${effect.scoreFactor}`);
    if (effect.swapsDelta)
      lines.push(
        `${effect.swapsDelta > 0 ? "+" : ""}${effect.swapsDelta} shuffles`
      );
    if (typeof effect.minTargetShuffleFraction === "number")
      lines.push(
        `Target in ≥ ${fmtFrac(effect.minTargetShuffleFraction)} of shuffles`
      );
    if (effect.revealMsAdd) lines.push(`Spotlight +${effect.revealMsAdd}ms`);
    if (!lines.length) lines.push("No additional effects");
    return lines;
  }

  const [curtainMeta, setCurtainMeta] = useState({
    round: 1,
    speedLabel: "",
    sps: 0,
    showSpeed: false,
    multiplier: 1, // NEW
  });

  // Difficulty scaling (up to 12 cards, 2 rows of 6 on md+)
  function computeDifficulty(r) {
    // Rounds 1-2:4, 3-4:6, 5-6:8, 7-8:10, 9+:12
    const sequence = [4, 6, 8, 10, 12];
    const step = Math.floor((r - 1) / 2); // grow every 2 rounds
    const idx = Math.min(step, sequence.length - 1);
    const count = sequence[idx];
    const speed = Math.max(800 - (r - 1) * 60, 250);
    const swaps = 6 + r * 2;
    return { count, speed, swaps };
  }

  function clearTimers() {
    clearPhaseTimers();
  }

  // Prepare and start a specific round (button-driven)
  function startRound(nextRound = 1) {
    clearPhaseTimers();

    const { count, speed, swaps } = computeDifficulty(nextRound);

    // APPLY ACTIVE MODIFIERS
    const mods = getActiveModifiers(inventory, nextRound);
    let modSpeed = Math.max(
      120,
      Math.round((speed + (mods.speedMsDelta || 0)) * (mods.speedMsFactor || 1))
    );
    let modSwaps = Math.max(0, swaps + (mods.swapsDelta || 0));
    const minFrac = Math.max(1 / 3, mods.minTargetShuffleFraction ?? 0); // keep ≥ base
    minTargetShuffleFracRef.current = minFrac;
    revealBonusMsRef.current = mods.revealMsAdd || 0;
    scoringFactorRef.current = mods.scoreFactor || 1;

    // Build preview (base vs modified)
    const baseMeta = getSpeedMeta(speed);
    const modMeta = getSpeedMeta(modSpeed);
    const basePreview = {
      speedMs: speed,
      sps: baseMeta.sps,
      swaps,
      minFrac: 1 / 3,
      revealMs: 1200,
      speedMult: baseMeta.multiplier,
      powMult: 1,
    };
    const modPreviewData = {
      speedMs: modSpeed,
      sps: modMeta.sps,
      swaps: modSwaps,
      minFrac,
      revealMs: 1200 + (revealBonusMsRef.current || 0),
      speedMult: modMeta.multiplier,
      // powMult: scoringFactorRef.current || 1,   // OLD
      powMult: mods.scoreFactor || 1, // NEW: use fresh aggregate
    };
    setModPreview({
      base: basePreview,
      mod: modPreviewData,
      totalPoints: +(modPreviewData.speedMult * modPreviewData.powMult).toFixed(
        1
      ),
    });

    // Build round cards (unchanged)
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
    targetShuffleCountRef.current = 0;
    setVisibleCount(0);

    // Curtains / delays (respect speed tier change)
    const { label } = modMeta;
    const showSpeedChanged = lastSpeedLabelRef.current !== label;
    lastSpeedLabelRef.current = label;

    const baseCurtainHoldMs = 900;
    const overlayHideMs = showSpeedChanged ? 1400 : baseCurtainHoldMs;
    const extraHold = overlayHideMs - baseCurtainHoldMs;
    setEnterDelayMs(700 + extraHold);

    if (startOverlayTimerRef.current)
      clearTimeout(startOverlayTimerRef.current);

    startOverlayTimerRef.current = setTimeout(() => {
      setIsStarting(false);
      // setHudKey((k) => k + 1); // remove re-keying to prevent reanimation
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
            oneAtATime: true, // prevents stacking when speed is high
            // rate: Math.min(1.2, Math.max(0.85, 700 / speedMs)), // optional pitch by speed
          });

          setCards((prev) => {
            if (prev.length < 2) return prev;

            const size = getCycleSize(prev.length, round);
            const targetIdx = prev.findIndex((c) => c.id === targetId);

            const requiredMin = Math.ceil(
              (totalShufflesRef.current || 0) *
                (minTargetShuffleFracRef.current || 1 / 3)
            );
            const forceIncludeTarget =
              targetIdx !== -1 && targetShuffleCountRef.current < requiredMin;

            const indices = forceIncludeTarget
              ? pickDistinct(size, prev.length, targetIdx)
              : pickDistinct(size, prev.length);

            if (indices.includes(targetIdx)) {
              targetShuffleCountRef.current += 1;
            }

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

    // Flip sound
    audio.play("card_flip", {
      category: "sfx",
    });

    if (id === targetId) {
      const { multiplier } = getSpeedMeta(speedMs);
      const { scoreFactor: powMult } = getActiveModifiers(inventory, round);
      const totalMult = multiplier * (powMult || 1);
      setLastGain(totalMult); // NEW
      setScore((s) => s + totalMult);
      // Correct guess sound
      audio.play("correct_guess", { category: "sfx" });
      setPhase("result");
    } else {
      // Wrong guess sound
      audio.play("wrong_guess", { category: "sfx" });
      setLastGain(0); // NEW
      setPhase("gameover");
    }
  }

  // Drafting
  function openDraft() {
    // 3 random picks, avoid duplicates already owned
    const ownedIds = inventory.map((p) => p.id);
    const picks = drawDraftPicks(3, ownedIds);
    setDraftPicks(picks);
    setReplacingIndex(null);
    setPhase("draft"); // NEW phase
  }

  function continueToNextRound() {
    // audio.play("next_round", { category: "ui" });
    // Curtain in
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
    // Every 3 rounds, open draft instead of immediate curtain
    if (round % 3 === 0) {
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
    setSpeedMs(700);
    setIsStarting(false);
    setHeroOut(false);
    setVisibleCount(0);
    setEnterDelayMs(700);
    targetShuffleCountRef.current = 0;
    totalShufflesRef.current = 0;
    lastSpeedLabelRef.current = null; // IMPORTANT: allow speed tier to show again
    clearPowerUps();
    setCurtainMeta({
      round: 1,
      speedLabel: "",
      sps: 0,
      showSpeed: false,
      multiplier: 1,
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
    const { speed } = computeDifficulty(nextRound);
    const meta = getSpeedMeta(speed);
    const showSpeed = lastSpeedLabelRef.current !== meta.label; // first time per tier
    setCurtainMeta({
      round: nextRound,
      speedLabel: meta.label,
      sps: meta.sps,
      showSpeed,
      multiplier: meta.multiplier, // NEW
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

  return (
    <main>
      <div className="relative min-h-screen flex items-center flex-col justify-center bg-hp-royal pt-30 pb-32 px-6 md:px-12 overflow-x-hidden">
        <div className="absolute inset-0 bg-[url('/images/bg.png')] bg-repeat bg-auto opacity-20 pointer-events-none" />

        {/* INIT: Hero title screen */}
        <AnimatePresence mode="wait" initial={true}>
          {phase === "init" && !heroOut && (
            <motion.section
              key="hero"
              className="relative z-10 max-w-5xl mx-auto py-16 md:py-20 text-center text-hp-ivory"
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
                    <span className="font-semibold">get harder every 2</span>
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

                  <Link to="/home" passHref>
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
                  {/* Round badge (primary) */}
                  <div className="px-6 py-3 rounded-full border border-amber-300/40 bg-black/30 text-amber-200/90 shadow-[0_0_30px_rgba(255,214,127,0.2)_inset]">
                    <span className="font-bold tracking-wide">
                      Round {curtainMeta.round}
                    </span>
                  </div>

                  {/* Speed chip (only when tier changed) */}
                  {curtainMeta.showSpeed && (
                    <motion.div
                      className="px-3 py-1 rounded-full border border-amber-200/30 bg-black/30 text-amber-100/90 text-sm"
                      initial={{ y: 6, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -6, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      <span>
                        Speed:{" "}
                        <span className="font-semibold">
                          {curtainMeta.speedLabel}
                        </span>
                      </span>
                      {/* Show multiplier alongside speed only up to 3.0x */}
                      {curtainMeta.multiplier <= 3 && (
                        <span className="ml-2">
                          • Points{" "}
                          <span className="font-semibold">
                            x{curtainMeta.multiplier.toFixed(1)}
                          </span>
                        </span>
                      )}
                      <span className="ml-2 opacity-80">
                        ({curtainMeta.sps}/s)
                      </span>
                    </motion.div>
                  )}
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
              className="fixed top-3 left-1/2 -translate-x-1/2 z-30 w-full max-w-7xl"
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
                <Link to="/home" passHref>
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
                    x
                    <span className="font-semibold">
                      {currentMultiplier.toFixed(1)}
                    </span>
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
                <div className="ml-auto min-w-[200px] flex-1 sm:flex-none">
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
              className=" z-[60] mx-auto max-w-6xl px-4 fixed top-30 left-1/2 -translate-x-1/2"
              initial={{ opacity: 0, y: -6, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="flex justify-center">
                <motion.div
                  className={[
                    "status-chip", // NEW: base hook for CSS FX
                    "relative overflow-visible inline-flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur pointer-events-none",
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
        <div className="relative max-w-7xl mx-auto flex flex-col items-center justify-center h-full">
          <motion.div
            className={[
              "grid gap-4 sm:gap-5 place-items-center",
              "grid-cols-3 sm:grid-cols-4",
              "md:grid-cols-none",
              twoRowsMd
                ? "md:grid-rows-2 md:grid-flow-col md:place-content-center"
                : "md:grid-rows-1 md:grid-flow-col md:place-content-center",
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
                    className={`relative block text-left   active:scale-95  focus:outline-none transition-[scale,filter] ${
                      phase === "guess"
                        ? "hover:brightness-120 hover:scale-[1.05] cursor-pointer"
                        : ""
                    }`}
                    whileTap={isClickable ? { scale: 0.96 } : undefined}
                    style={{ zIndex: highlighting ? 30 : "auto" }}
                  >
                    {/* Tossing wrapper (size + perspective) */}
                    <motion.div
                      className="relative mx-auto w-[140px] sm:w-[160px] md:w-[180px] aspect-[3/4] rounded-xl"
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
                          "pointer-events-none absolute inset-0 rounded-xl animate-all",
                          highlighting
                            ? "ring-2 ring-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.2)]"
                            : "ring-0 ring-hp-ivory/20",
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
                              className="w-full h-full object-cover select-none"
                              draggable={false}
                              loading="lazy"
                            />
                            {phase !== "guess" &&
                              phase !== "shuffling" &&
                              showFront && (
                                <span className="absolute left-1/2 -translate-x-1/2 bottom-2 text-[10px] px-2 py-1 rounded-full bg-black/60 text-white">
                                  {c.name}
                                </span>
                              )}
                            {isTarget &&
                              (phase === "showTarget" ||
                                phase === "result" ||
                                phase === "ready" ||
                                phase === "gameover") && (
                                <span className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded-full bg-emerald-600 text-white">
                                  Target
                                </span>
                              )}
                          </div>

                          {/* Back face (solid) */}
                          <div
                            className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(225,203,165,0.12),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(225,203,165,0.08),transparent_40%)] bg-hp-royal rounded-xl"
                            style={{
                              transform: "rotateY(180deg)",
                              backfaceVisibility: "hidden",
                              WebkitBackfaceVisibility: "hidden",
                            }}
                          >
                            {/* Move border to viewport wrapper; keep an inner subtle one if desired */}
                            <div className="absolute inset-0 rounded-xl border border-hp-ivory/15 pointer-events-none" />
                            <span className="text-hp-ivory/80 text-3xl font-bold select-none">
                              ?
                            </span>
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
        <AnimatePresence>
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
                        "rounded-xl border p-3 bg-black/20",
                        p.tier === "legendary"
                          ? "border-amber-400/40"
                          : p.tier === "epic"
                          ? "border-purple-400/40"
                          : "border-hp-ivory/20",
                      ].join(" ")}
                    >
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

                      {inventory.length < 4 ? (
                        <button
                          className="mt-3 w-full rounded-lg bg-emerald-600 text-white text-sm py-1.5 hover:brightness-110"
                          onClick={() => {
                            setInventory((inv) => [...inv, p]);
                            continueToNextRound();
                          }}
                        >
                          Select
                        </button>
                      ) : replacingIndex === null ? (
                        <button
                          className="mt-3 w-full rounded-lg bg-blue-600 text-white text-sm py-1.5 hover:brightness-110"
                          onClick={() => setReplacingIndex(p.id)}
                        >
                          Replace a slot…
                        </button>
                      ) : (
                        <div className="mt-3">
                          <div className="text-xs mb-2 opacity-80">
                            Choose a slot to replace:
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {inventory.map((owned, idx) => (
                              <button
                                key={owned.id}
                                className="rounded-lg border border-hp-ivory/20 bg-black/20 px-2 py-1.5 text-left hover:border-emerald-400/40"
                                onClick={() => {
                                  setInventory((inv) => {
                                    const next = inv.slice();
                                    const repIdx = inv.findIndex(
                                      (x) => x.id === owned.id
                                    );
                                    const pick = [...draftPicks].find(
                                      (x) => x.id === replacingIndex
                                    );
                                    next[repIdx] = pick;
                                    return next;
                                  });
                                  setReplacingIndex(null);
                                  continueToNextRound();
                                }}
                              >
                                <div className="text-xs font-semibold">
                                  {owned.name}
                                </div>
                                <div className="text-[10px] opacity-75">
                                  {owned.tier}
                                </div>
                              </button>
                            ))}
                          </div>
                          <button
                            className="mt-2 w-full rounded-lg bg-black/30 border border-hp-ivory/20 text-sm py-1.5 hover:brightness-110"
                            onClick={() => setReplacingIndex(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    className="rounded-lg bg-black/30 border border-hp-ivory/20 text-sm px-3 py-1.5 hover:brightness-110"
                    onClick={() => continueToNextRound()}
                  >
                    Skip
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Footer controls */}
        <div className="fixed bottom-25 z-10 text-center flex justify-center ">
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
                                  {/* Target inclusion */}
                                  <div className="rounded-lg bg-black/20 border border-hp-ivory/15 p-3">
                                    <div className="text-xs uppercase opacity-70">
                                      Target inclusion
                                    </div>
                                    <div className="mt-1 font-semibold">
                                      ≥
                                      {Math.round(
                                        modPreview.base.minFrac * 100
                                      )}
                                      %
                                      {modPreview.mod.minFrac !==
                                        modPreview.base.minFrac && (
                                        <>
                                          {" "}
                                          →{" "}
                                          <span className="text-emerald-300">
                                            ≥
                                            {Math.round(
                                              modPreview.mod.minFrac * 100
                                            )}
                                            %
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  {/* Spotlight duration */}
                                  <div className="rounded-lg bg-black/20 border border-hp-ivory/15 p-3">
                                    <div className="text-xs uppercase opacity-70">
                                      Spotlight duration
                                    </div>
                                    <div className="mt-1 font-semibold">
                                      {(
                                        modPreview.base.revealMs / 1000
                                      ).toFixed(1)}
                                      s
                                      {modPreview.mod.revealMs !==
                                        modPreview.base.revealMs && (
                                        <>
                                          {" "}
                                          →{" "}
                                          <span className="text-emerald-300">
                                            {(
                                              modPreview.mod.revealMs / 1000
                                            ).toFixed(1)}
                                            s
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
                                      {modPreview.base.speedMult.toFixed(1)}x{" "}
                                      <span className="opacity-70">×</span>{" "}
                                      {modPreview.base.powMult.toFixed(2)}{" "}
                                      <span className="opacity-70">=</span>{" "}
                                      <span>
                                        {modPreview.base.totalPoints
                                          ? modPreview.base.totalPoints.toFixed(
                                              1
                                            )
                                          : (
                                              modPreview.base.speedMult *
                                              modPreview.base.powMult
                                            ).toFixed(1)}
                                        x
                                      </span>
                                      {(modPreview.base.speedMult !==
                                        modPreview.mod.speedMult ||
                                        modPreview.base.powMult !==
                                          modPreview.mod.powMult) && (
                                        <>
                                          {" "}
                                          →{" "}
                                          <span className="text-emerald-300">
                                            {modPreview.mod.speedMult.toFixed(
                                              1
                                            )}
                                            x{" "}
                                            <span className="opacity-70">
                                              ×
                                            </span>{" "}
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
                                      Speed multiplier × Power-up bonus
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

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import HpButton from "../../components/hp-button";

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
  const [hudKey, setHudKey] = useState(0); // NEW: force HUD re-animate per round
  const displayScore = Math.round(score * 10) / 10; // Tidy score display

  // Refs for timers and intervals
  const startOverlayTimerRef = useRef(null);
  const startRoundTimerRef = useRef(null); // NEW: delay kickoff until curtains are in
  const lastSpeedLabelRef = useRef(null);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);
  const targetShuffleCountRef = useRef(0);
  const totalShufflesRef = useRef(0);

  // Shuffle progress
  const totalShuffles = totalShufflesRef.current || 0;
  const doneShuffles = Math.max(0, totalShuffles - Math.max(shufflesLeft, 0));
  const progressPct = totalShuffles
    ? Math.min(100, Math.round((doneShuffles / totalShuffles) * 100))
    : 0;

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
  }

  // Human-readable speed
  const shufflesPerSec = Math.round((1000 / speedMs) * 10) / 10;
  const speedLabel =
    shufflesPerSec >= 3
      ? "Very fast"
      : shufflesPerSec >= 2
      ? "Fast"
      : shufflesPerSec >= 1.2
      ? "Normal"
      : "Slow";

  // Helper to compute label + SPS from ms (for upcoming round preview)
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
      // Very fast: 3.0 base, then +0.1 per 0.1 shuffles/s beyond 3.0
      const extra = Math.max(0, Math.floor((sps - 3) * 10) / 10);
      multiplier = +(3 + extra).toFixed(1);
    }

    return { label, sps, multiplier };
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
    // Only clear phase timers here; keep overlay timer alive
    clearPhaseTimers();

    const { count, speed, swaps } = computeDifficulty(nextRound);
    const target = BASE_CARDS[Math.floor(Math.random() * BASE_CARDS.length)];
    const distractors = sampleWithout(BASE_CARDS, count - 1, target.id);
    const subset = shuffle([target, ...distractors]);

    setCards(subset);
    setTargetId(target.id);
    setTargetName(target.name);
    setRound(nextRound);
    setShufflesLeft(swaps);
    totalShufflesRef.current = swaps;
    setSpeedMs(speed);
    setClickedId(null);
    targetShuffleCountRef.current = 0;
    setVisibleCount(0);

    // Decide how long curtains stay closed based on speed tier change
    const { label } = getSpeedMeta(speed);
    const showSpeedChanged = lastSpeedLabelRef.current !== label;
    lastSpeedLabelRef.current = label;

    const baseCurtainHoldMs = 900;
    const overlayHideMs = showSpeedChanged ? 1400 : baseCurtainHoldMs;

    // NEW: delay the 'enter' phase start to match the longer curtain
    const extraHold = overlayHideMs - baseCurtainHoldMs;
    setEnterDelayMs(700 + extraHold);

    if (startOverlayTimerRef.current)
      clearTimeout(startOverlayTimerRef.current);
    startOverlayTimerRef.current = setTimeout(() => {
      setIsStarting(false);
      setHudKey((k) => k + 1); // NEW: trigger HUD re-mount/animate after curtain
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
      timerRef.current = setTimeout(() => setPhase("cover"), 1200);
    } else if (phase === "cover") {
      timerRef.current = setTimeout(() => setPhase("shuffling"), 1500);
    } else if (phase === "shuffling") {
      if (shufflesLeft <= 0) {
        setPhase("guess");
      } else {
        timerRef.current = setTimeout(() => {
          setCards((prev) => {
            if (prev.length < 2) return prev;

            const size = getCycleSize(prev.length, round);
            const targetIdx = prev.findIndex((c) => c.id === targetId);

            // NEW: require at least 1/3 of total shuffles to include the target
            const requiredMin = Math.ceil(totalShufflesRef.current / 3);
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

    if (id === targetId) {
      // Award points using the current round's multiplier
      const { multiplier } = getSpeedMeta(speedMs);
      setScore((s) => s + multiplier);
      setPhase("result"); // Correct; wait for Next Round button
    } else {
      setPhase("gameover"); // Wrong; show Restart
    }
  }

  // Start next round with curtain overlay
  function goToNextRound() {
    const next = round + 1;
    primeCurtainForRound(next); // NEW
    setIsStarting(true);
    setHeroOut(false);
    // Wait for curtains to finish sliding in (~0.5s), then start the round
    if (startRoundTimerRef.current) clearTimeout(startRoundTimerRef.current);
    startRoundTimerRef.current = setTimeout(() => {
      startRound(next);
    }, 520);
  }

  // Start the game from hero (always round 1) using curtains, not onExitComplete
  function startGameFromHero() {
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
    // During enter and showTarget, ALL are face up
    if (phase === "enter" || phase === "showTarget") return true;
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

  return (
    <main>
      <div className="relative min-h-screen bg-hp-royal pt-30 px-6 md:px-12 overflow-x-hidden">
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

                <h1 className="mt-4 text-5xl sm:text-6xl font-extrabold leading-tight">
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
                  <HpButton onClick={startGameFromHero} text={"Start Game"} />
                  <span
                    className="text-sm cursor-pointer pt-2"
                    onClick={() => setShowTips((s) => !s)}
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
          <AnimatePresence mode="wait">
            <motion.div
              key={`hud-${hudKey}-${round}`} // NEW: re-animate each round
              className="relative z-10 max-w-6xl mx-auto mb-6"
              initial={{ opacity: 0, y: -8, scale: 0.98, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, scale: 0.98, filter: "blur(2px)" }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
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
              key={`status-${phase}-${targetName ?? ""}`}
              className="relative z-[60] mx-auto max-w-6xl px-4"
              initial={{ opacity: 0, y: -6, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="flex justify-center">
                <div
                  className={[
                    "inline-flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur pointer-events-none",
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
                >
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
                      {phase === "shuffling" &&
                        `Shuffles: ${doneShuffles}/${totalShuffles}`}
                      {phase === "guess" && "Tap a card to make your guess."}
                      {phase === "result" && "Press Next Round to continue."}
                      {phase === "gameover" && "Press Restart to try again."}
                    </motion.span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

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
        <div className="relative max-w-7xl mx-auto flex flex-col items-center justify-center h-full mt-12 ">
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
                const highlighting = phase === "showTarget" && isTarget;

                return (
                  <motion.button
                    key={c.id}
                    layout
                    // Entrance animation similar to character-spread
                    initial={{ opacity: 0, y: -50, scale: 0.8, rotateZ: -5 }}
                    animate={{ opacity: 1, y: 0, scale: 1, rotateZ: 0 }}
                    transition={{ type: "spring", stiffness: 250, damping: 20 }}
                    onClick={() => {
                      if (!isClickable) return;
                      setTossingId(c.id);
                      handleGuess(c.id);
                    }}
                    disabled={!isClickable}
                    className="relative block text-left"
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
        {/* Footer controls */}
        <div className="relative z-10 text-center flex justify-center pb-12 pt-12">
          {phase === "guess" && (
            <HpButton
              text={"Replay Round"}
              onClick={() => startRound(round)} // Replay can stay instant, or use curtain if you prefer:
            />
          )}

          {phase === "result" && (
            <HpButton text={"Next Round"} onClick={goToNextRound} />
          )}

          {phase === "gameover" && (
            <HpButton text={"Restart"} onClick={resetGame} />
          )}
        </div>
      </div>
    </main>
  );
}

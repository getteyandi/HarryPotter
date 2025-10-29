import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkle } from "lucide-react";

export default function MagicSplash({
  show = true,
  title = "HOGWARTS LEDGER",
  mountDelay = 0.15, // slight delay so the orb doesn't snap in immediately
}) {
  const stars = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        key: i,
        left: `${Math.floor(Math.random() * 100)}%`,
        top: `${Math.floor(Math.random() * 100)}%`,
        size: [1, 1.5, 2][Math.floor(Math.random() * 3)],
        delay: Math.random() * 2,
      })),
    []
  );

  const easing = [0.22, 1, 0.36, 1];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="magic-splash"
          className="fixed inset-0 z-[500] grid place-items-center pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{
            background:
              "radial-gradient(1400px 700px at 50% 60%, rgba(223,170,56,0.08), rgba(4, 17, 25, 1) 70%)",
          }}
        >
          {/* Subtle starfield backdrop */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {stars.map((s) => (
              <motion.span
                key={s.key}
                className="absolute rounded-full"
                style={{
                  left: s.left,
                  top: s.top,
                  width: s.size,
                  height: s.size,
                  background:
                    "radial-gradient(circle, rgba(255,255,255,0.8), rgba(255,255,255,0))",
                  filter: "drop-shadow(0 0 6px rgba(223,170,56,0.35))",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.65, 1, 0] }}
                transition={{
                  duration: 2.6,
                  repeat: Infinity,
                  repeatDelay: 1.2,
                  delay: s.delay,
                  ease: "easeInOut",
                }}
                aria-hidden
              />
            ))}

            {/* Occasional comets */}
            <motion.span
              className="absolute block"
              style={{
                left: "-10%",
                top: "20%",
                width: 120,
                height: 2,
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(223,170,56,0.9) 45%, rgba(255,255,255,0) 100%)",
                filter: "drop-shadow(0 0 8px rgba(223,170,56,0.6))",
              }}
              initial={{ opacity: 0, rotate: -12, x: 0 }}
              animate={{ opacity: [0, 1, 0], x: "130vw" }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                repeatDelay: 4.5,
                ease: "easeOut",
                delay: 0.8,
              }}
              aria-hidden
            />
            <motion.span
              className="absolute block"
              style={{
                right: "-15%",
                bottom: "18%",
                width: 140,
                height: 2,
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(223,170,56,0.85) 55%, rgba(255,255,255,0) 100%)",
                filter: "drop-shadow(0 0 8px rgba(223,170,56,0.55))",
              }}
              initial={{ opacity: 0, rotate: 18, x: 0 }}
              animate={{ opacity: [0, 1, 0], x: "-130vw" }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                repeatDelay: 6.2,
                ease: "easeOut",
                delay: 1.6,
              }}
              aria-hidden
            />
          </div>

          {/* Center group */}
          <motion.div
            className="flex flex-col items-center justify-center gap-6"
            initial={{ opacity: 0, scale: 0.85, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotate: 6 }}
            transition={{ duration: 0.65, ease: easing, delay: mountDelay }}
          >
            <div className="relative w-48 h-48">
              {/* Portal ripple behind the orb */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  boxShadow:
                    "0 0 24px rgba(223,170,56,0.25), inset 0 0 24px rgba(223,170,56,0.15)",
                  filter: "blur(0.2px)",
                }}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: [0, 0.35, 0.15], scale: [0.85, 1.1, 1.25] }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                aria-hidden
              />

              {/* Rune ring (conic dashes) */}
              <motion.div
                className="absolute inset-0 rounded-full overflow-hidden"
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                aria-hidden
              >
                <div
                  className="absolute inset-[-16%] rounded-full opacity-40"
                  style={{
                    background:
                      "repeating-conic-gradient(from 0deg, rgba(223,170,56,0.5) 0deg 2deg, transparent 2deg 9deg)",
                    WebkitMask:
                      "radial-gradient(circle, transparent 54%, rgba(0,0,0,1) 55%, rgba(0,0,0,1) 70%, transparent 71%)",
                    mask: "radial-gradient(circle, transparent 54%, rgba(0,0,0,1) 55%, rgba(0,0,0,1) 70%, transparent 71%)",
                    filter: "blur(0.15px)",
                  }}
                />
              </motion.div>

              {/* Outer glyph ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2"
                style={{
                  borderColor: "rgba(223,170,56,0.25)",
                  boxShadow:
                    "0 0 24px rgba(223,170,56,0.25), inset 0 0 24px rgba(223,170,56,0.15)",
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.7,
                  ease: easing,
                  delay: mountDelay + 0.1,
                }}
              />

              {/* Inner pulse */}
              <motion.div
                className="absolute inset-6 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(223,170,56,0.22), rgba(223,170,56,0.05) 60%, transparent 70%)",
                  filter: "blur(1px)",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.2, 0.6, 0.4, 0.6] }}
                transition={{
                  duration: 2.1,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: mountDelay + 0.15,
                }}
              />

              {/* Sparkles orbiting */}
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute text-amber-200 select-none"
                  style={{
                    left: ["10%", "80%", "20%", "70%", "40%", "60%"][i],
                    top: ["15%", "25%", "60%", "70%", "40%", "30%"][i],
                    fontSize: ["12px", "10px", "11px", "9px", "10px", "11px"][
                      i
                    ],
                  }}
                  initial={{ opacity: 0, scale: 0, y: 6 }}
                  animate={{
                    opacity: [0, 1, 0.8, 1, 0],
                    scale: [0, 1, 1, 1, 0.9],
                    y: [6, 0, -2, 0, 6],
                  }}
                  transition={{
                    duration: 1.8 + i * 0.12,
                    repeat: Infinity,
                    delay: 0.2 * i + mountDelay,
                    ease: "easeInOut",
                  }}
                  aria-hidden
                >
                  <Sparkle className="w-3.5 h-3.5 drop-shadow-[0_0_6px_rgba(223,170,56,0.35)]" />
                </motion.span>
              ))}
            </div>

            {/* Title glow */}
            <motion.h1
              className="text-2xl sm:text-3xl font-extrabold leading-tight"
              initial={{ opacity: 0, letterSpacing: "0.05em", y: 6 }}
              animate={{
                opacity: 1,
                letterSpacing: ["0.05em", "0.2em", "0.1em"],
                y: 0,
                textShadow: [
                  "0 0 0px rgba(223,170,56,0.0)",
                  "0 0 12px rgba(223,170,56,0.5)",
                  "0 0 6px rgba(223,170,56,0.3)",
                ],
              }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{
                duration: 0.9,
                ease: easing,
                delay: mountDelay + 0.2,
              }}
            >
              <span className="bg-gradient-to-r text-nowrap from-amber-300 via-amber-200 to-amber-400 bg-clip-text text-transparent drop-shadow">
                {title}
              </span>
            </motion.h1>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { motion } from "framer-motion";

export default function MagicLoader({
  label = "Loading more...",
  className = "",
  size = 48,
}) {
  const ring = {
    animate: {
      rotate: 360,
      transition: { repeat: Infinity, duration: 2.4, ease: "linear" },
    },
  };

  const sparkle = (delay = 0) => ({
    initial: { scale: 0, opacity: 0, y: 6 },
    animate: {
      scale: [0, 1, 0],
      opacity: [0, 1, 0],
      y: [6, 0, -6],
      transition: {
        delay,
        repeat: Infinity,
        duration: 1.6,
        ease: "easeInOut",
      },
    },
  });

  return (
    <div
      className={[
        "flex flex-col items-center justify-center gap-3 pb-12",
        className,
      ].join(" ")}
      role="status"
      aria-live="polite"
    >
      <div className="relative">
        {/* Rotating ring */}
        <motion.div
          variants={ring}
          animate="animate"
          className="rounded-full border-2"
          style={{
            width: size,
            height: size,
            borderColor: "rgba(223,170,56,0.35)",
            borderTopColor: "rgba(223,170,56,0.9)",
          }}
        />
        {/* Glowing core */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow:
              "0 0 16px rgba(223,170,56,0.45) inset, 0 0 24px rgba(223,170,56,0.25)",
          }}
        />
        {/* Sparkles */}
        <motion.span
          className="absolute left-1/2 -translate-x-1/2 text-amber-200"
          variants={sparkle(0.0)}
          initial="initial"
          animate="animate"
        >
          ✨
        </motion.span>
        <motion.span
          className="absolute right-0 top-1/2 -translate-y-1/2 text-amber-200"
          variants={sparkle(0.3)}
          initial="initial"
          animate="animate"
        >
          ✨
        </motion.span>
        <motion.span
          className="absolute left-0 top-1/2 -translate-y-1/2 text-amber-200"
          variants={sparkle(0.6)}
          initial="initial"
          animate="animate"
        >
          ✨
        </motion.span>
      </div>
      <p className="text-sm text-hp-ivory/70">{label}</p>
    </div>
  );
}

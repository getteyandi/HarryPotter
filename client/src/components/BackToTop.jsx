import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";

export default function BackToTop({ threshold = 300, className = "" }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  const goTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          onClick={goTop}
          initial={{ opacity: 0, scale: 0.8, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 12 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={[
            "fixed bottom-6 right-6 z-[95] cursor-pointer",
            "rounded-full border border-amber-300/40 bg-amber-400/15 backdrop-blur",
            "shadow-xl hover:brightness-110 active:scale-95",
            "w-12 h-12 grid place-items-center text-amber-100",
            className,
          ].join(" ")}
          aria-label="Back to top"
          title="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

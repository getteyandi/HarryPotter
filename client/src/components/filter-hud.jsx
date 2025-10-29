import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import Select from "./select";

export default function FilterHUD({
  config,
  initial = {},
  onQueryChange,
  className = "",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(initial.search || "");
  const [sort, setSort] = useState(
    initial.sort || (config.sorts?.[0]?.value ?? "")
  );
  const [values, setValues] = useState(() => {
    const v = {};
    (config.filters || []).forEach((f) => (v[f.key] = initial[f.key] ?? ""));
    return v;
  });

  // Track scroll like Topbar
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Measure to prevent layout jump when switching to fixed
  const boxRef = useRef(null);
  const [hudHeight, setHudHeight] = useState(0);
  useEffect(() => {
    const measure = () => {
      if (!boxRef.current) return;
      setHudHeight(boxRef.current.getBoundingClientRect().height);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (boxRef.current) ro.observe(boxRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [open]);

  // Debounce search + emit query
  useEffect(() => {
    const t = setTimeout(() => {
      onQueryChange?.({ search, sort, ...values });
    }, 300);
    return () => clearTimeout(t);
  }, [search, sort, values, onQueryChange]);

  const hasActive = useMemo(() => {
    return Boolean(search) || Object.values(values).some((v) => v);
  }, [search, values]);

  function updateValue(key, v) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  function clearAll() {
    setSearch("");
    setSort(config.sorts?.[0]?.value ?? "");
    const cleared = {};
    (config.filters || []).forEach((f) => (cleared[f.key] = ""));
    setValues(cleared);
    onQueryChange?.({
      search: "",
      sort: config.sorts?.[0]?.value ?? "",
      ...cleared,
    });
  }

  // Pause animation while focusing/typing in the search input
  const [searchFocused, setSearchFocused] = useState(false);
  const [typing, setTyping] = useState(false);
  const typingTimerRef = useRef(null);
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);
  const animateActive = !disabled && !searchFocused && !typing;

  // Positioning/styles like Topbar (normal vs fixed)
  const wrapperClass = [
    "",
    scrolled ? "fixed top-14 left-0 w-full z-90" : "relative w-full z-10",
  ].join(" ");
  const frameClass = [
    "rounded-2xl z-10 top-0 h-full pointer-events-none absolute border px-3 sm:px-4 transition-[colors,width,filters,opacity] duration-300",
    scrolled
      ? "bg-hp-royal/60 w-full opacity-100 backdrop-blur-lg border-hp-ivory/20 shadow-2xl"
      : "bg-hp-royal/80 w-0 backdrop-blur opacity-0 border-hp-ivory/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
  ].join(" ");

  return (
    <>
      {/* Spacer to prevent content jump when we switch to fixed */}
      {scrolled && <div style={{ height: hudHeight }} aria-hidden />}

      <div className={[wrapperClass, className].join(" ")}>
        <div
          className={`mx-auto max-w-6xl px-4 transition-[padding,max-width] duration-500  ${
            scrolled ? "px-0 max-w-7xl" : "px-6"
          }`}
        >
          <div ref={boxRef} className="relative w-full py-2.5">
            <div className="flex flex-wrap items-center gap-2.5 z-40">
              {/* Search */}
              <div className="ml-2.5 z-30 flex items-center gap-2 bg-black/25 border border-hp-ivory/20 rounded-xl px-3 py-1.5 min-w-[240px] flex-1 sm:flex-none">
                {/* <Search className="w-4 text-hp-ivory" /> */}
                {/* NEW: Magical idle animation for the search icon */}
                <div className="relative w-4 h-4">
                  <motion.span
                    className="absolute inset-0 grid place-items-center"
                    animate={
                      animateActive
                        ? { y: [0, -1.5, 0], rotate: [0, -5, 0] }
                        : { y: 0, rotate: 0 }
                    }
                    transition={
                      animateActive
                        ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
                        : { duration: 0.15 }
                    }
                  >
                    <Search className="w-4 h-4 text-white drop-shadow-[0_0_6px_rgba(223,170,56,0.35)]" />
                  </motion.span>
                  <AnimatePresence>
                    {animateActive && (
                      <>
                        <motion.span
                          key="spark-1"
                          className="absolute -top-1 -left-1 text-amber-200 text-xs pointer-events-none"
                          initial={{ opacity: 0, scale: 0, y: 2 }}
                          animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                            y: [2, -2],
                          }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            delay: 0.1,
                            ease: "easeInOut",
                          }}
                          aria-hidden
                        >
                          ✨
                        </motion.span>
                        <motion.span
                          key="spark-2"
                          className="absolute -bottom-1 -right-1 text-amber-200/90 text-[10px] pointer-events-none"
                          initial={{ opacity: 0, scale: 0, y: -2 }}
                          animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                            y: [-2, 2],
                          }}
                          transition={{
                            duration: 1.4,
                            repeat: Infinity,
                            delay: 0.5,
                            ease: "easeInOut",
                          }}
                          aria-hidden
                        >
                          ✨
                        </motion.span>
                        <motion.span
                          key="spark-3"
                          className="absolute -top-1.5 right-0 text-amber-100/80 text-[9px] pointer-events-none"
                          initial={{ opacity: 0, scale: 0, x: -1 }}
                          animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                            x: [-1, 1],
                          }}
                          transition={{
                            duration: 1.6,
                            repeat: Infinity,
                            delay: 0.9,
                            ease: "easeInOut",
                          }}
                          aria-hidden
                        >
                          ✨
                        </motion.span>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setTyping(true);
                    if (typingTimerRef.current)
                      clearTimeout(typingTimerRef.current);
                    typingTimerRef.current = setTimeout(
                      () => setTyping(false),
                      500
                    );
                  }}
                  placeholder={config.search?.placeholder || "Search..."}
                  className="bg-transparent outline-none text-hp-ivory text-sm w-full"
                  disabled={disabled}
                  aria-label="Search"
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
              </div>

              {/* Sort */}
              {config.sorts?.length > 0 && (
                <div className=" z-30 ml-2.5 md:ml-0 flex items-center gap-2 bg-black/25 border border-hp-ivory/20 rounded-xl px-3 py-1.5">
                  <span className="text-xs uppercase tracking-wider text-white">
                    Sort
                  </span>
                  <select
                    className="bg-transparent !cursor-pointer outline-none text-hp-ivory text-sm"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    disabled={disabled}
                    aria-label="Sort by"
                  >
                    {config.sorts.map((s) => (
                      <option
                        key={s.value}
                        value={s.value}
                        className="bg-hp-royal "
                      >
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Filter toggle */}
              <button
                type="button"
                className={[
                  "cursor-pointer  z-30 rounded-xl border px-3 py-1.5 text-sm transition-colors",
                  hasActive
                    ? "bg-amber-400/10 border-amber-300/40 text-amber-100"
                    : "bg-black/25 border-hp-ivory/20 text-white",
                ].join(" ")}
                onClick={() => setOpen((o) => !o)}
                disabled={disabled}
                aria-expanded={open}
              >
                Filters {hasActive ? "• active" : ""}
              </button>

              {/* Clear */}
              <button
                type="button"
                className="ml-auto mr-2.5 z-30 cursor-pointer rounded-xl border border-hp-ivory/20 bg-black/25 px-3 py-1.5 text-xs text-hp-ivory/80 hover:brightness-110"
                onClick={clearAll}
                disabled={disabled}
              >
                Clear
              </button>
            </div>

            {/* Collapsible filter panel */}
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  key="filters"
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="pt-2.5 px-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {(config.filters || []).map((f) => (
                      <div
                        key={f.key}
                        className="flex z-40 items-center gap-2 bg-black/25 border border-hp-ivory/20 rounded-xl px-3 py-1.5"
                      >
                        <span className="text-xs uppercase tracking-wider text-white min-w-[72px]">
                          {f.label}
                        </span>
                        {f.type === "select" ? (
                          <Select
                            value={values[f.key] || ""}
                            onChange={(val) => updateValue(f.key, val)} // NEW
                            options={f.options || []} // NEW
                            placeholder="Any" // NEW
                            disabled={disabled} // NEW
                            className="flex-1" // NEW
                            ariaLabel={f.label} // NEW
                          />
                        ) : (
                          <input
                            type="text"
                            value={values[f.key] || ""}
                            onChange={(e) => updateValue(f.key, e.target.value)}
                            className="bg-transparent outline-none text-hp-ivory text-sm flex-1"
                            placeholder="Any"
                            disabled={disabled}
                            aria-label={f.label}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={frameClass} />
          </div>
        </div>
      </div>
    </>
  );
}

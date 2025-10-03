import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { ChevronDown, Check, X } from "lucide-react";

export default function Select({
  value = "",
  onChange,
  options = [],
  placeholder = "Any",
  disabled = false,
  className = "",
  ariaLabel = "Select",
  // NEW: optional z-index for the dropdown portal
  dropdownZIndex = 1000, // NEW
}) {
  // NEW: normalize options to [{label, value}]
  const normalized = useMemo(
    () =>
      options.map((o) => (typeof o === "string" ? { label: o, value: o } : o)),
    [options]
  );
  // NEW: include "Any" option as empty value
  const items = useMemo(
    () => [{ label: placeholder, value: "" }, ...normalized],
    [normalized, placeholder]
  );

  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const id = useId();

  // NEW: portal positioning state
  const [menuRect, setMenuRect] = useState({
    left: 0,
    top: 0,
    width: 0,
    maxHeight: 280,
    placement: "bottom",
  });

  const currentIndex = useMemo(
    () =>
      Math.max(
        0,
        items.findIndex((it) => it.value === value)
      ),
    [items, value]
  );

  useEffect(() => {
    if (open) {
      setHighlight(currentIndex >= 0 ? currentIndex : 0);
      // focus list on open
      setTimeout(() => listRef.current?.focus(), 0);
    }
  }, [open, currentIndex]);

  // NEW: compute/fix menu position in a portal to escape overflow hidden
  const updatePosition = () => {
    const t = triggerRef.current;
    if (!t) return;
    const r = t.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 8;
    const width = r.width;
    const spaceBelow = vh - r.bottom - margin;
    const spaceAbove = r.top - margin;
    const idealMaxH = Math.min(320, Math.max(160, spaceBelow));
    const placeBottom = spaceBelow >= 180 || spaceBelow >= spaceAbove;

    setMenuRect({
      left: Math.max(margin, Math.min(r.left, vw - width - margin)),
      top: placeBottom ? r.bottom + 4 : Math.max(margin, r.top - 4),
      width,
      maxHeight: placeBottom
        ? idealMaxH
        : Math.min(320, Math.max(160, spaceAbove)),
      placement: placeBottom ? "bottom" : "top",
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();

    const onScroll = () => updatePosition(); // NEW
    const onResize = () => updatePosition(); // NEW
    window.addEventListener("scroll", onScroll, true); // NEW: capture to catch inner scrollers
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  // NEW: close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (
        !triggerRef.current?.contains(e.target) &&
        !listRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown, true);
    return () => document.removeEventListener("mousedown", onDown, true);
  }, [open]);

  // Keyboard navigation
  function handleKeyDown(e) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(items.length - 1, h + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      setHighlight(0);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      setHighlight(items.length - 1);
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const chosen = items[highlight];
      if (chosen) {
        onChange?.(chosen.value);
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
  }

  const selectedLabel =
    items.find((it) => it.value === value)?.label || placeholder;

  // Dropdown content rendered in portal
  const dropdown = open
    ? createPortal(
        <AnimatePresence>
          <motion.ul
            id={`${id}-listbox`}
            role="listbox"
            ref={listRef}
            tabIndex={-1}
            initial={{
              opacity: 0,
              y: menuRect.placement === "bottom" ? -6 : 6,
              scale: 0.98,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: menuRect.placement === "bottom" ? -6 : 6,
              scale: 0.98,
            }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            style={{
              position: "fixed", // NEW: escape overflow hidden ancestors
              left: menuRect.left,
              top: menuRect.placement === "bottom" ? menuRect.top : undefined,
              bottom:
                menuRect.placement === "top"
                  ? window.innerHeight - menuRect.top
                  : undefined,
              width: menuRect.width,
              maxHeight: menuRect.maxHeight,
              zIndex: dropdownZIndex, // NEW
            }}
            className={[
              "rounded-xl border border-hp-ivory/20 bg-hp-royal/95 backdrop-blur shadow-2xl",
              "overflow-auto focus:outline-none",
            ].join(" ")}
            onKeyDown={handleKeyDown}
          >
            {items.map((it, idx) => {
              const isSel = it.value === value;
              const isHi = idx === highlight;
              return (
                <li
                  key={it.label + "|" + idx}
                  role="option"
                  aria-selected={isSel}
                  className={[
                    "flex items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer",
                    isHi
                      ? "bg-white/10 text-hp-ivory"
                      : "text-hp-ivory/90 hover:bg-white/10",
                  ].join(" ")}
                  onMouseEnter={() => setHighlight(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange?.(it.value);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                >
                  <span className="truncate">{it.label}</span>
                  {isSel && (
                    <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                  )}
                </li>
              );
            })}
          </motion.ul>
        </AnimatePresence>,
        document.body
      )
    : null;

  return (
    <div className={["relative", className].join(" ")}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={[
          "w-full cursor-pointer max-h-8 rounded-xl border border-hp-ivory/20 bg-black/25",
          "px-3 py-1.5 text-left text-sm text-hp-ivory",
          "inline-flex items-center justify-between gap-2",
          disabled ? "opacity-60 cursor-not-allowed" : "hover:brightness-110",
        ].join(" ")}
      >
        <span
          className={[
            "truncate",
            value === "" ? "text-hp-ivory/70" : "text-hp-ivory",
          ].join(" ")}
        >
          {selectedLabel}
        </span>
        <div className="flex items-center gap-1.5">
          {value !== "" && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange?.("");
              }}
              title="Clear"
              className="rounded-md  hover:bg-white/10"
            >
              <X className="w-4 h-4 opacity-80" />
            </span>
          )}
          <ChevronDown
            className={[
              "w-4 h-4 transition-transform",
              open ? "rotate-180" : "rotate-0",
            ].join(" ")}
          />
        </div>
      </button>

      {/* Portal dropdown (escapes overflow hidden) */}
      {dropdown /* NEW */}
    </div>
  );
}

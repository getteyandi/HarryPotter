import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const menuItems = [
  { name: "Home", href: "/home" },
  { name: "Characters", href: "/characters" },
  { name: "Spells", href: "/spells" },
  { name: "Potions", href: "/potions" },
  { name: "Books & Movies", href: "/books-and-movies" },
];

export default function Topbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // ESC to close and lock body scroll while open
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="fixed z-100 top-0 left-0 w-full text-white">
      <div
        className={`flex items-center justify-center gap-8 pb-6 px-12 ${
          scrolled ? "pt-3" : "pt-6"
        } transition-[padding-top] duration-500`}
      >
        {/* Desktop nav */}
        <div
          className={`relative z-20 items-center justify-center py-3 px-8 transition-[gap] duration-500 ${
            scrolled ? "gap-8" : "gap-4"
          } hidden md:flex`}
        >
          {menuItems.map((item, idx) => (
            <React.Fragment key={item.name}>
              <Link
                to={item.href}
                className={`z-20 relative group flex justify-center transition-[colors,text-shadow] ${
                  item.href === currentPath
                    ? " text-white duration-500 text-shadow-yellow"
                    : ""
                }`}
              >
                <p
                  className={`group-hover:text-white transition-colors duration-500 ${
                    item.href === currentPath ? "font-bold" : "font-normal"
                  }`}
                >
                  {item.name}
                </p>
                {item.href !== currentPath && (
                  <span className="min-h-[1px] w-0 opacity-0 group-hover:opacity-100 group-hover:w-full absolute bottom-0 bg-hp-ivory  duration-500" />
                )}
              </Link>
              {menuItems.length - 1 !== idx && (
                <div
                  className={`h-4 z-20 border-l border-hp-ivory/20 transition-opacity ${
                    scrolled ? "opacity-100" : "opacity-0"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
          <div
            className={`absolute z-10 border transition-[background-color,backdrop-blur,min-width,border-color,box-shadow,opacity] 
              ${
                scrolled
                  ? "bg-hp-royal/60 backdrop-blur-lg min-w-full border-hp-ivory/20 shadow-2xl inset-shadow-innershadow opacity-100"
                  : "bg-transparent min-w-0 border-transparent opacity-0"
              }  rounded-full text-hp-gray  duration-500 overflow-hidden min-h-full`}
          />
          <div
            className={`pointer-events-none absolute -bottom-10 z-[0] h-[250px]  overflow-hidden [mask-image:radial-gradient(100%_50%,white,transparent)] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_bottom_center,#1C7AA2,transparent_40%)] before:opacity-40 after:absolute ${
              scrolled ? "opacity-100 w-screen" : "opacity-0 w-0"
            } after:inset-0 after:bg-[radial-gradient(circle_at_top_center,#1C7AA2,transparent_70%)] after:opacity-40 transition-[opacity,width] duration-500`}
          ></div>
        </div>

        {/* Mobile hamburger button (floats top-right) */}
        <button
          type="button"
          aria-label="Open menu"
          aria-controls="mobile-menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={`md:hidden fixed top-4 right-4 z-[200] rounded-full border border-hp-ivory/30 bg-hp-royal/70 backdrop-blur-md p-2.5 shadow-lg hover:bg-hp-royal/80 transition`}
        >
          <span
            className={`block h-[2px] w-6 bg-white transition-transform ${
              open ? "translate-y-[6px] rotate-45" : ""
            }`}
          />
          <span
            className={`block h-[2px] w-6 bg-white my-[6px] transition-opacity ${
              open ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`block h-[2px] w-6 bg-white transition-transform ${
              open ? "-translate-y-[6px] -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile overlay */}
      <div
        className={`md:hidden fixed inset-0 z-[180] bg-black/40 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Mobile menu panel */}
      <nav
        id="mobile-menu"
        className={`md:hidden fixed top-14 right-4 z-[190] w-[78vw] max-w-xs rounded-2xl border border-hp-ivory/20 bg-hp-royal/80 backdrop-blur-xl shadow-2xl transition-all ${
          open
            ? "opacity-100 translate-y-0 scale-100"
            : "pointer-events-none opacity-0 -translate-y-2 scale-95"
        }`}
      >
        <ul className="py-2">
          {menuItems.map((item) => {
            const active = item.href === currentPath;
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm ${
                    active
                      ? "text-hp-royal bg-amber-100/90 font-semibold rounded-xl mx-2"
                      : "text-hp-ivory/90 hover:text-white hover:bg-white/5 rounded-xl mx-2"
                  } transition-colors`}
                >
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

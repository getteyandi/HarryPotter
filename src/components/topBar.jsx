import { useEffect, useState } from "react";
import { Menu } from "lucide-react";

const menuItems = [
  { name: "Home", href: "/home", bold: true },
  { name: "Characters", href: "/home" },
  { name: "Spells", href: "/home" },
  { name: "Potions", href: "/home" },
];

export default function Topbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed z-100 top-0 left-0 w-full text-white">
      <div className="flex items-center justify-center gap-8 py-6 px-12">
        <div
          className={`relative flex items-center justify-center py-3 px-8 transition-all duration-500  ${
            scrolled ? "gap-8" : "gap-4"
          }`}
        >
          {menuItems.map((item) => (
            <>
              <a
                key={item.name}
                href={item.href}
                className={`z-10 relative group flex justify-center ${
                  item.bold
                    ? "font-bold text-white hover:transition-all duration-500 text-shadow-yellow"
                    : ""
                }`}
              >
                <p className="group-hover:text-white transition-colors duration-500">
                  {item.name}
                </p>
                {!item.bold && (
                  <span className="min-h-[1px] w-0 opacity-0 group-hover:opacity-100 group-hover:w-full absolute bottom-0 bg-hp-ivory transition-all duration-500" />
                )}
              </a>
              {menuItems.length - 1 !== menuItems.indexOf(item) && (
                <div
                  className={`h-4 border-l border-hp-ivory/20 z-10 transition-opacity ${
                    scrolled ? "opacity-100" : "opacity-0"
                  }`}
                />
              )}
            </>
          ))}
          <div
            className={`absolute border 
              ${
                scrolled
                  ? "bg-hp-royal min-w-full border-hp-ivory/20 shadow-2xl inset-shadow-innershadow opacity-100"
                  : "bg-transparent min-w-0 border-transparent opacity-0"
              }  rounded-full text-hp-gray transition-all duration-500 overflow-hidden min-h-full`}
          />
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

const menuItems = [
  { name: "Home", href: "/home" },
  { name: "Characters", href: "/characters" },
  { name: "Movies", href: "/movies" },
  { name: "Spells", href: "/spells" },
  { name: "Potions", href: "/potions" },
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

  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="fixed z-100 top-0 left-0 w-full text-white">
      <div
        className={`flex items-center justify-center gap-8 pb-6 px-12 ${
          scrolled ? "pt-3" : "pt-6"
        } transition-[padding-top] duration-500`}
      >
        <div
          className={`relative z-20 flex items-center justify-center py-3 px-8 transition-[gap] duration-500  ${
            scrolled ? "gap-8" : "gap-4"
          }`}
        >
          {menuItems.map((item) => (
            <>
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
              {menuItems.length - 1 !== menuItems.indexOf(item) && (
                <div
                  className={`h-4 z-20 border-l border-hp-ivory/20 transition-opacity ${
                    scrolled ? "opacity-100" : "opacity-0"
                  }`}
                />
              )}
            </>
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
            className={`absolute -bottom-10 z-[0] h-[250px]  overflow-hidden [mask-image:radial-gradient(100%_50%,white,transparent)] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_bottom_center,#1C7AA2,transparent_40%)] before:opacity-40 after:absolute ${
              scrolled ? "opacity-100 w-screen" : "opacity-0 w-0"
            } after:inset-0 after:bg-[radial-gradient(circle_at_top_center,#1C7AA2,transparent_70%)] after:opacity-40 transition-[opacity,width] duration-500`}
          ></div>
        </div>
      </div>
    </div>
  );
}

import { Menu } from "lucide-react";

export default function Topbar() {
  return (
    <div className="absolute z-100 top-0 left-0 w-full text-white">
      <div className="flex items-center justify-between gap-8 py-6 px-12">
        <img src="public/images/logo.png" className="h-10" alt="Vite logo" />
        <div className="flex items-center justify-center gap-8 bg-hp-royal/50 inset-shadow-innershadow py-3 px-8 rounded-full text-hp-gray ">
          <a
            href="/home"
            className="font-bold text-white hover:transition-all text-shadow-yellow"
          >
            Home
          </a>
          <a href="/characters">Characters</a>
          <a href="/home">Spells</a>
          <a href="/home">Potions</a>
        </div>
        <Menu className="collapse" />
      </div>
    </div>
  );
}

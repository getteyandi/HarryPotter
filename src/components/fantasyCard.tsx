import { Milk } from "lucide-react";
import React from "react";

interface FantasyCardProps {
  image: string;
  character?: string;
  house?: string;
  description?: string;
}

const FantasyCard: React.FC<FantasyCardProps> = ({
  image,
  character = "Unknown Wizard",
  house = "Unknown House",
  description = "A mysterious figure of magic.",
}) => {
  return (
    // <div className="relative w-64 h-96 rounded-2xl shadow-2xl border-4 border-gold-500 overflow-hidden bg-gradient-to-b from-purple-800 via-indigo-700 to-pink-700 hover:scale-105 transition-transform duration-300">
    // <div className="relative w-64 h-96 rounded-2xl shadow-2xl border-4 border-[#35291C] bg-[#DDB679] overflow-hidden bg- hover:scale-105 transition-transform duration-300">
    //   {/* Magical Glow */}
    //   <div className="absolute inset-0 bg-gradient-to-tr from-purple-400 via-pink-300 to-yellow-300 opacity-30 mix-blend-multiply pointer-events-none"></div>

    //   {/* Character Image */}
    //   <img
    //     src={image}
    //     alt={character}
    //     draggable={false}
    //     className="w-full h-48 object-cover rounded-t-2xl border-b-4 border-gold-500"
    //   />

    // {/* Card Content */}
    // <div className="p-4 flex flex-col justify-between h-48">
    //   <div>
    //     <h2 className="text-2xl font-fantasy text-white drop-shadow-md">
    //       {character}
    //     </h2>
    //     <p className="text-sm font-semibold text-yellow-200 mt-1">{house}</p>
    //   </div>
    //   <p className="text-sm text-white mt-4 font-serif">{description}</p>
    // </div>

    //   {/* Floating Magic Orbs */}
    //   <div className="absolute top-2 right-2 w-6 h-6 bg-yellow-200 rounded-full blur-lg animate-pulse"></div>
    //   <div className="absolute bottom-4 left-4 w-8 h-8 bg-purple-300 rounded-full blur-xl animate-pulse"></div>
    // </div>
    <div className="relative w-64 h-96 flex p-3 items-center rounded-2xl shadow-2xl border-3 border-[#593811] bg-[#35291C] overflow-hidden hover:scale-105 transition-transform duration-300">
      <div
        className="relative w-69 h-90 border-3 border-[#DFAA38] rounded-lg bg-[#DDB679]
               shadow-[inset_0_2px_6px_rgba(0,0,0,0.2),inset_0_-8px_6px_rgba(0,0,0,0.25)]"
      >
        {/* Character Image */}
        <img
          src={image}
          alt={character}
          draggable={false}
          className="w-full h-64 object-cover bg-hp-royal rounded-lg"
        />
        {/* Card Content */}
        <div className="p-2 flex flex-col gap-1 h-48">
          <h2 className=" text-white leading-5 font-bold drop-shadow-md">
            {character}
          </h2>
          <div className="flex gap-0.5 text-[#3F2B0E] bg-[#B49156] w-fit px-1.5 py-0.5 items-center rounded-full">
            <Milk size={10} />
            <p className="text-xs -mb-0.25">{house}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FantasyCard;

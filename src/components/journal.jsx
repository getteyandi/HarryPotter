// components/Journal.jsx
import { useState } from "react";

const Journal = ({ pages }) => {
  const [activeTab, setActiveTab] = useState(Object.keys(pages)[0]);

  return (
    <div className="flex justify-center items-center w-full">
      <div className="flex flex-col self-center">
        {/* Tabs above the journal */}
        <div className="flex w-fit mt-10 -mb-2 ">
          {Object.keys(pages).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-6 py-2 font-bold transition-transform duration-200 border-l-1 border-black/10 bg-hp-ivory w-fit rounded-t-lg
              ${
                activeTab === tab
                  ? "text-hp-royal bg-[#cdac73] shadow-inner"
                  : "text-yellow-900 hover:-translate-y-1"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        {/* Journal */}
        <div className="relative w-[900px] h-[600px] flex rounded-lg shadow-2xl border-8 border-[#4a3728] bg-hp-ivory">
          {/* Spine */}
          <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-[#3a2b20] shadow-inner z-20"></div>

          {/* Left Page */}
          <div className="w-1/2 relative flex flex-col p-6 text-[#2a1d14] bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] bg-repeat">
            {/* Page shadow */}
            <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-r from-transparent to-black/20 pointer-events-none" />
            <div className="overflow-y-auto">{pages[activeTab].left}</div>
          </div>

          {/* Right Page */}
          <div className="w-1/2 relative flex flex-col p-6 text-hp-darkgray bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] bg-repeat">
            {/* Page shadow */}
            <div className="absolute left-0 top-0 h-full w-8 bg-gradient-to-l from-transparent to-black/20 pointer-events-none" />
            <div className="overflow-y-auto">{pages[activeTab].right}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Journal;

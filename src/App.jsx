import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import Topbar from "./components/topBar";
import Clouds from "./components/clouds";
import Birds from "./components/birds";
import SectionTitle from "./components/sectionTitle";
import SectionDetail from "./components/sectiondetail";

function App() {
  const [count, setCount] = useState(0);

  return (
    <main className="relative">
      <Topbar />

      {/* Hero Section */}
      <section className="relative h-screen bg-[url('public/images/hero.png')] bg-cover bg-center px-12">
        <div className="flex flex-col items-start justify-center h-full z-40">
          <img src="public/images/text-logo.png" className="w-126" />
          <h1 className="text-5xl font-bold mt-5">HOGWARTS LEDGER</h1>
          <p className="w-126 text-sm text-hp-gray mt-5">
            Lorem ipsum dolor, sit amet consectetur adipisicing elit. Blanditiis
            reprehenderit non, quod voluptates ipsam aliquid modi
          </p>

          <button className="z-20 bg-hp-royal px-9  py-3 rounded-full mt-6 cursor-pointer font-bold hover:brightness-80 transition-all">
            Start Journey
          </button>
        </div>

        <Birds />
        <Clouds />

        <div className="absolute w-full h-20 bg-gradient-to-t from-hp-royal to-transparent left-0 bottom-0 z-20" />
      </section>

      <section className="h-screen bg-[linear-gradient(225deg,#041119_8%,#041119_60%,#000103_100%)] pt-16">
        <SectionTitle title="DISCOVER CHARACTERS" />

        <div className="flex gap-5 justify-between w-full px-12 relative h-full pt-20">
          <div className="w-150 flex flex-col justify-between">
            <SectionDetail
              title="Meet the Trio"
              description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod.Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod."
              buttonText="Explore Characters"
            />
            <p className="pb-12 text-hp-gray text-sm">
              "Lorem ipsum dolor sit amet consectetur"
            </p>
          </div>
          <img src="public/images/trio.png" className="z-50" />
        </div>
        <img
          src="public/images/section2bg.png"
          className="w-[70%] absolute right-0 bottom-0 opacity-50"
        />
      </section>
    </main>
  );
}

export default App;

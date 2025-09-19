import Clouds from "../components/clouds";
import Birds from "../components/birds";
import SectionTitle from "../components/sectionTitle";
import SectionDetail from "../components/sectiondetail";
import HpButton from "../components/hp-button";
import HpCard from "../components/hp-card";
import Deck from "../components/deck";
import Topbar from "../components/topBar";

export default function Home() {
  return (
    <main className="relative">
      {/* Hero Section */}
      <section className="relative h-screen bg-[url('/public/images/hero.png')] bg-cover bg-center px-12">
        <div className=" max-w-7xl mx-auto flex flex-col items-start justify-center h-full z-40">
          <img src="public/images/text-logo.png" className="w-126" />
          <h1 className="text-5xl font-bold mt-5">HOGWARTS LEDGER</h1>
          <p className="w-126 text-sm text-hp-gray mt-5">
            Lorem ipsum dolor, sit amet consectetur adipisicing elit. Blanditiis
            reprehenderit non, quod voluptates ipsam aliquid modi
          </p>
          <HpButton text="Open Ledger" className={"mt-6"} />
        </div>
        <Birds />
        <Clouds />
        <div className="absolute w-full h-20 bg-gradient-to-t from-hp-royal to-transparent left-0 bottom-0 z-20" />
      </section>

      {/* Characters Section */}
      <section className="relative h-screen w-full bg-[linear-gradient(180deg,#041119_8%,#041119_40%,#000103_100%)] py-16  px-12 ">
        <div className="pb-5">
          <SectionTitle title="DISCOVER CHARACTERS" />
        </div>
        <div className=" max-w-7xl mx-auto flex gap-5 justify-between w-full relative h-full pt-20">
          <div className="w-150 flex flex-col justify-between">
            <SectionDetail
              title="Meet the Trio"
              description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod.Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod."
              buttonText="Open Ledger"
            />
            <p className="pb-12 text-hp-gray text-sm">
              "Lorem ipsum dolor sit amet consectetur"
            </p>
          </div>
          <img
            src="public/images/trio.png"
            className="z-50 max-h-[580px] justify-self-end self-end"
          />
          <img
            src="public/images/section2bg.png"
            className="w-[70%]  absolute right-0 bottom-0 opacity-50"
          />
          <div className="absolute w-full h-20 bg-gradient-to-t from-[#000103] to-transparent  left-0 bottom-0 z-60" />
        </div>
      </section>

      {/* Movies Section */}
      <section className="min-h-screen bg-[#000103] py-16 px-12 ">
        <SectionTitle
          title="EXPLORE MOVIES AND BOOKS"
          backgroundColor={"bg-hp-dark"}
        />
        <div className=" max-w-7xl mx-auto flex gap-5 w-full relative justify-center h-full">
          <div className="flex flex-col justify-between gap-16">
            <SectionDetail
              descriptionAllignment="text-center"
              descriptionClassName="w-full flex flex-col items-center justify-center"
              description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod.Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod."
            />
            <div className="flex items-center gap-8 w-full ">
              <HpCard
                title="Harry Potter and the Philosopher's Stone"
                imageUrl="https://www.wizardingworld.com/images/products/books/UK/rectangle-1.jpg"
              />
              <HpCard
                title="Harry Potter and the Chamber of Secrets"
                imageUrl="https://www.wizardingworld.com/images/products/books/UK/rectangle-2.jpg"
              />
              <HpCard
                title="Harry Potter and the Prisoner of Azkaban"
                imageUrl="https://www.wizardingworld.com/images/products/books/UK/rectangle-3.jpg"
              />
              <HpCard
                title="Harry Potter and the Goblet of Fire"
                imageUrl="https://www.wizardingworld.com/images/products/books/UK/rectangle-4.jpg"
              />
            </div>
            <HpButton text="Open Ledger" className={"self-center"} />
          </div>
        </div>
      </section>
      <section className="relative min-h-screen bg-[#000103] pt-16 px-12 overflow-x-hidden">
        <img
          src="public/images/bg.png"
          className="w-full absolute left-0 bottom-0 opacity-30"
        />
        <SectionTitle
          title="MASTER SPELLS & POTIONS"
          backgroundColor={"bg-hp-dark"}
        />
        <div className="max-w-7xl mx-auto flex pt-20">
          <div className="w-full flex justify-between ">
            <div className="z-20 w-150">
              <SectionDetail
                title="Meet the Trio"
                description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod.Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod."
                buttonText="Open Ledger"
              />
            </div>
            <Deck />
          </div>
        </div>
      </section>
      <footer className="bg-[#202020] items-center gap-2 text-[10px] tracking-widest p-1 flex justify-center">
        Teriyako <p className="text-[8px]">x</p> Kirarin
      </footer>
    </main>
  );
}

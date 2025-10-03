import Clouds from "../components/clouds";
import Birds from "../components/birds";
import SectionTitle from "../components/sectionTitle";
import SectionDetail from "../components/sectiondetail";
import HpButton from "../components/hp-button";
import HpCard from "../components/hp-card";
import Deck from "../components/deck";
import Topbar from "../components/topBar";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import MagicSplash from "../components/magic-splash";

export default function Home() {
  const [ready, setReady] = useState(false);
  const assets = useMemo(
    () => [
      "public/images/hero.png",
      "public/images/text-logo.png",
      "public/images/trio.png",
      "public/images/section2bg.png",
      "public/images/bg.png",
      // book covers
      "https://www.wizardingworld.com/images/products/books/UK/rectangle-1.jpg",
      "https://www.wizardingworld.com/images/products/books/UK/rectangle-2.jpg",
      "https://www.wizardingworld.com/images/products/books/UK/rectangle-3.jpg",
      "https://www.wizardingworld.com/images/products/books/UK/rectangle-4.jpg",
    ],
    []
  );

  useEffect(() => {
    let alive = true;
    const preload = (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = src;
      });
    (async () => {
      const start = Date.now();
      await Promise.all(assets.map(preload));
      // ensure a minimal display time for the splash
      const elapsed = Date.now() - start;
      const min = 2000;
      if (!alive) return;
      if (elapsed < min) {
        setTimeout(() => alive && setReady(true), min - elapsed);
      } else {
        setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [assets]);

  // Animation presets
  const easing = [0.22, 1, 0.36, 1];
  const fadeIn = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.6, ease: easing } },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easing } },
  };
  const slideLeft = {
    hidden: { opacity: 0, x: -28 },
    show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: easing } },
  };
  const slideRight = {
    hidden: { opacity: 0, x: 28 },
    show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: easing } },
  };
  const stagger = (delay = 0.26, interval = 0.26) => ({
    hidden: {},
    show: {
      transition: { delayChildren: delay, staggerChildren: interval },
    },
  });

  return (
    <main className="relative">
      {/* overlay */}
      <MagicSplash show={!ready} title="HOGWARTS LEDGER" />

      <AnimatePresence mode="wait">
        {ready && (
          <motion.div
            key="home-content"
            initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Hero Section */}

            <motion.section
              className="relative h-screen bg-[url('/public/images/hero.png')] bg-cover bg-center px-4 md:px-12"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
            >
              <motion.div
                className=" max-w-7xl mx-auto flex flex-col items-start justify-center h-full z-40"
                variants={stagger(0.1, 0.12)}
              >
                <motion.img
                  src="public/images/text-logo.png"
                  className="w-126"
                  variants={fadeIn}
                />
                <motion.h1
                  className="text-3xl md:text-5xl font-bold mt-5"
                  variants={fadeUp}
                >
                  HOGWARTS LEDGER
                </motion.h1>
                <motion.p
                  className="w-full max-w-126 text-sm text-hp-gray mt-5"
                  variants={fadeUp}
                >
                  Welcome to Hogwarts Ledger, your magical archive for spells,
                  potions, characters, and the legendary stories of the
                  wizarding world.
                </motion.p>
                <motion.div variants={fadeUp}>
                  <HpButton
                    text="Spell Shuffle"
                    tooltip={"Up for the challenge?"}
                    className={"mt-10"}
                    href="/spell-shuffle?intro=1"
                  />
                </motion.div>
              </motion.div>
              <Birds />
              <Clouds />
              <div className="absolute w-full h-20 bg-gradient-to-t from-hp-royal to-transparent left-0 bottom-0 z-20" />
            </motion.section>

            {/* Characters Section */}
            <motion.section
              className="relative min-h-screen w-full bg-[linear-gradient(180deg,#041119_8%,#041119_40%,#000103_100%)] py-16 px-4 md:px-12 "
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
            >
              <div className="pb-5">
                <motion.div variants={fadeUp}>
                  <SectionTitle title="DISCOVER CHARACTERS" />
                </motion.div>
              </div>

              <motion.div
                className="max-w-7xl overflow-y-hidden mx-auto flex md:flex-row flex-col gap-5 justify-between w-full relative h-full md:pt-20"
                variants={stagger(0.1, 0.14)}
              >
                <motion.div
                  className="w-full max-w-150  flex flex-col justify-between"
                  variants={slideLeft}
                >
                  <SectionDetail
                    title="Meet the Trio"
                    description="Discover Harry, Hermione, and Ron—the heart of Hogwarts. Explore their adventures, friendships, and the magic that shaped their destinies."
                    buttonText="View Characters"
                    buttonHref="/characters"
                  />
                  <motion.p
                    className="pb-12 hidden md:flex pt-12 text-hp-gray text-sm"
                    variants={fadeIn}
                  >
                    "It takes a great deal of bravery to stand up to our
                    enemies, but just as much to stand up to our friends." –
                    Albus Dumbledore
                  </motion.p>
                </motion.div>
                <motion.img
                  src="public/images/trio.png"
                  className="z-50 max-h-[580px] justify-self-end self-end"
                  variants={fadeUp}
                />
                <motion.img
                  src="public/images/section2bg.png"
                  className="w-[70%] absolute right-0 bottom-0 opacity-50"
                  variants={fadeIn}
                />
                <div className="absolute w-full h-20 bg-gradient-to-t from-[#000103] to-transparent left-0 bottom-0 z-60" />
              </motion.div>
            </motion.section>
            {/* Movies Section */}
            <motion.section
              className="min-h-screen bg-[#000103] py-16 px-4 md:px-12 "
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
            >
              <motion.div variants={fadeUp}>
                <SectionTitle
                  title="EXPLORE MOVIES & BOOKS"
                  backgroundColor={"bg-hp-dark"}
                />
              </motion.div>
              <motion.div
                className=" max-w-7xl mx-auto flex gap-5 w-full relative justify-center h-full"
                variants={stagger(0.1, 0.12)}
              >
                <motion.div
                  className="flex flex-col justify-between gap-16"
                  variants={fadeIn}
                >
                  <motion.div variants={fadeUp}>
                    <SectionDetail
                      descriptionAllignment="text-center  "
                      descriptionClassName="w-full flex flex-col items-center justify-center"
                      description="Browse the complete Harry Potter book series and cinematic adventures. Relive every spellbinding chapter and magical moment."
                    />
                  </motion.div>
                  <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full "
                    variants={stagger(0.1, 0.1)}
                  >
                    <motion.div variants={fadeUp}>
                      <HpCard
                        title="Harry Potter and the Philosopher's Stone"
                        imageUrl="https://www.wizardingworld.com/images/products/books/UK/rectangle-1.jpg"
                      />
                    </motion.div>
                    <motion.div variants={fadeUp}>
                      <HpCard
                        title="Harry Potter and the Chamber of Secrets"
                        imageUrl="https://www.wizardingworld.com/images/products/books/UK/rectangle-2.jpg"
                      />
                    </motion.div>
                    <motion.div variants={fadeUp}>
                      <HpCard
                        title="Harry Potter and the Prisoner of Azkaban"
                        imageUrl="https://www.wizardingworld.com/images/products/books/UK/rectangle-3.jpg"
                      />
                    </motion.div>
                    <motion.div variants={fadeUp}>
                      <HpCard
                        title="Harry Potter and the Goblet of Fire"
                        imageUrl="https://www.wizardingworld.com/images/products/books/UK/rectangle-4.jpg"
                      />
                    </motion.div>
                  </motion.div>
                  <motion.div
                    className="w-full flex items-center  justify-center"
                    variants={fadeUp}
                  >
                    <HpButton
                      text="VIEW BOOKS & MOVIES"
                      href="/books-and-movies"
                      className={"self-center"}
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.section>
            <section className="relative min-h-screen bg-[#000103] pt-16 px-4 md:px-12 overflow-x-hidden">
              <img
                src="public/images/bg.png"
                className="w-full absolute left-0 bottom-0 opacity-30"
              />
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.25 }}
              >
                <motion.div variants={fadeUp}>
                  <SectionTitle
                    title="MASTER SPELLS & POTIONS"
                    backgroundColor={"bg-hp-dark"}
                  />
                </motion.div>
                <motion.div
                  className="max-w-7xl mx-auto flex pt-6 md:pt-20"
                  variants={stagger(0.1, 0.14)}
                >
                  <div className="w-full flex justify-between flex-col md:flex-row ">
                    <motion.div
                      className="z-20 w-full max-w-150"
                      variants={slideLeft}
                    >
                      <SectionDetail
                        descriptionClassName="w-full max-w-150"
                        title="Master Spells & Potions"
                        description="Unlock the secrets of spellcasting and potion brewing. Study iconic spells, powerful enchantments, and mystical concoctions from the wizarding curriculum."
                        buttonText="View Spells"
                        buttonText2="View Potions"
                        buttonHref="/spells"
                        buttonHref2="/potions"
                      />
                    </motion.div>
                    <motion.div variants={slideRight}>
                      <Deck />
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            </section>
            <footer className="bg-[#202020] py-2 items-center gap-2 text-[10px] tracking-widest p-1 flex justify-center">
              Teriyako <p className="text-[8px]">x</p> Kirarin
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

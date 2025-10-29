import { useState } from "react";
import FantasyCard from "../../components/fantasyCard";
import { motion } from "framer-motion";

// ...existing code...
type Card = {
  id: number;
  name: string;
  forbidden?: boolean;
  revealed: boolean;
  image?: string | null;
  incantation?: string | null;
  category?: string | null;
  effect?: string | null;
  // backup for migration restore
  originalName?: string;
  originalIncantation?: string | null;
  originalCategory?: string | null;
  originalEffect?: string | null;
  originalImage?: string | null;
};

export default function ForbiddenDraw() {
  const initialDeck: Card[] = generateDeck();
  const [deck, setDeck] = useState(initialDeck);
  const [score, setScore] = useState(0);
  const [shield, setShield] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  function generateDeck(): Card[] {
    const placeholder = "../images/hero.png"; // replace if you have a better asset

    const safeSpells: Card[] = [
      {
        id: 0,
        name: "Expelliarmus",
        incantation: "Expelliarmus",
        category: "Charm",
        effect: "Disarms an opponent.",
        image: placeholder,
        revealed: false,
      },
      {
        id: 1,
        name: "Lumos",
        incantation: "Lumos",
        category: "Charm",
        effect: "Creates light at wand tip.",
        image: placeholder,
        revealed: false,
      },
      {
        id: 2,
        name: "Alohomora",
        incantation: "Alohomora",
        category: "Charm",
        effect: "Opens locked objects.",
        image: placeholder,
        revealed: false,
      },
      {
        id: 3,
        name: "Wingardium Leviosa",
        incantation: "Wingardium Leviosa",
        category: "Charm",
        effect: "Levitation of objects.",
        image: placeholder,
        revealed: false,
      },
      {
        id: 4,
        name: "Stupefy",
        incantation: "Stupefy",
        category: "Jinx",
        effect: "Stuns the target.",
        image: placeholder,
        revealed: false,
      },
      {
        id: 5,
        name: "Accio",
        incantation: "Accio",
        category: "Charm",
        effect: "Summons an object.",
        image: placeholder,
        revealed: false,
      },
      {
        id: 6,
        name: "Protego",
        incantation: "Protego",
        category: "Charm",
        effect: "Shields against spells.",
        image: placeholder,
        revealed: false,
      },
      {
        id: 7,
        name: "Expecto Patronum",
        incantation: "Expecto Patronum",
        category: "Charm",
        effect: "Conjures a Patronus.",
        image: placeholder,
        revealed: false,
      },
      {
        id: 8,
        name: "Obliviate",
        incantation: "Obliviate",
        category: "Charm",
        effect: "Erases memories.",
        image: placeholder,
        revealed: false,
      },
      {
        id: 9,
        name: "Rictusempra",
        incantation: "Rictusempra",
        category: "Charm",
        effect: "Tickling jinx.",
        image: placeholder,
        revealed: false,
      },
      {
        id: 10,
        name: "Petrificus Totalus",
        incantation: "Petrificus Totalus",
        category: "Curse",
        effect: "Full body-bind.",
        image: placeholder,
        revealed: false,
      },
    ];

    const forbidden: Card = {
      id: 99,
      name: "Avada Kedavra",
      incantation: "Avada Kedavra",
      category: "Unforgivable Curse",
      effect: "Causes instantaneous death.",
      image: placeholder, // replace with a themed image if you have one
      forbidden: true,
      revealed: false,
    };

    // Shuffle safe + forbidden
    const deck = [...safeSpells, forbidden];
    return deck.sort(() => Math.random() - 0.5);
  }

  function resetGame() {
    setDeck(generateDeck());
    setScore(0);
    setShield(false);
    setMessage(null);
    setGameOver(false);
    setWon(false);
  }

  function flipCard(cardId: number) {
    if (gameOver) return;

    setDeck((prev) => {
      const clicked = prev.find((c) => c.id === cardId);
      if (!clicked || clicked.revealed) return prev;

      let next = prev.map((c) =>
        c.id === cardId ? { ...c, revealed: true } : c
      );

      if (clicked.forbidden) {
        if (shield) {
          setShield(false);

          // Find a target safe, unrevealed card to receive the forbidden spell
          const targets = next.filter(
            (c) => !c.revealed && !c.forbidden && c.id !== cardId
          );

          if (targets.length > 0) {
            const target = targets[Math.floor(Math.random() * targets.length)];

            // migrate in the SAME update
            next = next.map((c) => {
              if (c.id === cardId) {
                // clicked card becomes safe (restore originals if any)
                return {
                  ...c,
                  forbidden: false,
                  name: c.originalName || c.name,
                  incantation: c.originalIncantation ?? c.incantation,
                  category: c.originalCategory ?? c.category,
                  effect: c.originalEffect ?? c.effect,
                  image: c.originalImage ?? c.image,
                };
              }
              if (c.id === target.id) {
                return {
                  ...c,
                  forbidden: true,
                  originalName: c.name,
                  originalIncantation: c.incantation ?? null,
                  originalCategory: c.category ?? null,
                  originalEffect: c.effect ?? null,
                  originalImage: c.image ?? null,
                  name: "Avada Kedavra",
                  incantation: "Avada Kedavra",
                  category: "Unforgivable Curse",
                  effect: "Causes instantaneous death.",
                };
              }
              return c;
            });

            setMessage("⚡ The Forbidden Spell has jumped!");
          } else {
            // No targets: only forbidden was left → immediate win
            next = next.map((c) =>
              c.id === cardId ? { ...c, forbidden: false } : c
            );
            setGameOver(true);
            setWon(true);
            setMessage("🏆 You safely avoided the Forbidden Spell!");
          }
        } else {
          setMessage("💀 You drew the Forbidden Spell!");
          setGameOver(true);
          setWon(false);
        }
      } else {
        setScore((s) => s + 1);
        setMessage(`✅ You revealed ${clicked.name}`);
        if (Math.random() < 0.2) {
          setShield(true);
          setMessage(`🛡️ You gained a Shield Charm!`);
        }
      }

      // Win checks after potential migration
      const unrevealed = next.filter((c) => !c.revealed);
      if (unrevealed.length === 1 && unrevealed[0].forbidden) {
        setGameOver(true);
        setWon(true);
        setMessage("🏆 You safely avoided the Forbidden Spell!");
      }

      const safeLeft = next.filter((c) => !c.forbidden && !c.revealed).length;
      if (safeLeft === 0 && unrevealed.length !== 1) {
        setGameOver(true);
        setWon(true);
        setMessage("🏆 You safely avoided the Forbidden Spell!");
      }

      return next;
    });
  }

  function migrateForbidden(prevDeck: Card[], oldId: number) {
    const unrevealed = prevDeck.filter(
      (c) => !c.revealed && !c.forbidden && c.id !== oldId
    );
    if (unrevealed.length === 0) return;

    const target = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    setDeck((d) =>
      d.map((c) => {
        if (c.id === oldId) {
          // Restore prior values if present
          return {
            ...c,
            forbidden: false,
            name: c.originalName || c.name,
            incantation: c.originalIncantation ?? c.incantation,
            category: c.originalCategory ?? c.category,
            effect: c.originalEffect ?? c.effect,
            image: c.originalImage ?? c.image,
          };
        }
        if (c.id === target.id)
          return {
            ...c,
            forbidden: true,
            // backup original content
            originalName: c.name,
            originalIncantation: c.incantation ?? null,
            originalCategory: c.category ?? null,
            originalEffect: c.effect ?? null,
            originalImage: c.image ?? null,
            // set forbidden visuals
            name: "Avada Kedavra",
            incantation: "Avada Kedavra",
            category: "Unforgivable Curse",
            effect: "Causes instantaneous death.",
            // keep current image or swap to themed one if you prefer
          };
        return c;
      })
    );
  }

  const [tossingId, setTossingId] = useState<number | null>(null);

  return (
    <main className="p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">⚡ The Forbidden Draw</h1>

      <div className="mb-2">Score: {score}</div>
      <div className="mb-2">Shield: {shield ? "🛡️ Active" : "❌ None"}</div>
      {message && <div className="mb-4 text-yellow-300">{message}</div>}

      <div className="grid grid-cols-6 gap-4 max-w-7xl mx-auto">
        {deck.map((card) => {
          const isHidden = !card.revealed && !gameOver;
          const isForbidden = !!card.forbidden && card.revealed;

          return (
            <button
              key={card.id}
              onClick={() => {
                setTossingId(card.id);
                flipCard(card.id);
              }}
              disabled={card.revealed || gameOver}
              className="relative block text-left"
            >
              {/* Tossing wrapper (size + perspective) */}
              <motion.div
                className="relative mx-auto w-[140px] sm:w-[160px] md:w-[180px] aspect-[3/4] rounded-xl  [perspective:1200px]"
                animate={
                  tossingId === card.id
                    ? {
                        y: [-2, -36, -120, -36, 0],
                        scale: [1, 1.02, 1.06, 1.02, 1],
                        rotateZ: [0, -2, 2, -1, 0],
                      }
                    : {
                        y: 0,
                        scale: 1,
                        rotateZ: 0,
                      }
                }
                transition={
                  tossingId === card.id
                    ? {
                        duration: 0.65,
                        times: [0, 0.2, 0.6, 0.85, 1],
                        ease: "easeInOut",
                      }
                    : { duration: 0.2 }
                }
                onAnimationComplete={() => {
                  if (tossingId === card.id) setTossingId(null);
                }}
              >
                {/* Rotating inner (flip) */}
                <motion.div
                  className="absolute inset-0 [transform-style:preserve-3d]"
                  animate={{ rotateY: isHidden ? 180 : 0 }}
                  initial={{ rotateY: 180 }}
                  transition={{
                    duration: tossingId === card.id ? 0.65 : 0.5,
                    ease: "easeInOut",
                  }}
                >
                  {/* Front face (image) */}
                  <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(0deg)]">
                    <img
                      src={card.image || "/images/placeholder-spell.jpg"}
                      alt={card.name}
                      className="w-full h-full object-cover select-none"
                      draggable={false}
                      loading="lazy"
                    />
                    {card.revealed && (
                      <span
                        className={[
                          "absolute top-2 right-2 text-xs px-2 py-1 rounded-full",
                          isForbidden
                            ? "bg-red-600 text-white"
                            : "bg-green-600 text-white",
                        ].join(" ")}
                      >
                        {isForbidden ? "Forbidden" : "Safe"}
                      </span>
                    )}
                  </div>

                  {/* Back face (solid) */}
                  <div
                    className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(225,203,165,0.12),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(225,203,165,0.08),transparent_40%)] bg-hp-royal border border-hp-ivory/15 rounded-xl"
                    style={{
                      transform: "rotateY(180deg)",
                      backfaceVisibility: "hidden",
                    }}
                  >
                    <span className="text-hp-ivory/80 text-3xl font-bold select-none">
                      ?
                    </span>
                  </div>

                  {/* State ring overlay */}
                  <div
                    className={[
                      "pointer-events-none absolute inset-0 rounded-xl",
                      isForbidden
                        ? "ring-1 ring-red-500"
                        : card.revealed
                        ? "ring-1 ring-green-500"
                        : "ring-1 ring-hp-ivory/20",
                    ].join(" ")}
                  />
                </motion.div>
              </motion.div>
            </button>
          );
        })}
      </div>

      {gameOver && (
        <div className="mt-6">
          <h2 className="text-2xl">{won ? "🎉 You Win!" : "💀 Game Over!"}</h2>
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            onClick={resetGame}
          >
            Restart
          </button>
        </div>
      )}
    </main>
  );
}

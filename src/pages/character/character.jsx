import { useEffect, useState } from "react";
import CharactersSpread from "../../components/character-spread";
import { getCharacters } from "../../repository/characters";

export default function Character() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCharacters(1, 20) // page 1, 20 results
      .then((data) => {
        // Map PotterDB response into your card format
        const formatted = data.map((char) => ({
          image:
            char.attributes.image ||
            "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg", // fallback
          character: char.attributes.name,
          house: char.attributes.house || "Unknown",
        }));
        setCards(formatted);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching characters:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <main>
      <div className="relative min-h-screen bg-hp-royal pt-16 px-12 overflow-x-hidden">
        <div className="absolute inset-0 bg-[url('/images/bg.png')] bg-repeat bg-auto opacity-30 pointer-events-none"></div>

        <div className="relative z-10 flex flex-wrap gap-6 justify-center max-w-7xl mx-auto py-20 text-shadow-sm">
          <CharactersSpread cards={cards} />
        </div>
      </div>
    </main>
  );
}

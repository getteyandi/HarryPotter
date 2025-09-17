import { useEffect, useState } from "react";
import CharactersSpread from "../../components/character-spread";

export default function Character() {
  const [cards, setCards] = useState([]);

  useEffect(() => {
    // For now, mock data (later replace with fetch from API)
    const mockData = [
      {
        image:
          "https://upload.wikimedia.org/wikipedia/commons/f/f5/RWS_Tarot_08_Strength.jpg",
        character: "Harry Potter",
        house: "Gryffindor",
      },
      {
        image:
          "https://upload.wikimedia.org/wikipedia/commons/5/53/RWS_Tarot_16_Tower.jpg",
        character: "Hermione Granger",
        house: "Slytherin",
      },
      {
        image:
          "https://static.wikia.nocookie.net/harrypotter/images/8/8b/Beautification_Potion_Bottle.png",
        character: "Ronald Weasley",
        house: "Hufflepuff",
      },
      {
        image:
          "https://static.wikia.nocookie.net/harrypotter/images/4/49/BloodReplenishingPotionHM.png",
        character: "Neville Longbottom",
        house: "Ravenclaw",
      },
      {
        image:
          "https://upload.wikimedia.org/wikipedia/commons/f/f5/RWS_Tarot_08_Strength.jpg",
        character: "Harry Potter",
        house: "Gryffindor",
      },
      {
        image:
          "https://upload.wikimedia.org/wikipedia/commons/5/53/RWS_Tarot_16_Tower.jpg",
        character: "Hermione Granger",
        house: "Slytherin",
      },
      {
        image:
          "https://static.wikia.nocookie.net/harrypotter/images/8/8b/Beautification_Potion_Bottle.png",
        character: "Ronald Weasley",
        house: "Hufflepuff",
      },
      {
        image:
          "https://static.wikia.nocookie.net/harrypotter/images/4/49/BloodReplenishingPotionHM.png",
        character: "Neville Longbottom",
        house: "Ravenclaw",
      },
      {
        image:
          "https://upload.wikimedia.org/wikipedia/commons/f/f5/RWS_Tarot_08_Strength.jpg",
        character: "Harry Potter",
        house: "Gryffindor",
      },
      {
        image:
          "https://upload.wikimedia.org/wikipedia/commons/5/53/RWS_Tarot_16_Tower.jpg",
        character: "Hermione Granger",
        house: "Slytherin",
      },
      {
        image:
          "https://static.wikia.nocookie.net/harrypotter/images/8/8b/Beautification_Potion_Bottle.png",
        character: "Ronald Weasley",
        house: "Hufflepuff",
      },
      {
        image:
          "https://static.wikia.nocookie.net/harrypotter/images/4/49/BloodReplenishingPotionHM.png",
        character: "Neville Longbottom",
        house: "Ravenclaw",
      },
    ];

    setCards(mockData);
  }, []);
  return (
    <main>
      {/* <div
        className="relative min-h-screen pt-16 px-12 overflow-x-hidden 
             bg-hp-royal bg-[url('/images/bg.png')] bg-repeat bg-fixed"
      >
        <img
          src="public/images/bg.png"
          className="w-full absolute left-0 top-0 h-full opacity-30 "
        />
        <div className="flex flex-wrap gap-6 justify-center max-w-7xl mx-auto py-20 text-shadow-sm ">
          {cards.map((card, idx) => (
            <FantasyCard
              key={idx}
              image={card.image}
              character={card.character}
              type="house"
              houseName={card.house.toLowerCase()}
            />
          ))}

          <CharactersSpread cards={cards} />
        </div>
      </div> */}

      <div className="relative min-h-screen bg-hp-royal pt-16 px-12 overflow-x-hidden">
        <div className="absolute inset-0 bg-[url('/images/bg.png')] bg-repeat bg-auto opacity-30 pointer-events-none"></div>

        <div className="relative z-10 flex flex-wrap gap-6 justify-center max-w-7xl mx-auto py-20 text-shadow-sm">
          <CharactersSpread cards={cards} />
        </div>
      </div>
    </main>
  );
}

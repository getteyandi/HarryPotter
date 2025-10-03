import React, { useEffect, useRef } from "react";
import { useSprings, animated } from "@react-spring/web";
import FantasyCard from "./fantasyCard";
import { useNavigate } from "react-router-dom";

export default function CharactersSpread({
  cards,
  type = "character",
}: {
  cards: any[];
  type?: "character" | "spell" | "potion" | "house";
}) {
  const prevCount = useRef(0);

  const [springs, api] = useSprings(cards.length, (i) => ({
    from: { opacity: 0, y: -50, scale: 0.8, rotateZ: -5 },
    to: { opacity: 1, y: 0, scale: 1, rotateZ: 0 },
    delay: i * 200,
    config: { tension: 250, friction: 20 },
  }));

  const navigate = useNavigate();

  useEffect(() => {
    api.start((i) => {
      // If card was already rendered before → animate instantly
      if (i < prevCount.current) {
        return { opacity: 1, y: 0, scale: 1, rotateZ: 0, delay: 0 };
      }
      // For new cards only → stagger animation
      return {
        opacity: 1,
        y: 0,
        scale: 1,
        rotateZ: 0,
        delay: (i - prevCount.current) * 200, // stagger only new batch
      };
    });

    prevCount.current = cards.length; // update for next render
  }, [api, cards]);

  const handleCardClick = (id: string) => {
    navigate(`/journal/${type}/${id}`);
  };

  return (
    <div className={"grid grid-cols-4 gap-4 "}>
      {springs.map((style, idx) => (
        <animated.div key={cards[idx].id ?? idx} style={style}>
          <FantasyCard
            image={cards[idx].image}
            character={cards[idx].name}
            species={cards[idx].species}
            gender={cards[idx].gender}
            type={type}
            houseName={cards[idx].house?.toLowerCase()}
            className="cursor-pointer"
            onClick={() => {
              console.log("Card clicked:", cards[idx].id); // will log only when clicked
              handleCardClick(cards[idx].id);
            }}
          />
        </animated.div>
      ))}
    </div>
  );
}

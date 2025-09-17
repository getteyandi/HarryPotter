import React, { useEffect } from "react";
import { useSprings, animated } from "@react-spring/web";
import FantasyCard from "./fantasyCard";
import { useNavigate } from "react-router-dom";

// Accepts cards dynamically (e.g. from API or parent component)
export default function CharactersSpread({ cards }: { cards: any[] }) {
  const [springs, api] = useSprings(cards.length, (i) => ({
    from: { opacity: 0, y: -50, scale: 0.8, rotateZ: -5 },
    to: { opacity: 1, y: 0, scale: 1, rotateZ: 0 },
    delay: i * 200,
    config: { tension: 250, friction: 20 },
  }));

  const navigate = useNavigate();

  useEffect(() => {
    api.start((i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      rotateZ: 0,
      delay: i * 200,
    }));
  }, [api, cards]);

  const handleCardClick = (id: string) => {
    navigate(`/char-info/${id}`);
  };

  return (
    <>
      {springs.map((style, idx) => (
        <animated.div key={idx} style={style}>
          <FantasyCard
            image={cards[idx].image}
            character={cards[idx].character}
            type={cards[idx].type}
            houseName={cards[idx].house?.toLowerCase()} // dynamic
            className="cursor-pointer"
            onClick={() => handleCardClick(cards[idx].id)}
          />
        </animated.div>
      ))}
    </>
  );
}

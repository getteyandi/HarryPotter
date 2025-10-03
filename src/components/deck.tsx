// ...existing code...
import React, { useState } from "react";
import { useSprings, animated, to as interpolate } from "@react-spring/web";
import { useDrag } from "react-use-gesture";
import FantasyCard from "./fantasyCard";

// Use static cards as fallback only
const defaultCards: DeckCard[] = [
  {
    image:
      "https://upload.wikimedia.org/wikipedia/commons/f/f5/RWS_Tarot_08_Strength.jpg",
    character: "Strength Wizard",
    type: "spell",
    firstDetail: "Courage",
    secondDetail: "Power",
  },
  {
    image:
      "https://upload.wikimedia.org/wikipedia/commons/5/53/RWS_Tarot_16_Tower.jpg",
    character: "Tower Sorcerer",
    type: "spell",
    firstDetail: "Destruction",
    secondDetail: "Change",
  },
  {
    image:
      "https://static.wikia.nocookie.net/harrypotter/images/8/8b/Beautification_Potion_Bottle.png",
    character: "Beautification Potion",
    type: "potion",
    firstDetail: "Appearance",
    secondDetail: "Charm",
  },
  {
    image:
      "https://static.wikia.nocookie.net/harrypotter/images/4/49/BloodReplenishingPotionHM.png",
    character: "Blood-Replenishing Potion",
    type: "potion",
    firstDetail: "Health",
    secondDetail: "Recovery",
  },
];

type CardType = "potion" | "spell" | "house" | "character";

type DeckCard = {
  id?: string | number;
  image: string;
  // Accept multiple aliases; we'll normalize to FantasyCard props
  mainInfo?: string;
  character?: string;
  title?: string;
  name?: string;
  firstDetail?: string;
  secondDetail?: string;
  type?: CardType | string;
};

type DeckProps = {
  cards?: DeckCard[];
  onCardClick?: (card: DeckCard, index: number) => void;
};

const to = (i: number) => ({
  x: 0,
  y: i * -4,
  scale: 1,
  rot: -10 + Math.random() * 20,
  delay: i * 100,
});
const from = (_i: number) => ({ x: 0, rot: 0, scale: 1.5, y: -1000 });
const trans = (r: number, s: number) =>
  `perspective(1500px) rotateX(30deg) rotateY(${
    r / 10
  }deg) rotateZ(${r}deg) scale(${s})`;

export default function Deck({ cards, onCardClick }: DeckProps) {
  const cardsToRender = cards && cards.length ? cards : defaultCards;

  const [gone] = useState(() => new Set<number>());
  const [props, api] = useSprings(cardsToRender.length, (i) => ({
    ...to(i),
    from: from(i),
  }));

  const bind = useDrag(
    ({ args: [index], down, movement: [mx], direction: [xDir], velocity }) => {
      const trigger = velocity > 0.2;
      const dir = xDir < 0 ? -1 : 1;
      if (!down && trigger) gone.add(index);

      api.start((i) => {
        if (index !== i) return;
        const isGone = gone.has(index);
        const x = isGone ? (200 + window.innerWidth) * dir : down ? mx : 0;
        const rot = mx / 100 + (isGone ? dir * 10 * velocity : 0);
        const scale = down ? 1.1 : 1;
        return {
          x,
          rot,
          scale,
          delay: undefined,
          config: { friction: 50, tension: down ? 800 : isGone ? 200 : 500 },
        };
      });

      if (!down && gone.size === cardsToRender.length)
        setTimeout(() => {
          gone.clear();
          api.start((i) => to(i));
        }, 600);
    }
  );

  return (
    <div className="relative w-full flex justify-center items-center">
      {props.map(({ x, y, rot, scale }, i) => {
        const card = cardsToRender[i];
        const mainInfo =
          card.mainInfo ??
          card.title ??
          card.name ??
          card.character ??
          "Unknown";
        const firstDetail = card.firstDetail;
        const secondDetail = card.secondDetail;
        const type = (card.type as CardType) ?? "spell";

        return (
          <animated.div
            className="absolute right-0 top-10"
            key={card.id ?? i}
            style={{ x, y }}
          >
            <animated.div
              {...bind(i)}
              style={{
                transform: interpolate([rot, scale], trans),
                userSelect: "none",
                cursor: "grab",
              }}
            >
              <FantasyCard
                image={card.image}
                mainInfo={mainInfo}
                firstDetail={firstDetail}
                secondDetail={secondDetail}
                type={type as any}
              />
            </animated.div>
          </animated.div>
        );
      })}
    </div>
  );
}

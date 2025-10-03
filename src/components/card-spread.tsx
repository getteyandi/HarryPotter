import React, { useEffect, useRef } from "react";
import { useSprings, animated } from "@react-spring/web";
import FantasyCard from "./fantasyCard";
import { useNavigate } from "react-router-dom";
import SkeletonCard from "./skeleton-card";

// Generic card type (works for characters, spells, potions, etc.)
type Card = Record<string, any>;

type DisplaySelector =
  | string // key on card, e.g. "name"
  | ((card: Card) => string | undefined);

interface DisplayConfig {
  main?: DisplaySelector;
  first?: DisplaySelector;
  second?: DisplaySelector;
  type?:
    | "character"
    | "spell"
    | "potion"
    | ((card: Card) => string | undefined);
  houseField?: string; // defaults to "house" if omitted
}

interface Props {
  cards: Card[];
  loading?: boolean;
  columns?: number; // for filler skeletons
  initialSkeletons?: number;
  display?: DisplayConfig; // NEW: control what shows on the card
  onCardClick?: (card: Card) => void; // NEW: override click behavior
}

function toStr(v: any): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
}

function pickFirst(card: Card, keys: string[]): string | undefined {
  for (const k of keys) {
    const val = toStr(card[k]);
    if (val) return val;
  }
  return undefined;
}

function resolveSelector(
  card: Card,
  sel?: DisplaySelector
): string | undefined {
  if (!sel) return undefined;
  if (typeof sel === "function") return toStr(sel(card));
  return toStr(card[sel]);
}

export default function CardSpread({
  cards,
  loading = false,
  columns = 4,
  initialSkeletons = 8,
  display,
  onCardClick,
}: Props) {
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
      if (i < prevCount.current) {
        return { opacity: 1, y: 0, scale: 1, rotateZ: 0, delay: 0 };
      }
      return {
        opacity: 1,
        y: 0,
        scale: 1,
        rotateZ: 0,
        delay: (i - prevCount.current) * 200,
      };
    });
    prevCount.current = cards.length;
  }, [api, cards]);

  const handleCardClick = (card: Card) => {
    if (onCardClick) return onCardClick(card);
    // Default route keeps existing behavior for characters
    navigate(`/char-info/${card.id}`);
  };

  return (
    <div className="flex flex-wrap justify-center gap-6">
      {/* Initial skeletons when there are no cards yet */}
      {cards.length === 0 && loading
        ? Array.from({ length: initialSkeletons }).map((_, i) => (
            <SkeletonCard key={`sk-${i}`} />
          ))
        : null}

      {/* Render actual cards */}
      {springs.map((style, idx) => {
        const card = cards[idx];

        // Resolve display fields with fallbacks
        const mainInfo =
          resolveSelector(card, display?.main) || pickFirst(card, ["name"]);
        const firstDetail =
          resolveSelector(card, display?.first) ||
          pickFirst(card, ["species", "incantation"]);
        const secondDetail =
          resolveSelector(card, display?.second) ||
          pickFirst(card, ["gender", "category"]);

        // Resolve type
        const resolvedTypeRaw =
          typeof display?.type === "function"
            ? display?.type(card)
            : display?.type;
        const resolvedType =
          (resolvedTypeRaw as string) ||
          (card.species || card.gender || card.house
            ? "character"
            : card.incantation || card.category
            ? "spell"
            : "house");

        // House badge for characters only
        let houseName:
          | "gryffindor"
          | "slytherin"
          | "ravenclaw"
          | "hufflepuff"
          | "unknown"
          | undefined;
        if (resolvedType === "character") {
          const houseKey = display?.houseField || "house";
          const h = toStr(card[houseKey]);
          const allowed = [
            "gryffindor",
            "slytherin",
            "ravenclaw",
            "hufflepuff",
          ];
          if (h) {
            const low = h.toLowerCase();
            houseName = (
              allowed.includes(low) ? low : "unknown"
            ) as typeof houseName;
          }
        }

        return (
          <animated.div key={card.id ?? idx} style={style}>
            <FantasyCard
              image={card.image}
              mainInfo={mainInfo}
              firstDetail={firstDetail}
              secondDetail={secondDetail}
              type={resolvedType as any}
              houseName={houseName}
              className="cursor-pointer"
              onClick={() => handleCardClick(card)}
            />
          </animated.div>
        );
      })}
    </div>
  );
}

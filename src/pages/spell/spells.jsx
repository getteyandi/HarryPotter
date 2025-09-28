import { useEffect, useState, useRef } from "react";
import { getSpells } from "../../repository/spells";
import CharactersSpread from "../../components/character-spread";

/**
 * We reuse CharactersSpread + FantasyCard by mapping spell fields
 * to the card shape it expects:
 *   name      -> name
 *   image     -> image
 *   category  -> species (label line 1)
 *   incantation -> gender (label line 2) (semantic reuse)
 *   house always "unknown"
 */
export default function SpellsPage() {
  const [cards, setCards] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    loadSpells(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function loadSpells(pageNum) {
    try {
      setLoading(true);
      const data = await getSpells(pageNum, 20, [
        "name",
        "image",
        "incantation",
        "category",
        "effect",
      ]);

      if (data.length === 0) {
        setHasMore(false);
        return;
      }

      setCards((prev) => {
        const existing = new Set(prev.map((c) => c.id));
        const mapped = data
          .filter((s) => !existing.has(s.id))
          .map((s) => ({
            id: s.id,
            name: s.name,
            image: s.image,
            species: s.category || "Unknown Category",
            gender: s.incantation || "—",
            house: "unknown",
          }));
        return [...prev, ...mapped];
      });
    } catch (e) {
      console.error("Error fetching spells:", e);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || loading) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: "200px" }
    );

    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [loading, hasMore]);

  if (cards.length === 0 && !loading) {
    return (
      <main className="pt-24 px-12 text-center text-hp-ivory/70">
        No spells found.
      </main>
    );
  }

  return (
    <main>
      <div className="relative min-h-screen bg-hp-royal pt-20 px-12 overflow-x-hidden">
        <div className="absolute inset-0 bg-[url('/images/bg.png')] bg-repeat bg-auto opacity-25 pointer-events-none" />
        <div className="relative z-10 flex flex-wrap gap-6 justify-center max-w-7xl mx-auto py-16">
          <CharactersSpread cards={cards} />
        </div>
        <div ref={loadMoreRef} className="h-10" />
        {loading && (
          <p className="text-center text-hp-ivory/60 py-6">Loading more...</p>
        )}
        {!hasMore && (
          <p className="text-center text-hp-ivory/40 py-6">No more spells.</p>
        )}
      </div>
    </main>
  );
}

import { useEffect, useState, useRef } from "react";
import CharactersSpread from "../../components/character-spread";
import { getCharacters } from "../../repository/characters";

export default function Character() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    loadCharacters(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function loadCharacters(pageNum) {
    try {
      setLoading(true);
      const data = await getCharacters(pageNum, 20, [
        "name",
        "house",
        "image",
        "species",
        "gender",
      ]);

      if (data.length === 0) {
        setHasMore(false);
      } else {
        setCards((prev) => {
          const seen = new Set(prev.map((c) => c.id));
          const unique = data.filter((c) => !seen.has(c.id));
          return [...prev, ...unique];
        });
      }
    } catch (err) {
      console.error("Error fetching characters:", err);
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
          setPage((prev) => prev + 1);
        }
      },
      { rootMargin: "200px" } // start loading a bit before hitting bottom
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [loading, hasMore]);

  if (cards.length === 0 && !loading) {
    return <p className="text-center text-gray-300">No characters found.</p>;
  }

  return (
    <main>
      <div className="relative min-h-screen bg-hp-royal pt-16 px-12 overflow-x-hidden">
        <div className="absolute inset-0 bg-[url('/images/bg.png')] bg-repeat bg-auto opacity-30 pointer-events-none"></div>

        <div className="relative z-10 flex flex-wrap gap-6 justify-center max-w-7xl mx-auto py-20 text-shadow-sm">
          <CharactersSpread cards={cards} />
        </div>

        {/* Invisible trigger for infinite scroll */}
        <div ref={loadMoreRef} className="h-10" />

        {loading && (
          <p className="text-center text-gray-300 py-6">Loading more...</p>
        )}
        {!hasMore && (
          <p className="text-center text-gray-300 py-6">No more characters.</p>
        )}
      </div>
    </main>
  );
}

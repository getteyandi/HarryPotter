import { useEffect, useRef, useState } from "react";
import { getPotions, getPotionDifficulties } from "../../repository/potions";
import CardSpread from "../../components/card-spread";
import FilterHUD from "../../components/filter-hud";
import MagicLoader from "../../components/magic-loader";
import BackToTop from "../../components/BackToTop";

export default function PotionsPage() {
  const [cards, setCards] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const [query, setQuery] = useState({
    search: "",
    sort: "name",
    difficulty: "",
    effect: "",
    ingredients: "",
  });

  const [difficulties, setDifficulties] = useState([]);

  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);
  const queryRef = useRef(query); // stable across pagination

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  // Load difficulties dynamically (cached)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const opts = await getPotionDifficulties({
          maxPages: 8,
          pageSize: 100,
        });
        if (alive) setDifficulties(opts);
      } catch (e) {
        console.warn("Failed to load potion difficulties, using fallback.", e);
        if (alive) setDifficulties(["Beginner", "Intermediate", "Advanced"]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    loadPotions(page, queryRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function loadPotions(pageNum, q) {
    try {
      setLoading(true);

      const repoQuery = {
        search: q.search,
        sort: q.sort, // "name" | "-name"
        filters: {
          difficulty: { value: q.difficulty, operator: "eq" },
          effect: { value: q.effect, operator: "cont" },
          ingredients: { value: q.ingredients, operator: "cont" },
        },
      };

      const data = await getPotions(
        pageNum,
        20,
        ["name", "image", "difficulty", "effect", "ingredients"],
        repoQuery
      );

      if (data.length === 0) {
        setHasMore(false);
        return;
      }

      setCards((prev) => {
        const seen = new Set(prev.map((c) => c.id));
        const unique = data.filter((p) => !seen.has(p.id));
        return [...prev, ...unique];
      });
    } catch (e) {
      console.error("Error fetching potions:", e);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  // On query change: reset, scroll to top, and fetch first page
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCards([]);
    setPage(1);
    setHasMore(true);
    loadPotions(1, query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    query.search,
    query.sort,
    query.difficulty,
    query.effect,
    query.ingredients,
  ]);

  // Infinite scroll
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

  // HUD config for Potions
  const hudConfig = {
    search: { placeholder: "Search potions by name..." },
    filters: [
      {
        key: "difficulty",
        label: "Difficulty",
        type: "select",
        options: difficulties.length
          ? difficulties
          : ["Beginner", "Intermediate", "Advanced"],
        operator: "eq",
      },
      {
        key: "effect",
        label: "Effect",
        type: "text",
        operator: "cont",
      },
      {
        key: "ingredients",
        label: "Ingredients",
        type: "text",
        operator: "cont",
      },
    ],
    sorts: [
      { label: "Name A→Z", value: "name" },
      { label: "Name Z→A", value: "-name" },
    ],
  };

  return (
    <main>
      <div className="relative min-h-screen bg-hp-royal pt-20 overflow-x-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[url('/images/bg.png')] bg-repeat bg-auto opacity-25 pointer-events-none" />

        {/* Sticky filter HUD */}
        <FilterHUD
          config={hudConfig}
          initial={{
            search: "",
            sort: "name",
            difficulty: "",
            effect: "",
            ingredients: "",
          }}
          onQueryChange={(q) => setQuery(q)}
          className="pt-4 z-20"
        />

        {/* Cards */}
        <div className="relative z-10 flex flex-wrap gap-6 justify-center max-w-7xl mx-auto pb-10 pt-4">
          {cards.length === 0 && !loading ? (
            <div className="text-center text-hp-ivory/70 py-16">
              <p className="font-semibold">
                No potions match your search/filters.
              </p>
              <p className="text-sm opacity-75 mt-1">
                Try clearing filters or adjusting your query.
              </p>
            </div>
          ) : (
            <CardSpread
              cards={cards}
              loading={loading}
              display={{
                main: (c) => c.name,
                first: (c) => c.difficulty || "—",
                second: (c) => c.effect || "—",
                type: "potion",
              }}
              onCardClick={(c) =>
                window.location.assign(`/potion-info/${c.id}`)
              }
            />
          )}
        </div>

        {/* Infinite scroll trigger */}
        {hasMore && <div ref={loadMoreRef} className="h-10" />}

        {loading && cards.length > 0 && (
          <MagicLoader label="Brewing more potions..." />
        )}
        {!hasMore && cards.length > 0 && (
          <p className="text-center text-hp-ivory/40 py-6">No more potions.</p>
        )}

        <BackToTop />
      </div>
    </main>
  );
}

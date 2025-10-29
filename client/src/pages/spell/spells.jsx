import { useEffect, useState, useRef } from "react";
import { getSpellCategories, getSpells } from "../../repository/spells";
import CardSpread from "../../components/card-spread";
import MagicLoader from "../../components/magic-loader";
import FilterHUD from "../../components/filter-hud";
import BackToTop from "../../components/BackToTop";

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
  const [query, setQuery] = useState({
    search: "",
    sort: "name",
    category: "",
  });
  const [categories, setCategories] = useState([]);

  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);
  const queryRef = useRef(query); // keep stable across pagination

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  useEffect(() => {
    loadSpells(page, queryRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Load category options dynamically (cached)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const opts = await getSpellCategories({ maxPages: 8, pageSize: 100 });
        if (alive) setCategories(opts);
      } catch (e) {
        console.warn("Failed to load spell categories, using fallback.", e);
        if (alive)
          setCategories(["Charm", "Transfiguration", "Conjuration", "Curse"]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function loadSpells(pageNum, q) {
    try {
      setLoading(true);

      // Translate local query to repository filters
      const repoQuery = {
        search: q.search,
        sort: q.sort, // "name" | "-name"
        filters: {
          category: { value: q.category, operator: "eq" },
        },
      };

      const data = await getSpells(
        pageNum,
        20,
        ["name", "image", "category", "incantation"],
        repoQuery
      );

      if (data.length === 0) {
        setHasMore(false);
        return;
      }

      setCards((prev) => {
        const seen = new Set(prev.map((c) => c.id));
        const unique = data.filter((c) => !seen.has(c.id));
        return [...prev, ...unique];
      });
    } catch (err) {
      console.error("Error fetching spells:", err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  // Reset list when query changes
  useEffect(() => {
    // Always scroll to top when filters/search/sort change
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCards([]);
    setPage(1);
    setHasMore(true);
    // Load the first page immediately for better UX
    loadSpells(1, query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.search, query.sort, query.category]);

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
      { rootMargin: "200px" }
    );

    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [loading, hasMore]);

  // Reusable HUD config for Characters
  const hudConfig = {
    search: { placeholder: "Search by name..." },
    filters: [
      {
        key: "category",
        label: "Category",
        type: "select",
        options: categories.length
          ? categories
          : ["Charm", "Transfiguration", "Conjuration", "Curse"],
        operator: "eq",
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
            category: "",
          }}
          onQueryChange={(q) => setQuery(q)}
          className="pt-4 z-20"
        />

        {/* Cards container */}
        <div className="relative z-10 flex flex-wrap gap-6 justify-center max-w-7xl mx-auto pb-10 pt-4">
          {cards.length === 0 && !loading ? (
            <div className="text-center text-hp-ivory/70 py-16">
              <p className="font-semibold">
                No spells match your search/filters.
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
                // show effect first; fall back to category, then incantation
                first: (c) => c.effect,
                // then show category; fall back to incantation
                second: (c) => c.category,
                type: "spell",
              }}
              onCardClick={(c) => navigate(`/spell-info/${c.id}`)}
            />
          )}
        </div>

        {/* Trigger for infinite scroll only when there’s more to load */}
        {hasMore && <div ref={loadMoreRef} className="h-10" />}

        {loading && cards.length > 0 && (
          <MagicLoader label="Summoning more spells..." />
        )}
        {!hasMore && cards.length > 0 && (
          <p className="text-center text-hp-ivory/40 py-6">No more spells.</p>
        )}

        <BackToTop />
      </div>
    </main>
  );
}

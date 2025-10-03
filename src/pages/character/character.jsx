import { useEffect, useState, useRef } from "react";
import { getCharacters } from "../../repository/characters";
import CardSpread from "../../components/card-spread";
import FilterHUD from "../../components/filter-hud";
import MagicLoader from "../../components/magic-loader";
import BackToTop from "../../components/BackToTop";

export default function Character() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [query, setQuery] = useState({
    search: "",
    sort: "name",
    house: "",
    gender: "",
    species: "",
  });

  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);
  const queryRef = useRef(query); // keep stable across pagination

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  useEffect(() => {
    loadCharacters(page, queryRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function loadCharacters(pageNum, q) {
    try {
      setLoading(true);

      // Translate local query to repository filters
      const repoQuery = {
        search: q.search,
        sort: q.sort, // "name" | "-name"
        filters: {
          // eq (exact) for house and gender, cont (contains) for species
          house: { value: q.house, operator: "eq" },
          gender: { value: q.gender, operator: "eq" },
          species: { value: q.species, operator: "cont" },
        },
      };

      const data = await getCharacters(
        pageNum,
        20,
        ["name", "house", "image", "species", "gender"],
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
      console.error("Error fetching characters:", err);
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
    loadCharacters(1, query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.search, query.sort, query.house, query.gender, query.species]);

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
        key: "house",
        label: "House",
        type: "select",
        options: ["Gryffindor", "Hufflepuff", "Ravenclaw", "Slytherin"],
        operator: "eq",
      },
      {
        key: "gender",
        label: "Gender",
        type: "select",
        options: ["Male", "Female"],
        operator: "eq",
      },
      {
        key: "species",
        label: "Species",
        type: "text", // free text; uses "cont" operator
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
            house: "",
            gender: "",
            species: "",
          }}
          onQueryChange={(q) => setQuery(q)}
          className="pt-4 z-20"
        />

        {/* Cards container */}
        <div className="relative z-10 flex flex-wrap gap-6 justify-center max-w-7xl mx-auto pb-10 pt-4">
          {cards.length === 0 && !loading ? (
            <div className="text-center text-hp-ivory/70 py-16">
              <p className="font-semibold">
                No characters match your search/filters.
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
                main: (c) => c.name || c.incantation,
                first: "specie",
                second: (c) => c.gender,
                type: "character",
              }}
              onCardClick={(c) => navigate(`/character-info/${c.id}`)}
            />
          )}
        </div>

        {/* Trigger for infinite scroll only when there’s more to load */}
        {hasMore && <div ref={loadMoreRef} className="h-10" />}

        {loading && cards.length > 0 && (
          <MagicLoader label="Summoning more wizards..." />
        )}
        {!hasMore && cards.length > 0 && (
          <p className="text-center text-hp-ivory/40 py-6">
            No more characters.
          </p>
        )}

        <BackToTop />
      </div>
    </main>
  );
}

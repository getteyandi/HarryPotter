import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom"; // ✅ added
import { getBooks, getMovies } from "../../repository/booksAndMovies";
import { motion } from "framer-motion";

export default function BooksAndMovies() {
  const navigate = useNavigate(); // ✅ added
  const [mediaType, setMediaType] = useState("books"); // 'books' | 'movies'

  const [books, setBooks] = useState([]);
  const [movies, setMovies] = useState([]);

  const [bookPage, setBookPage] = useState(1);
  const [moviePage, setMoviePage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [hasMoreBooks, setHasMoreBooks] = useState(true);
  const [hasMoreMovies, setHasMoreMovies] = useState(true);

  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  const currentList = mediaType === "books" ? books : movies;
  const hasMore = mediaType === "books" ? hasMoreBooks : hasMoreMovies;

  // Lightweight skeleton card
  const SkeletonCard = () => (
    <div className="relative rounded-xl overflow-hidden border border-hp-ivory/10 bg-hp-royal/20">
      <div className="aspect-[3/4] w-full bg-hp-royal/40 animate-pulse" />
      <div className="p-4 space-y-2">
        <div className="h-3.5 w-3/4 bg-white/10 rounded animate-pulse" />
        <div className="h-3 w-1/3 bg-white/10 rounded animate-pulse" />
      </div>
    </div>
  );

  const loadBooks = useCallback(async (pageNum) => {
    setLoading(true);
    try {
      const data = await getBooks(pageNum, 12, [
        "title",
        "release_date",
        "cover",
      ]);
      if (data.length === 0) {
        setHasMoreBooks(false);
      } else {
        setBooks((prev) => {
          const seen = new Set(prev.map((b) => b.id));
          const unique = data.filter((b) => !seen.has(b.id));
          return [...prev, ...unique];
        });
      }
    } catch (e) {
      console.error("Books fetch failed", e);
      setHasMoreBooks(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMovies = useCallback(async (pageNum) => {
    setLoading(true);
    try {
      const data = await getMovies(pageNum, 12, [
        "title",
        "release_date",
        "running_time",
        "poster",
        "rating",
      ]);
      if (data.length === 0) {
        setHasMoreMovies(false);
      } else {
        setMovies((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const unique = data.filter((m) => !seen.has(m.id));
          return [...prev, ...unique];
        });
      }
    } catch (e) {
      console.error("Movies fetch failed", e);
      setHasMoreMovies(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load per type
  useEffect(() => {
    if (mediaType === "books" && books.length === 0) loadBooks(bookPage);
    if (mediaType === "movies" && movies.length === 0) loadMovies(moviePage);
  }, [
    mediaType,
    books.length,
    movies.length,
    loadBooks,
    loadMovies,
    bookPage,
    moviePage,
  ]);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || loading) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (mediaType === "books") {
            setBookPage((p) => p + 1);
          } else {
            setMoviePage((p) => p + 1);
          }
        }
      },
      { rootMargin: "200px" }
    );

    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [loading, hasMore, mediaType]);

  // Trigger fetch on page increment
  useEffect(() => {
    if (mediaType === "books") {
      if (bookPage > 1) loadBooks(bookPage);
    } else {
      if (moviePage > 1) loadMovies(moviePage);
    }
  }, [bookPage, moviePage, mediaType, loadBooks, loadMovies]);

  function switchType(type) {
    setMediaType(type);
  }

  // Helper: render grid content (items or skeletons)
  const renderGrid = () => {
    const showInitialSkeletons = loading && currentList.length === 0;
    if (showInitialSkeletons) {
      return Array.from({ length: 12 }).map((_, i) => (
        <SkeletonCard key={`sk-${i}`} />
      ));
    }
    return currentList.map((item) => {
      const image = item.cover || item.poster;
      const year = item.release_date
        ? new Date(item.release_date).getFullYear()
        : null;
      return (
        <div
          key={item.id}
          className="group relative rounded-xl overflow-hidden border border-hp-ivory/15 bg-hp-royal/30 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all"
        >
          <div className="aspect-[3/4] w-full overflow-hidden bg-hp-royal/50">
            {image ? (
              <img
                src={image}
                alt={item.title}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-hp-ivory/60">
                No Image
              </div>
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent opacity-80" />
          </div>
          <div className="p-4 flex flex-col gap-1">
            <h3
              className="text-hp-ivory font-semibold text-sm line-clamp-2"
              title={item.title}
            >
              {item.title}
            </h3>
            {year && <p className="text-xs text-hp-ivory/60">{year}</p>}
          </div>
        </div>
      );
    });
  };

  return (
    <main>
      <div className="relative min-h-screen bg-hp-royal pt-28 px-12 overflow-x-hidden">
        <div className="absolute inset-0 bg-[url('/images/bg.png')] bg-repeat bg-auto opacity-20 pointer-events-none" />

        {/* Segmented Tabs */}
        <div className="relative z-10 flex justify-center mb-10">
          <div
            role="tablist"
            aria-label="Select media type"
            className="relative inline-flex items-center p-1 rounded-full bg-black/25 border border-hp-ivory/20"
          >
            <motion.span
              className="absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-hp-ivory shadow-[0_2px_14px_rgba(223,170,56,0.35)]"
              initial={false}
              animate={{ x: mediaType === "books" ? 0 : "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              aria-hidden
            />
            <button
              role="tab"
              aria-selected={mediaType === "books"}
              onClick={() => switchType("books")}
              className={[
                "relative z-10 cursor-pointer px-6 py-2 rounded-full font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70",
                mediaType === "books" ? "text-hp-royal" : "text-hp-ivory/80",
              ].join(" ")}
            >
              Books
            </button>
            <button
              role="tab"
              aria-selected={mediaType === "movies"}
              onClick={() => switchType("movies")}
              className={[
                "relative z-10 cursor-pointer px-6 py-2 rounded-full font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70",
                mediaType === "movies" ? "text-hp-royal" : "text-hp-ivory/80",
              ].join(" ")}
            >
              Movies
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="relative z-10 grid gap-6 md:grid-cols-3 lg:grid-cols-4 max-w-7xl mx-auto pb-20">
          {renderGrid()}
          {loading &&
            currentList.length > 0 &&
            Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={`more-sk-${i}`} />
            ))}
        </div>

        {/* Loader trigger */}
        <div ref={loadMoreRef} className="h-10" />

        {/* Status */}
        <div className="relative z-10 text-center pb-16">
          {loading && currentList.length === 0 && (
            <p className="text-hp-ivory/60">Loading {mediaType}…</p>
          )}
          {!loading && !hasMore && (
            <p className="text-hp-ivory/40">No more {mediaType}.</p>
          )}
          {!loading && currentList.length === 0 && (
            <p className="text-hp-ivory/60">No {mediaType} found.</p>
          )}
        </div>
      </div>
    </main>
  );
}

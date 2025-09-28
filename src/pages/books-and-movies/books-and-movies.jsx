import { useEffect, useState, useRef, useCallback } from "react";
import { getBooks, getMovies } from "../../repository/booksAndMovies";

export default function BooksAndMovies() {
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

  return (
    <main>
      <div className="relative min-h-screen bg-hp-royal pt-28 px-12 overflow-x-hidden">
        <div className="absolute inset-0 bg-[url('/images/bg.png')] bg-repeat bg-auto opacity-20 pointer-events-none" />

        {/* Toggle */}
        <div className="relative z-10 flex justify-center gap-4 mb-10">
          <button
            onClick={() => switchType("books")}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              mediaType === "books"
                ? "bg-hp-ivory text-hp-royal"
                : "bg-hp-royal/40 border border-hp-ivory/20 text-hp-ivory"
            }`}
          >
            Books
          </button>
          <button
            onClick={() => switchType("movies")}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              mediaType === "movies"
                ? "bg-hp-ivory text-hp-royal"
                : "bg-hp-royal/40 border border-hp-ivory/20 text-hp-ivory"
            }`}
          >
            Movies
          </button>
        </div>

        {/* Grid */}
        <div className="relative z-10 grid gap-6 md:grid-cols-3 lg:grid-cols-4 max-w-7xl mx-auto pb-20">
          {currentList.map((item) => {
            const image = item.cover || item.poster;
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
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-hp-ivory/60">
                      No Image
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-1">
                  <h3 className="text-hp-ivory font-semibold text-sm line-clamp-2">
                    {item.title}
                  </h3>
                  {item.release_date && (
                    <p className="text-xs text-hp-ivory/60">
                      {new Date(item.release_date).getFullYear()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Loader trigger */}
        <div ref={loadMoreRef} className="h-10" />

        {/* Status */}
        <div className="relative z-10 text-center pb-16">
          {loading && (
            <p className="text-hp-ivory/60 animate-pulse">Loading more…</p>
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

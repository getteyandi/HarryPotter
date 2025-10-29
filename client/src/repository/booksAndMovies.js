import { getCache, setCache } from "./cache";

const API_BASE = "https://api.potterdb.com/v1";

/* ---------------- Cleaning (light, optional) ---------------- */
function cleanBooks(items) {
  return items.filter((b) => {
    const title = b.attributes.title?.trim() || "";
    if (!title) return false;
    // if (title.length > 120) return false;
    // Require a cover image if present (optional: relax if you want all)
    // if (!b.attributes.cover) return false;
    return true;
  });
}

function cleanMovies(items) {
  return items.filter((m) => {
    const title = m.attributes.title?.trim() || "";
    if (!title) return false;
    if (title.length > 120) return false;
    if (!m.attributes.poster) return false;
    return true;
  });
}

/* ---------------- Formatting Helpers ---------------- */
function formatItems(items, fields = []) {
  return items.map((entry) => {
    const attrs = entry.attributes || {};
    const formatted = {};
    fields.forEach((f) => {
      formatted[f] = attrs[f] ?? null;
    });
    return { id: entry.id, ...formatted };
  });
}

/* ---------------- Generic Fetch ---------------- */
async function fetchPage(resource, page = 1, size = 20) {
  const url = `${API_BASE}/${resource}?page[number]=${page}&page[size]=${size}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${resource} (page ${page})`);
  return res.json();
}

/* ---------------- Books ---------------- */
export async function getBooks(
  page = 1,
  size = 20,
  fields = [
    "slug",
    "title",
    "author",
    "dedication",
    "release_date",
    "pages",
    "summary",
    "cover",
  ]
) {
  const cacheKey = `books-${page}-${size}-fields-${fields.join(",")}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const data = await fetchPage("books", page, size);
  const cleaned = cleanBooks(data.data);
  const formatted = formatItems(cleaned, fields);
  setCache(cacheKey, formatted);
  return formatted;
}

export async function getBookById(
  id,
  fields = [
    "title",
    "author",
    "dedication",
    "release_date",
    "pages",
    "summary",
    "cover",
  ]
) {
  const cacheKey = `book-${id}-fields-${fields.join(",")}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${API_BASE}/books/${id}`);
  if (!res.ok) throw new Error("Failed to fetch book");
  const data = await res.json();
  const formatted = formatItems([data.data], fields)[0];
  setCache(cacheKey, formatted);
  return formatted;
}

/* ---------------- Movies ---------------- */
export async function getMovies(
  page = 1,
  size = 20,
  fields = [
    "title",
    "release_date",
    "running_time",
    "budget",
    "box_office",
    "rating",
    "poster",
    "cinematographers",
    "directors",
    "distributors",
    "editors",
    "music_composers",
    "producers",
    "screenwriters",
    "summary",
    "trailer",
  ]
) {
  const cacheKey = `movies-${page}-${size}-fields-${fields.join(",")}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const data = await fetchPage("movies", page, size);
  const cleaned = cleanMovies(data.data);
  const formatted = formatItems(cleaned, fields);
  setCache(cacheKey, formatted);
  return formatted;
}

export async function getMovieById(
  id,
  fields = [
    "title",
    "release_date",
    "running_time",
    "budget",
    "box_office",
    "rating",
    "poster",
    "cinematographers",
    "directors",
    "distributors",
    "editors",
    "music_composers",
    "producers",
    "screenwriters",
    "summary",
    "trailer",
  ]
) {
  const cacheKey = `movie-${id}-fields-${fields.join(",")}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${API_BASE}/movies/${id}`);
  if (!res.ok) throw new Error("Failed to fetch movie");
  const data = await res.json();
  const formatted = formatItems([data.data], fields)[0];
  setCache(cacheKey, formatted);
  return formatted;
}

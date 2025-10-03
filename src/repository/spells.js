import { getCache, setCache } from "./cache";

const API_BASE = "https://api.potterdb.com/v1";

/**
 * Clean raw spells (light filtering similar in spirit to characters).
 */
function cleanSpells(spells) {
  return spells.filter((spell) => {
    const name = spell.attributes.name?.trim() || "";
    if (!name) return false;
    if (name.length > 50) return false;
    if (!spell.attributes.image) return false; // require image to keep grid consistent
    return true;
  });
}

function formatSpells(
  spells,
  fields = ["name", "image", "incantation", "category"]
) {
  return spells.map((spell) => {
    const attrs = spell.attributes;
    const formatted = {};
    fields.forEach((field) => {
      formatted[field] = attrs[field] ?? null;
    });
    return {
      id: spell.id,
      ...formatted,
    };
  });
}

/**
 * Fetch one page of spells (cleaned + formatted).
 */
// export async function getSpells(page = 1, size = 20, fields) {
//   const cacheKey = `spells-page-${page}-size-${size}-fields-${fields?.join(
//     ","
//   )}`;
//   const cached = getCache(cacheKey);
//   if (cached) return cached;

//   const res = await fetch(
//     `${API_BASE}/spells?page[number]=${page}&page[size]=${size}`
//   );
//   if (!res.ok) throw new Error("Failed to fetch spells");

//   const data = await res.json();
//   const cleaned = cleanSpells(data.data);
//   const formatted = formatSpells(cleaned, fields);

//   setCache(cacheKey, formatted);
//   return formatted;
// }

export async function getSpellById(
  id,
  fields = ["name", "image", "incantation", "category", "effect", "light"]
) {
  const cacheKey = `spell-${id}-fields-${fields.join(",")}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${API_BASE}/spells/${id}`);
  if (!res.ok) throw new Error("Failed to fetch spell");
  const data = await res.json();
  const formatted = formatSpells([data.data], fields)[0];
  setCache(cacheKey, formatted);
  return formatted;
}

// NEW for Fitlering/Sorting/Search
/**
 * Build query string for PotterDB characters with search/filters/sort.
 * Supported operators: eq (exact), cont (contains).
 */
function buildSpellQuery({ search, filters = {}, sort } = {}) {
  const qs = new URLSearchParams();

  // Search by name (contains)
  if (search && search.trim()) {
    qs.append("filter[name_cont]", search.trim());
  }

  // Field filters
  Object.entries(filters).forEach(([key, def]) => {
    const { value, operator = "eq" } = def || {};
    if (value === undefined || value === null || value === "") return;
    qs.append(`filter[${key}_${operator}]`, String(value));
  });

  // Sorting (e.g., "name" or "-name")
  if (sort) qs.append("sort", sort);

  return qs;
}

/**
 * Fetch ONE page of characters (cleaned + formatted).
 * Adds support for search, filters, and sort.
 */
export async function getSpells(page = 1, size = 20, fields, query = {}) {
  const qs = buildSpellQuery(query);
  qs.append("page[number]", String(page));
  qs.append("page[size]", String(size));

  const cacheKey = `spells-page-${page}-size-${size}-fields-${fields?.join(
    ","
  )}-qs-${qs.toString()}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const url = `${API_BASE}/spells?${qs.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch spells");

  const data = await response.json();

  const cleaned = cleanSpells(data.data);
  const formatted = formatSpells(cleaned, fields);

  setCache(cacheKey, formatted);
  return formatted;
}

// Fetch all unique spell categories (deduped, sorted, cached)
export async function getSpellCategories({
  maxPages = 10,
  pageSize = 100,
} = {}) {
  const cacheKey = `spell-categories-v1-${pageSize}-${maxPages}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  let url = `${API_BASE}/spells?fields[spells]=category&page[size]=${pageSize}&sort=category`;
  const seen = new Map(); // lower -> original

  for (let i = 0; i < maxPages && url; i++) {
    const res = await fetch(url);
    if (!res.ok) break;

    const json = await res.json();
    const data = Array.isArray(json?.data) ? json.data : [];
    for (const item of data) {
      const cat = item?.attributes?.category;
      if (!cat) continue;
      const c = String(cat).trim();
      if (!c) continue;
      const low = c.toLowerCase();
      if (!seen.has(low)) seen.set(low, c);
    }

    url = json?.links?.next || null; // JSON:API-style pagination
  }

  const categories = Array.from(seen.values()).sort((a, b) =>
    a.localeCompare(b)
  );
  setCache(cacheKey, categories);
  return categories;
}

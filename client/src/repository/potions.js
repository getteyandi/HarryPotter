import { getCache, setCache } from "./cache";

const API_BASE = "https://api.potterdb.com/v1";

/**
 * Light cleaning similar to characters/spells.
 */
function cleanPotions(potions) {
  return potions.filter((p) => {
    const name = p.attributes.name?.trim() || "";
    if (!name) return false;
    if (name.length > 80) return false;
    if (!p.attributes.image) return false; // keep visual consistency
    return true;
  });
}

function formatPotions(
  potions,
  fields = [
    "slug",
    "name",
    "image",
    "difficulty",
    "effect",
    "ingredients",
    "side_effects",
    "characteristics",
    "time",
    "inventors",
    "manufacturers",
    "wiki",
  ]
) {
  return potions.map((p) => {
    const attrs = p.attributes || {};
    const formatted = {};
    fields.forEach((f) => {
      formatted[f] = attrs[f] ?? null;
    });
    return {
      id: p.id,
      type: p.type, // keep type too if needed
      ...formatted,
    };
  });
}


/**
 * Fetch one page (no cross-page fill).
 */
// export async function getPotions(page = 1, size = 20, fields) {
//   const cacheKey = `potions-page-${page}-size-${size}-fields-${fields?.join(
//     ","
//   )}`;
//   const cached = getCache(cacheKey);
//   if (cached) return cached;

//   const res = await fetch(
//     `${API_BASE}/potions?page[number]=${page}&page[size]=${size}`
//   );
//   if (!res.ok) throw new Error("Failed to fetch potions");
//   const data = await res.json();

//   const cleaned = cleanPotions(data.data);
//   const formatted = formatPotions(cleaned, fields);
//   setCache(cacheKey, formatted);
//   return formatted;
// }

export async function getPotionById(
  id,
  fields = [
    "slug",
    "name",
    "image",
    "difficulty",
    "effect",
    "ingredients",
    "side_effects",
    "characteristics",
    "time",
    "inventors",
    "manufacturers",
  ]
) {
  const cacheKey = `potion-${id}-fields-${fields.join(",")}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${API_BASE}/potions/${id}`);
  if (!res.ok) throw new Error("Failed to fetch potion");
  const data = await res.json();
  const formatted = formatPotions([data.data], fields)[0];
  setCache(cacheKey, formatted);
  return formatted;
}

// NEW LOGIC FOR SEARCH/FITLER
// NEW: Fetch all unique difficulties for filter (deduped, sorted, cached)
/** Build query for PotterDB potions */
function buildPotionQuery({ search, filters = {}, sort } = {}) {
  const qs = new URLSearchParams();

  // Search by name contains
  if (search && String(search).trim()) {
    qs.append("filter[name_cont]", String(search).trim());
  }

  // Field filters (eq/cont)
  Object.entries(filters).forEach(([key, def]) => {
    const { value, operator = "eq" } = def || {};
    if (value === undefined || value === null || value === "") return;
    qs.append(`filter[${key}_${operator}]`, String(value));
  });

  // Sorting: e.g., "name" | "-name"
  if (sort) qs.append("sort", sort);

  return qs;
}

/**
 * Fetch ONE page of potions (cleaned + formatted) with search/filters/sort.
 */
export async function getPotions(page = 1, size = 20, fields, query = {}) {
  const qs = buildPotionQuery(query);
  qs.append("page[number]", String(page));
  qs.append("page[size]", String(size));

  const cacheKey = `potions-page-${page}-size-${size}-fields-${fields?.join(
    ","
  )}-qs-${qs.toString()}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${API_BASE}/potions?${qs.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch potions");
  const data = await res.json();

  const cleaned = cleanPotions(data.data || []);
  const formatted = formatPotions(cleaned, fields);
  setCache(cacheKey, formatted);
  return formatted;
}

export async function getPotionDifficulties({
  maxPages = 10,
  pageSize = 100,
} = {}) {
  const cacheKey = `potion-difficulties-v1-${pageSize}-${maxPages}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  let url = `${API_BASE}/potions?fields[potions]=difficulty&page[size]=${pageSize}&sort=difficulty`;
  const seen = new Map(); // lower -> original case

  for (let i = 0; i < maxPages && url; i++) {
    const res = await fetch(url);
    if (!res.ok) break;

    const json = await res.json();
    const list = Array.isArray(json?.data) ? json.data : [];
    for (const it of list) {
      const d = it?.attributes?.difficulty;
      if (!d) continue;
      const t = String(d).trim();
      if (!t) continue;
      const low = t.toLowerCase();
      if (!seen.has(low)) seen.set(low, t);
    }
    url = json?.links?.next || null;
  }

  const arr = Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
  setCache(cacheKey, arr);
  return arr;
}

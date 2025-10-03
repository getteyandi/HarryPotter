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
export async function getPotions(page = 1, size = 20, fields) {
  const cacheKey = `potions-page-${page}-size-${size}-fields-${fields?.join(
    ","
  )}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const res = await fetch(
    `${API_BASE}/potions?page[number]=${page}&page[size]=${size}`
  );
  if (!res.ok) throw new Error("Failed to fetch potions");
  const data = await res.json();

  const cleaned = cleanPotions(data.data);
  const formatted = formatPotions(cleaned, fields);
  setCache(cacheKey, formatted);
  return formatted;
}

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

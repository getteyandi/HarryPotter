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
  fields = ["name", "image", "incantation", "category", "effect"]
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
export async function getSpells(page = 1, size = 20, fields) {
  const cacheKey = `spells-page-${page}-size-${size}-fields-${fields?.join(
    ","
  )}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const res = await fetch(
    `${API_BASE}/spells?page[number]=${page}&page[size]=${size}`
  );
  if (!res.ok) throw new Error("Failed to fetch spells");

  const data = await res.json();
  const cleaned = cleanSpells(data.data);
  const formatted = formatSpells(cleaned, fields);

  setCache(cacheKey, formatted);
  return formatted;
}

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

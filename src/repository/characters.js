import { getCache, setCache } from "./cache";

const API_BASE = "https://api.potterdb.com/v1";

/**
 * Clean raw characters from PotterDB (removes junk data).
 */
function cleanCharacters(characters) {
  return characters.filter((char) => {
    const name = char.attributes.name?.trim() || "";

    if (name.length === 1) return false; // single-letter names
    if (/\d/.test(name)) return false; // names with digits
    if (name.length > 30) return false; // overly long names
    if (!char.attributes.image) return false; // must have image

    const blacklist = ["spectator", "champion", "student", "actor"];
    if (blacklist.some((word) => name.toLowerCase().includes(word))) {
      return false;
    }

    return true;
  });
}

function formatCharacters(characters, fields = ["name", "house", "image"]) {
  return characters.map((char) => {
    const attrs = char.attributes;
    const formatted = {};
    fields.forEach((field) => {
      formatted[field] = attrs[field] || null;
    });

    return {
      id: char.id,
      ...formatted,
    };
  });
}

/**
 * Fetch ONE page of characters (cleaned + formatted).
 * Always respects PotterDB’s pagination (no cross-page fill).
 */
export async function getCharacters(page = 1, size = 20, fields) {
  const cacheKey = `characters-page-${page}-size-${size}-fields-${fields?.join(
    ","
  )}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const response = await fetch(
    `${API_BASE}/characters?page[number]=${page}&page[size]=${size}`
  );
  if (!response.ok) throw new Error("Failed to fetch characters");

  const data = await response.json();

  const cleaned = cleanCharacters(data.data);
  const formatted = formatCharacters(cleaned, fields);

  setCache(cacheKey, formatted);
  return formatted;
}

export async function getCharacterById(id) {
  const response = await fetch(`${API_BASE}/characters/${id}`);
  if (!response.ok) throw new Error("Failed to fetch character");
  const data = await response.json();
  return data.data;
}

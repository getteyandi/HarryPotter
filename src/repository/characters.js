import { getCache, setCache } from "./cache";

const API_BASE = "https://api.potterdb.com/v1";

function cleanCharacters(characters) {
  return characters.filter((char) => {
    const name = char.attributes.name?.trim() || "";

    // Rule 1: remove single-letter names
    if (name.length === 1) return false;

    // Rule 2: remove names containing digits
    if (/\d/.test(name)) return false;

    // Rule 3: filter out unwanted keywords
    const blacklist = ["spectator", "champion", "student", "actor"];
    if (blacklist.some((word) => name.toLowerCase().includes(word))) {
      return false;
    }

    // Rule 4: exclude names longer than 30 characters
    if (name.length > 30) return false;

    // Rule 5: exclude without image
    if (!char.attributes.image) return false;

    return true;
  });
}

export async function getCharacters(page = 1, size = 20) {
  const cacheKey = `characters-page-${page}-size-${size}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  let results = [];
  let currentPage = page;

  while (results.length < size) {
    const response = await fetch(
      `${API_BASE}/characters?page[number]=${currentPage}&page[size]=${size}`
    );
    if (!response.ok) throw new Error("Failed to fetch characters");

    const data = await response.json();
    const cleaned = cleanCharacters(data.data);

    results = [...results, ...cleaned];

    // Safety break in case API runs out of characters
    if (data.data.length === 0) break;

    currentPage++;
  }

  // Trim results to exactly `size`
  results = results.slice(0, size);

  setCache(cacheKey, results);
  return results;
}

export async function getCharacterById(id) {
  const response = await fetch(`${API_BASE}/characters/${id}`);
  if (!response.ok) throw new Error("Failed to fetch character");

  const data = await response.json();
  return data.data;
}

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
// COMMENDTED FOR NOW (OTHER FUNCTION FOUND BELOW)
// export async function getCharacters(page = 1, size = 20, fields) {
//   const cacheKey = `characters-page-${page}-size-${size}-fields-${fields?.join(
//     ","
//   )}`;
//   const cached = getCache(cacheKey);
//   if (cached) return cached;

//   const response = await fetch(
//     `${API_BASE}/characters?page[number]=${page}&page[size]=${size}`
//   );
//   if (!response.ok) throw new Error("Failed to fetch characters");

//   const data = await response.json();

//   const cleaned = cleanCharacters(data.data);
//   const formatted = formatCharacters(cleaned, fields);

//   setCache(cacheKey, formatted);
//   return formatted;
// }

// export async function getCharacterById(id) {
//   const response = await fetch(`${API_BASE}/characters/${id}`);
//   if (!response.ok) throw new Error("Failed to fetch character");
//   const data = await response.json();
//   return data.data;
// }

// NEW for Filtering/Sorting/Search
/**
 * Build query string for PotterDB characters with search/filters/sort.
 * Supported operators: eq (exact), cont (contains).
 */
function buildCharacterQuery({ search, filters = {}, sort } = {}) {
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
export async function getCharacters(page = 1, size = 20, fields, query = {}) {
  const qs = buildCharacterQuery(query);
  qs.append("page[number]", String(page));
  qs.append("page[size]", String(size));

  const cacheKey = `characters-page-${page}-size-${size}-fields-${fields?.join(
    ","
  )}-qs-${qs.toString()}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const url = `${API_BASE}/characters?${qs.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch characters");

  const data = await response.json();

  const cleaned = cleanCharacters(data.data);
  const formatted = formatCharacters(cleaned, fields);

  setCache(cacheKey, formatted);
  return formatted;
}

export async function getCharacterById(id) {
  const cacheKey = `character-${id}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${API_BASE}/characters/${id}`);
  if (!response.ok) throw new Error("Failed to fetch character");

  const data = await response.json();
  const char = data.data;
  const attrs = char.attributes;

  const formatted = {
    id: char.id,
    slug: attrs.slug,
    name: attrs.name,
    aliasNames: attrs.alias_names || [],
    animagus: attrs.animagus,
    bloodStatus: attrs.blood_status,
    boggart: attrs.boggart,
    born: attrs.born,
    died: attrs.died,
    eyeColor: attrs.eye_color,
    familyMembers: attrs.family_members || [],
    gender: attrs.gender,
    hairColor: attrs.hair_color,
    height: attrs.height,
    house: attrs.house,
    image: attrs.image,
    jobs: attrs.jobs || [],
    maritalStatus: attrs.marital_status,
    nationality: attrs.nationality,
    patronus: attrs.patronus,
    romances: attrs.romances || [],
    skinColor: attrs.skin_color,
    species: attrs.species,
    titles: attrs.titles || [],
    wands: attrs.wands || [],
    weight: attrs.weight,
    wiki: attrs.wiki,
  };

  setCache(cacheKey, formatted);
  return formatted;
}

function formatCharacterDetailed(char) {
  const attrs = char.attributes;
  return {
    id: char.id,
    name: attrs.name,
    image: attrs.image,
    species: attrs.species,
    gender: attrs.gender,
    house: attrs.house || "unknown",
    bloodStatus: attrs.blood_status,
    boggart: attrs.boggart,
    born: attrs.born,
    died: attrs.died,
    eyeColor: attrs.eye_color,
    hairColor: attrs.hair_color,
    skinColor: attrs.skin_color,
    nationality: attrs.nationality,
    familyMembers: attrs.family_members,
    patronus: attrs.patronus,
    wands: attrs.wands,
    titles: attrs.titles,
    wiki: attrs.wiki,
  };
}

export async function getCharactersDetailed(page = 1, size = 20) {
  const cacheKey = `characters-detailed-${page}-size-${size}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const response = await fetch(
    `${API_BASE}/characters?page[number]=${page}&page[size]=${size}`
  );
  if (!response.ok) throw new Error("Failed to fetch characters");

  const data = await response.json();

  const cleaned = cleanCharacters(data.data); // still remove junk like actors
  const detailed = cleaned.map(formatCharacterDetailed);

  setCache(cacheKey, detailed);
  return detailed;
}

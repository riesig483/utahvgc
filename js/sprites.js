/**
 * Sprite lookup helpers.
 *
 * This app is scoped to the Pokemon Champions roster: `js/data/pokemon.js`
 * and `js/data/items.js` each hold a curated {name, url} list scraped from
 * Bulbagarden Archives' "Champions menu sprites" category and Pokebase's
 * Pokemon Champions item list. Every entry stores its sprite's direct image
 * URL (Bulbagarden file hashes and Pokebase asset IDs aren't derivable from
 * a name, so there's no slug-building step here -- just a name -> URL map).
 *
 * Every sprite is displayed inside a fixed-size box with object-fit:contain
 * (see css/style.css), so Pokemon are always the same size as each other
 * and items are always the same size as each other, no matter how the
 * source images are sized.
 *
 * If a name doesn't resolve (a typo, or a Pokemon/item not in the Champions
 * roster), the user can just paste a direct image URL into the same input
 * box instead of a name -- isImageUrl() below detects that and the raw URL
 * is used verbatim.
 */

const POKEMON_BY_KEY = new Map();
for (const p of window.POKEMON_DATA) {
  POKEMON_BY_KEY.set(normalizeKey(p.name), p);
}

const ITEM_BY_KEY = new Map();
for (const i of window.ITEM_DATA) {
  ITEM_BY_KEY.set(normalizeKey(i.name), i);
}

function normalizeKey(str) {
  return String(str || '')
    .trim()
    .toLowerCase()
    .replace(/[’'.]/g, '')
    .replace(/\s+/g, ' ');
}

/** Strips everything but letters/digits, for a loose "did they mean this" fallback match. */
function collapseKey(str) {
  return normalizeKey(str).replace(/[^a-z0-9]/g, '');
}

function isImageUrl(value) {
  return /^(https?:)?\/\//i.test(String(value || '').trim());
}

/** Find the best-matching Pokemon data entry for free-typed text. */
function findPokemon(name) {
  const key = normalizeKey(name);
  if (!key) return null;
  if (POKEMON_BY_KEY.has(key)) return POKEMON_BY_KEY.get(key);
  // Loose fallback: e.g. "Charizard Mega X" <-> "Charizard (Mega X)".
  const collapsed = collapseKey(name);
  for (const p of window.POKEMON_DATA) {
    if (collapseKey(p.name) === collapsed) return p;
  }
  return null;
}

/**
 * If `name` resolves to a Mega Evolution, returns that Mega's held item
 * (its Mega Stone) -- e.g. "Charizard (Mega X)" -> "Charizardite X". Built
 * from the real scraped Pokemon/item lists (js/data/mega-stones.js), not a
 * guessed suffix rule, since Champions gives many Pokemon Mega Stones that
 * never existed in the mainline games.
 */
function megaStoneFor(name) {
  const p = findPokemon(name);
  if (!p) return null;
  return window.MEGA_STONE_MAP[p.name] || null;
}

/**
 * Reverse of megaStoneFor(): given a typed/scanned item name that resolves
 * to a Mega Stone, returns the exact Mega-form Pokemon name it belongs to
 * (e.g. "Charizardite X" -> "Charizard (Mega X)"), or null if it isn't a
 * Mega Stone. Built once from the same real scraped MEGA_STONE_MAP, since
 * a base species can have more than one Mega form (each with its own
 * distinct stone -- e.g. Charizard's X/Y), so the stone name alone
 * determines exactly which form, not just the species.
 */
const STONE_TO_MEGA_FORM = new Map();
for (const [pokemonName, stoneName] of Object.entries(window.MEGA_STONE_MAP)) {
  STONE_TO_MEGA_FORM.set(normalizeKey(stoneName), pokemonName);
}

function megaFormForStone(itemName) {
  const i = findItem(itemName);
  if (!i) return null;
  return STONE_TO_MEGA_FORM.get(normalizeKey(i.name)) || null;
}

/** True if `pokemonName` is the base species of Mega-form name `megaFormName` (e.g. "Charizard" <-> "Charizard (Mega X)"). */
function pokemonSpeciesMatches(pokemonName, megaFormName) {
  const species = String(megaFormName || '').replace(/\s*\([^)]*\)\s*$/, '');
  return collapseKey(pokemonName) === collapseKey(species);
}

function findItem(name) {
  const key = normalizeKey(name);
  if (!key) return null;
  if (ITEM_BY_KEY.has(key)) return ITEM_BY_KEY.get(key);
  const collapsed = collapseKey(name);
  for (const i of window.ITEM_DATA) {
    if (collapseKey(i.name) === collapsed) return i;
  }
  return null;
}

function pokemonSpriteUrl(name) {
  const raw = String(name || '').trim();
  if (!raw) return '';
  if (isImageUrl(raw)) return raw;
  const p = findPokemon(raw);
  return p ? p.url : '';
}

function itemSpriteUrl(name) {
  const raw = String(name || '').trim();
  if (!raw) return '';
  if (isImageUrl(raw)) return raw;
  const i = findItem(raw);
  return i ? i.url : '';
}

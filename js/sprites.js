/**
 * Sprite lookup helpers.
 *
 * Pokemon art comes from pokemondb.net's "home" render set and item icons
 * come from Pokemon Showdown's itemicons set -- both are hot-linked, exactly
 * like the original Apps Script tool did, so no image assets need to ship
 * with this app. Every sprite is displayed inside a fixed-size box with
 * object-fit:contain (see css/style.css), so Pokemon are always the same
 * size as each other and items are always the same size as each other, no
 * matter how the source images are sized.
 *
 * If a name doesn't resolve to sprite data, or the auto-generated slug is
 * wrong for some obscure form, the user can just paste a direct image URL
 * into the same input box instead of a name -- isImageUrl() below detects
 * that and the raw URL is used verbatim.
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

function isImageUrl(value) {
  return /^(https?:)?\/\//i.test(String(value || '').trim());
}

/** Find the best-matching Pokemon data entry for free-typed text. */
function findPokemon(name) {
  const key = normalizeKey(name);
  if (!key) return null;
  if (POKEMON_BY_KEY.has(key)) return POKEMON_BY_KEY.get(key);
  // Loose fallback: also try turning "raichu alolan" <-> "alolan raichu" etc.
  const collapsed = key.replace(/[\s-]/g, '');
  for (const p of window.POKEMON_DATA) {
    if (normalizeKey(p.name).replace(/[\s-]/g, '') === collapsed) return p;
  }
  return null;
}

function findItem(name) {
  const key = normalizeKey(name);
  if (!key) return null;
  if (ITEM_BY_KEY.has(key)) return ITEM_BY_KEY.get(key);
  return null;
}

function pokemonSpriteUrl(name) {
  const raw = String(name || '').trim();
  if (!raw) return '';
  if (isImageUrl(raw)) return raw;
  const p = findPokemon(raw);
  if (!p) return '';
  return `https://img.pokemondb.net/sprites/home/normal/${p.slug}.png`;
}

function itemSpriteUrl(name) {
  const raw = String(name || '').trim();
  if (!raw) return '';
  if (isImageUrl(raw)) return raw;
  const i = findItem(raw);
  if (!i) return '';
  return `https://play.pokemonshowdown.com/sprites/itemicons/${i.slug}.png`;
}

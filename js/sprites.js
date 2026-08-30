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

/**
 * Best-match fuzzy lookup for teamsheet scans (js/teamsheet.js) only. A
 * real teamsheet often phrases a form differently than this app's own
 * roster names -- "Ninetales Alolan Form" for "Ninetales (Alola)", "Mega
 * Charizard X" for "Charizard (Mega X)" -- which the exact/collapsed match
 * in findPokemon()/findItem() above won't catch. The manual picker doesn't
 * use these: it already shows the real names via a datalist, and matching
 * loosely there risks silently swapping in the wrong Pokemon/item while
 * someone is still mid-typing.
 */
const FUZZY_FORM_WORD_ALIASES = {
  alolan: 'alola', galarian: 'galar', hisuian: 'hisui', paldean: 'paldea',
};
const FUZZY_STOPWORDS = new Set(['form', 'forme', 'the']);

function fuzzyTokens(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/[’'.]/g, '')
    .split(/[\s-]+/)
    .map(w => FUZZY_FORM_WORD_ALIASES[w] || w)
    .filter(w => w && !FUZZY_STOPWORDS.has(w));
}

/** Intersection-over-union of two token lists, treated as sets (word order doesn't matter -- "Mega Charizard X" should match "Charizard (Mega X)"). */
function tokenSetSimilarity(aTokens, bTokens) {
  const a = new Set(aTokens);
  const b = new Set(bTokens);
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

/**
 * Scores `text` against every entry in `roster` and returns the closest
 * one, or null if nothing is close enough to trust. Tries word-set overlap
 * first (handles reordering/rewording -- "Alolan Ninetales" vs "Ninetales
 * (Alola)"), then falls back to nearest edit-distance on the collapsed
 * full name (handles OCR noise that garbles word boundaries rather than
 * just rewording it).
 */
function bestFuzzyMatch(text, roster) {
  const queryTokens = fuzzyTokens(text);
  if (!queryTokens.length) return null;

  let best = null;
  let bestScore = 0;
  for (const entry of roster) {
    const score = tokenSetSimilarity(queryTokens, fuzzyTokens(entry.name));
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  if (best && bestScore >= 0.5) return best;

  const queryCollapsed = collapseKey(text);
  let bestDist = Infinity;
  let bestByDistance = null;
  for (const entry of roster) {
    const dist = levenshtein(queryCollapsed, collapseKey(entry.name));
    if (dist < bestDist) {
      bestDist = dist;
      bestByDistance = entry;
    }
  }
  const candidateLen = bestByDistance ? collapseKey(bestByDistance.name).length : 0;
  const maxLen = Math.max(queryCollapsed.length, candidateLen);
  return bestByDistance && maxLen > 0 && bestDist / maxLen <= 0.35 ? bestByDistance : null;
}

function findPokemonFuzzy(name) {
  return bestFuzzyMatch(name, window.POKEMON_DATA);
}

function findItemFuzzy(name) {
  return bestFuzzyMatch(name, window.ITEM_DATA);
}

/**
 * Static reference lists for the dropdowns that aren't Pokemon/items, plus
 * the bundled brand assets scraped directly from the club's own template
 * deck (NEW_Top_Cut_Graphic_with_items_and_teras.pptx) -- real files, not
 * recreations. `js/render.js` falls back to these whenever Branding… has
 * no user-uploaded override for a given tournament type / store / the
 * background / the org logo.
 */

// Order here is the dropdown order: roughly smallest to largest event, with
// Custom pinned at the end as the catch-all -- not alphabetical.
const TOURNEY_TYPES = [
  { id: 'friendly', name: 'Friendly' },
  { id: 'league-challenge', name: 'Challenge' },
  { id: 'league-cup', name: 'Cup' },
  { id: 'grand-challenge', name: 'Grand Challenge' },
  { id: 'global-challenge', name: 'Global Challenge' },
  { id: 'regional-championship', name: 'Regional' },
  { id: 'international-championship', name: 'IC' },
  { id: 'worlds', name: 'Worlds' },
  { id: 'custom', name: 'Custom title…' },
];

/**
 * Logos: league-challenge/league-cup/regional-championship/global-challenge
 * came from the template deck's slides; worlds/international-championship
 * were supplied separately as file attachments (Logos.pptx).
 *
 * grand-challenge has no logo of its own yet -- it intentionally shares
 * global-challenge's file as a placeholder (per instruction) until a real
 * one is supplied, so updating assets/logos/global-challenge.png updates
 * both until then.
 */
const DEFAULT_TOURNEY_LOGOS = {
  'league-challenge': 'assets/logos/league-challenge.png',
  'league-cup': 'assets/logos/league-cup.png',
  'regional-championship': 'assets/logos/regional-championship.png',
  'international-championship': 'assets/logos/international-championship.png',
  'global-challenge': 'assets/logos/global-challenge.png',
  'grand-challenge': 'assets/logos/global-challenge.png',
  worlds: 'assets/logos/worlds.png',
};

/**
 * Logo source files aren't all drawn at the same visual scale relative to
 * their canvas, so a single shared max-height makes some look smaller than
 * others even though the box itself is the same size. Override per type as
 * needed; anything not listed uses DEFAULT_LOGO_HEIGHT.
 *
 * regional-championship's shield art fills ~92% of its canvas height vs.
 * international-championship's ~100% (its canvas has no padding at all),
 * so matching their *content* height -- not just the box height -- takes
 * 190 * (international content-height-ratio / regional content-height-ratio)
 * = 190 * (1.0 / 0.916) ≈ 206px.
 */
const DEFAULT_LOGO_HEIGHT = 190;
const TOURNEY_LOGO_HEIGHT = {
  'regional-championship': 206,
};

/**
 * These are run at a level above any single game store -- there's no store
 * to pick, so the form swaps "Hosting game store" for a plain city field
 * and the graphic drops the store logo/"Hosted by" label entirely.
 */
const BIG_EVENT_TYPES = ['regional-championship', 'international-championship', 'worlds'];

/**
 * Default stores are just a starting point -- users can add their own in
 * Branding. game-haven/hastur-games/kayfabe-cards have no logo yet (their
 * images came through as pasted chat images, not file attachments, so the
 * real bytes weren't recoverable) -- they fall back to bold text until
 * uploaded, same as Worlds/Internationals did before.
 */
const DEFAULT_STORES = [
  { id: 'game-grid', name: 'Game Grid' },
  { id: 'game-haven', name: 'Game Haven' },
  { id: 'hastur-games', name: 'Hastur Games' },
  { id: 'kayfabe-cards', name: 'Kayfabe Cards' },
];

const DEFAULT_STORE_LOGOS = {
  'game-grid': 'assets/stores/game-grid.png',
};

const DEFAULT_BACKGROUND = 'assets/background.png';
const DEFAULT_ORG_LOGO = 'assets/org-logo.png';
const ICON_X = 'assets/icon-x.png';
const ICON_GLOBE = 'assets/icon-globe.png';

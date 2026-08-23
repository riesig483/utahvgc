/**
 * Static reference lists for the dropdowns that aren't Pokemon/items, plus
 * the bundled brand assets scraped directly from the club's own template
 * deck (NEW_Top_Cut_Graphic_with_items_and_teras.pptx) -- real files, not
 * recreations. `js/render.js` falls back to these whenever Branding… has
 * no user-uploaded override for a given tournament type / store / the
 * background / the org logo.
 */

const TOURNEY_TYPES = [
  { id: 'league-challenge', name: 'League Challenge' },
  { id: 'league-cup', name: 'League Cup' },
  { id: 'regional-championship', name: 'Regional Championship' },
  { id: 'international-championship', name: 'International Championship' },
  { id: 'global-challenge', name: 'Global Challenge (online)' },
  { id: 'worlds', name: 'World Championship' },
  { id: 'friendly', name: 'Friendly' },
  { id: 'custom', name: 'Custom title…' },
];

/**
 * Logos: the first four came straight from the template deck's slides;
 * worlds/international-championship were supplied separately as file
 * attachments (Logos.pptx).
 */
const DEFAULT_TOURNEY_LOGOS = {
  'league-challenge': 'assets/logos/league-challenge.png',
  'league-cup': 'assets/logos/league-cup.png',
  'regional-championship': 'assets/logos/regional-championship.png',
  'international-championship': 'assets/logos/international-championship.png',
  'global-challenge': 'assets/logos/global-challenge.png',
  worlds: 'assets/logos/worlds.png',
};

/**
 * Logo source files aren't all drawn at the same visual scale relative to
 * their canvas, so a single shared max-height makes some look smaller than
 * others even though the box itself is the same size. Override per type as
 * needed; anything not listed uses DEFAULT_LOGO_MAX_HEIGHT.
 */
const DEFAULT_LOGO_MAX_HEIGHT = 190;
const TOURNEY_LOGO_MAX_HEIGHT = {
  'regional-championship': 240,
};

/**
 * These are run at a level above any single game store -- there's no store
 * to pick, so the form swaps "Hosting game store" for a plain city field
 * and the graphic drops the store logo/"Hosted by" label entirely.
 */
const BIG_EVENT_TYPES = ['regional-championship', 'international-championship', 'worlds'];

/** Default stores are just a starting point -- users can add their own in Branding. */
const DEFAULT_STORES = [
  { id: 'game-grid', name: 'Game Grid' },
];

const DEFAULT_STORE_LOGOS = {
  'game-grid': 'assets/stores/game-grid.png',
};

const DEFAULT_BACKGROUND = 'assets/background.png';
const DEFAULT_ORG_LOGO = 'assets/org-logo.png';
const ICON_X = 'assets/icon-x.png';
const ICON_GLOBE = 'assets/icon-globe.png';

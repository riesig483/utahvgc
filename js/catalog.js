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
  { id: 'global-challenge', name: 'Global Challenge (online)' },
  { id: 'worlds', name: 'World Championship' }, // logo not supplied yet -- falls back to text until uploaded in Branding…
  { id: 'custom', name: 'Custom title…' },
];

/** Logos pulled straight from the template deck's slides -- one per type it actually showed. */
const DEFAULT_TOURNEY_LOGOS = {
  'league-challenge': 'assets/logos/league-challenge.png',
  'league-cup': 'assets/logos/league-cup.png',
  'regional-championship': 'assets/logos/regional-championship.png',
  'global-challenge': 'assets/logos/global-challenge.png',
};

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

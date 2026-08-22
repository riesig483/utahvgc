/** Static reference lists for the dropdowns that aren't Pokemon/items. */

const TOURNEY_TYPES = [
  { id: 'league-challenge', name: 'League Challenge' },
  { id: 'league-cup', name: 'League Cup' },
  { id: 'regional', name: 'Regional Championship' },
  { id: 'international', name: 'International Championship' },
  { id: 'worlds', name: 'World Championship' },
  { id: 'locals', name: 'Locals / Weekly' },
  { id: 'custom', name: 'Custom title…' },
];

/** Default stores are just a starting point -- users can add their own in Branding. */
const DEFAULT_STORES = [
  { id: 'game-grid', name: 'Game Grid' },
];

/** A simple inline placeholder so the header logo slot is never empty. */
function defaultOrgLogoDataUri() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
      <circle cx="100" cy="100" r="96" fill="#1a2a3a" stroke="#f4a13a" stroke-width="6"/>
      <circle cx="100" cy="100" r="46" fill="#f4a13a"/>
      <circle cx="100" cy="100" r="18" fill="#1a2a3a"/>
      <text x="100" y="176" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700"
            font-size="26" fill="#ffffff">VGC</text>
    </svg>`.trim();
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

/**
 * App state + all persistence (drafts, export history, branding settings).
 *
 * This is a static site with no backend, so "version control" is done with
 * the browser's localStorage: every save creates a timestamped, named
 * snapshot of the full form state that can be reloaded and re-edited later.
 * Drafts/history can also be exported as JSON files (see drafts.js) for
 * real, durable, shareable version control -- e.g. committing them into a
 * git repo alongside this app.
 */

const STORAGE_KEYS = {
  settings: 'vgc.settings.v1',
  current: 'vgc.current.v1',
  drafts: 'vgc.drafts.v1',
  history: 'vgc.history.v1',
};

const PLACE_LABELS = ['1st', '2nd', '3rd', '4th'];

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function emptyTeamSlot() {
  return { pokemon: '', item: '' };
}

function defaultPlace() {
  return {
    name: '',
    handle: '',
    badge: '', // overrides the "1st"/"2nd"/... label, e.g. "65 CP" for a Global Challenge
    team: [0, 1, 2, 3, 4, 5].map(emptyTeamSlot),
  };
}

function defaultState() {
  return {
    tourneyType: 'league-challenge',
    customTitle: '',
    customSubtitle: '',
    date: todayISO(),
    store: DEFAULT_STORES[0] ? DEFAULT_STORES[0].id : 'custom',
    storeCustomName: '',
    storeLocation: '',
    organizer: '',
    places: [0, 1, 2, 3].map(defaultPlace),
  };
}

function defaultSettings() {
  return {
    background: null, // data URL override, or null to use the bundled DEFAULT_BACKGROUND
    orgLogo: null, // data URL override, or null to use the bundled DEFAULT_ORG_LOGO
    tourneyLogos: {}, // { [tourneyTypeId]: dataURL } overrides on top of DEFAULT_TOURNEY_LOGOS
    stores: DEFAULT_STORES.slice(),
    storeLogos: {}, // { [storeId]: dataURL } overrides on top of DEFAULT_STORE_LOGOS
    twitter: '@Utah_VGC',
    website: 'utahvgc.com',
    email: 'UtahVGC@gmail.com',
    credit1: 'LOGO AND BACKGROUND BY: @The1HotGinger',
    credit2: 'INFOGRAPHIC BY: @chaldavgc',
    claudeApiKey: '', // bring-your-own-key for teamsheet photo scanning (js/teamsheet.js) -- never sent anywhere but api.anthropic.com
  };
}

function safeParse(json, fallback) {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch (e) {
    console.error('Failed to parse stored JSON', e);
    return fallback;
  }
}

function loadSettings() {
  const stored = safeParse(localStorage.getItem(STORAGE_KEYS.settings), null);
  return Object.assign(defaultSettings(), stored || {});
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

function loadCurrent() {
  const stored = safeParse(localStorage.getItem(STORAGE_KEYS.current), null);
  if (!stored) return defaultState();
  // Merge onto defaults so older saved shapes still work after app updates.
  return Object.assign(defaultState(), stored);
}

function saveCurrent(state) {
  localStorage.setItem(STORAGE_KEYS.current, JSON.stringify(state));
}

function loadDrafts() {
  return safeParse(localStorage.getItem(STORAGE_KEYS.drafts), []);
}

function saveDrafts(drafts) {
  localStorage.setItem(STORAGE_KEYS.drafts, JSON.stringify(drafts));
}

function loadHistory() {
  return safeParse(localStorage.getItem(STORAGE_KEYS.history), []);
}

function pushHistory(entry) {
  const history = loadHistory();
  history.unshift(entry);
  while (history.length > 50) history.pop();
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

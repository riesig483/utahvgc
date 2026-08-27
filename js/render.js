/** Renders `state` + `settings` into the .graphic preview DOM. */

/**
 * Sprites are hotlinked straight from archives.bulbagarden.net (a
 * MediaWiki instance, not a CDN) and i.pokebase.app -- a render can ask
 * for up to 24 of them at once (4 placements x 6 slots), and either host
 * occasionally hiccups on that kind of burst with a transient reset/
 * timeout rather than a real "this image doesn't exist" error. Retrying a
 * couple of times before giving up turns most of those into a load that
 * just took an extra second, instead of a sprite that's stuck broken for
 * the rest of the session.
 */
const SPRITE_RETRY_DELAYS_MS = [600, 1800];

function trackSpriteLoad(img, url) {
  if (!url) {
    img.removeAttribute('src');
    delete img.dataset.spriteUrl;
    img.classList.add('sprite-empty');
    return;
  }
  img.classList.remove('sprite-empty');
  img.dataset.spriteUrl = url; // so retryFailedSprites() can re-attempt this exact sprite later
  attemptSpriteLoad(img, url, 0);
}

function attemptSpriteLoad(img, url, attempt) {
  img.onerror = () => {
    if (attempt < SPRITE_RETRY_DELAYS_MS.length) {
      setTimeout(() => attemptSpriteLoad(img, url, attempt + 1), SPRITE_RETRY_DELAYS_MS[attempt]);
    } else {
      img.classList.add('sprite-broken');
      updateSpriteWarning();
    }
  };
  img.onload = () => {
    img.classList.remove('sprite-broken');
    updateSpriteWarning();
  };
  // No crossOrigin here: it's not needed for plain on-page display, and
  // forcing CORS mode on every preview image makes some CDN-cached sprites
  // fail to load (their CORS headers aren't always present on the cached
  // response, even though a normal request gets the image fine). Export
  // handles CORS itself via html2canvas's useCORS option -- see export.js.
  //
  // Re-assigning the exact same src a browser just failed to load is a
  // no-op in most engines (they compare against the current attribute
  // value and skip re-fetching), so a retry needs a distinct URL to
  // actually force a fresh network request -- a harmless cache-busting
  // query param does that without changing which image loads.
  img.src = attempt === 0 ? url : `${url}${url.includes('?') ? '&' : '?'}_retry=${attempt}-${Date.now()}`;
}

/** Re-attempts every sprite currently showing as broken -- wired to the "Retry" button in the warning banner. */
function retryFailedSprites() {
  document.querySelectorAll('#graphic .sprite-broken').forEach(img => {
    if (img.dataset.spriteUrl) attemptSpriteLoad(img, img.dataset.spriteUrl, 0);
  });
}

function updateSpriteWarning() {
  const broken = document.querySelectorAll('#graphic .sprite-broken').length;
  const warn = document.getElementById('sprite-warning');
  warn.hidden = broken === 0;
}

function renderHeader(state, settings) {
  document.getElementById('g-date').textContent = formatDateForGraphic(state.date);
  document.getElementById('g-twitter').textContent = settings.twitter;
  document.getElementById('g-website').textContent = settings.website;
  document.getElementById('g-email').textContent = settings.email;

  const orgLogo = document.getElementById('g-org-logo');
  orgLogo.src = settings.orgLogo || DEFAULT_ORG_LOGO;

  const logoImg = document.getElementById('g-tourney-logo');
  const customBlock = document.getElementById('g-custom-title-block');
  const isCustom = state.tourneyType === 'custom';
  const uploadedLogo = !isCustom && (settings.tourneyLogos[state.tourneyType] || DEFAULT_TOURNEY_LOGOS[state.tourneyType]);

  if (uploadedLogo) {
    logoImg.src = uploadedLogo;
    logoImg.hidden = false;
    logoImg.style.height = (TOURNEY_LOGO_HEIGHT[state.tourneyType] || DEFAULT_LOGO_HEIGHT) + 'px';
    customBlock.hidden = true;
  } else {
    logoImg.hidden = true;
    customBlock.hidden = false;
    const type = TOURNEY_TYPES.find(t => t.id === state.tourneyType);
    document.getElementById('g-custom-title').textContent =
      isCustom ? (state.customTitle || 'Tournament Title') : (type ? type.name : '');
    document.getElementById('g-custom-subtitle').textContent =
      isCustom ? state.customSubtitle : '';
  }
}

function formatDateForGraphic(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function renderPlacements(state) {
  const container = document.getElementById('g-placements');
  container.classList.toggle('big-event', BIG_EVENT_TYPES.includes(state.tourneyType));
  container.innerHTML = '';
  const tpl = document.getElementById('tpl-place-card-graphic');
  const slotTpl = document.getElementById('tpl-team-slot-graphic');

  state.places.forEach((place, idx) => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.classList.add(idx % 2 === 0 ? 'col-left' : 'col-right');
    node.classList.add(idx < 2 ? 'row-1' : 'row-2');
    node.querySelector('.place-rank').textContent = place.badge || PLACE_LABELS[idx];
    node.querySelector('.place-player').textContent = place.name || '';
    node.querySelector('.place-handle').textContent = place.handle
      ? (place.handle.startsWith('@') ? place.handle : '@' + place.handle)
      : '';

    const teamEl = node.querySelector('.place-team');
    place.team.forEach(slot => {
      const slotNode = slotTpl.content.firstElementChild.cloneNode(true);
      const pImg = slotNode.querySelector('.g-pokemon-sprite');
      const iImg = slotNode.querySelector('.g-item-sprite');
      trackSpriteLoad(pImg, pokemonSpriteUrl(slot.pokemon));
      trackSpriteLoad(iImg, itemSpriteUrl(slot.item));
      teamEl.appendChild(slotNode);
    });

    container.appendChild(node);
  });
}

function renderHostedBy(state, settings) {
  const isBigEvent = BIG_EVENT_TYPES.includes(state.tourneyType);
  const isOnlineEvent = ONLINE_EVENT_TYPES.includes(state.tourneyType);
  document.getElementById('g-hosted-by').classList.toggle('big-event', isBigEvent);

  const logoImg = document.getElementById('g-store-logo');
  const fallback = document.getElementById('g-store-name-fallback');
  const locationEl = document.getElementById('g-store-location');

  // Global/Grand Challenge run entirely online -- no store, no host city,
  // so this whole section is empty (matching the template deck's own
  // Global Challenge slide, which has no "Hosted by"/store/city at all).
  if (isOnlineEvent) {
    document.getElementById('g-hosted-by-label').hidden = true;
    logoImg.hidden = true;
    fallback.hidden = true;
    locationEl.textContent = '';
    return;
  }
  document.getElementById('g-hosted-by-label').hidden = false;

  locationEl.textContent = state.storeLocation || '';

  // Regional/International/Worlds run above any single game store -- skip
  // the "Hosted by" label and store logo entirely, just show the city
  // (handled by the .big-event CSS + the location text set above).
  if (isBigEvent) {
    logoImg.hidden = true;
    fallback.hidden = true;
    return;
  }

  const store = settings.stores.find(s => s.id === state.store);
  const isCustomStore = state.store === 'custom' || !store;
  const storeName = isCustomStore ? state.storeCustomName : (store ? store.name : '');
  const logo = !isCustomStore && store
    ? (settings.storeLogos[store.id] || DEFAULT_STORE_LOGOS[store.id])
    : null;

  if (logo) {
    logoImg.src = logo;
    logoImg.hidden = false;
    fallback.hidden = true;
  } else {
    logoImg.hidden = true;
    fallback.hidden = false;
    fallback.textContent = storeName || '';
  }
}

function renderFooter(state, settings) {
  document.getElementById('g-footer-credits').innerHTML =
    escapeHtml(settings.credit1) + '<br>' + escapeHtml(settings.credit2);
  document.getElementById('g-footer-organizer').textContent =
    state.organizer ? `ORGANIZED BY: ${state.organizer}` : '';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str || '');
  return div.innerHTML;
}

function renderBackground(settings) {
  const graphic = document.getElementById('graphic');
  graphic.style.backgroundImage = `url("${settings.background || DEFAULT_BACKGROUND}")`;
}

function renderGraphic(state, settings) {
  renderBackground(settings);
  renderHeader(state, settings);
  renderPlacements(state);
  renderHostedBy(state, settings);
  renderFooter(state, settings);
  // Sprite <img> loads are async; give them a beat before checking for
  // failures so the warning banner reflects real state, not the previous
  // render's leftover .sprite-broken classes.
  setTimeout(updateSpriteWarning, 400);
}

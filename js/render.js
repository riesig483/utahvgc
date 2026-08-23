/** Renders `state` + `settings` into the .graphic preview DOM. */

let spriteLoadFailures = 0;

function trackSpriteLoad(img, url) {
  spriteLoadFailures = 0; // recomputed fully on every render, see updateSpriteWarning
  if (!url) {
    img.removeAttribute('src');
    img.classList.add('sprite-empty');
    return;
  }
  img.classList.remove('sprite-empty');
  // No crossOrigin here: it's not needed for plain on-page display, and
  // forcing CORS mode on every preview image makes some CDN-cached sprites
  // fail to load (their CORS headers aren't always present on the cached
  // response, even though a normal request gets the image fine). Export
  // handles CORS itself via html2canvas's useCORS option -- see export.js.
  img.onerror = () => img.classList.add('sprite-broken');
  img.onload = () => img.classList.remove('sprite-broken');
  img.src = url;
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
    logoImg.style.maxHeight = (TOURNEY_LOGO_MAX_HEIGHT[state.tourneyType] || DEFAULT_LOGO_MAX_HEIGHT) + 'px';
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
  document.getElementById('g-hosted-by').classList.toggle('big-event', isBigEvent);
  document.getElementById('g-store-location').textContent = state.storeLocation || '';

  const logoImg = document.getElementById('g-store-logo');
  const fallback = document.getElementById('g-store-name-fallback');

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

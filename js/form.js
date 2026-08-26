/** Builds the editor form and keeps `state` in sync with user input. */

let state = loadCurrent();
let settings = loadSettings();
let renderTimer = null;

function scheduleRender() {
  saveCurrent(state);
  clearTimeout(renderTimer);
  renderTimer = setTimeout(() => renderGraphic(state, settings), 30);
}

function byName(a, b) {
  return a.name.localeCompare(b.name);
}

function populateDatalists() {
  const pokeList = document.getElementById('dl-pokemon');
  const frag = document.createDocumentFragment();
  for (const p of [...window.POKEMON_DATA].sort(byName)) {
    const opt = document.createElement('option');
    opt.value = p.name;
    frag.appendChild(opt);
  }
  pokeList.appendChild(frag);

  const itemList = document.getElementById('dl-items');
  const frag2 = document.createDocumentFragment();
  for (const i of [...window.ITEM_DATA].sort(byName)) {
    const opt = document.createElement('option');
    opt.value = i.name;
    frag2.appendChild(opt);
  }
  itemList.appendChild(frag2);
}

function populateTourneyTypeSelects() {
  // Not alphabetical -- TOURNEY_TYPES is already in the intended event-size
  // order (see js/catalog.js), with Custom pinned at the end.
  for (const sel of [document.getElementById('f-tourney-type'), document.getElementById('settings-tourney-type-select')]) {
    sel.innerHTML = '';
    for (const t of TOURNEY_TYPES) {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      sel.appendChild(opt);
    }
  }
}

function populateStoreSelects() {
  const main = document.getElementById('f-store');
  const settingsSel = document.getElementById('settings-store-select');
  const sorted = [...settings.stores].sort(byName);
  for (const sel of [main, settingsSel]) {
    sel.innerHTML = '';
    for (const s of sorted) {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name;
      sel.appendChild(opt);
    }
  }
  // "Other / custom…" is a catch-all, not a saved store -- keep it trailing.
  const customOpt = document.createElement('option');
  customOpt.value = 'custom';
  customOpt.textContent = 'Other / custom…';
  main.appendChild(customOpt);
}

function syncStaticFieldsFromState() {
  document.getElementById('f-tourney-type').value = state.tourneyType;
  document.getElementById('f-custom-title').value = state.customTitle;
  document.getElementById('f-custom-subtitle').value = state.customSubtitle;
  document.getElementById('f-date').value = state.date;
  document.getElementById('f-store').value = state.store;
  document.getElementById('f-store-custom').value = state.storeCustomName;
  document.getElementById('f-store-location').value = state.storeLocation;
  document.getElementById('f-organizer').value = state.organizer;
  updateConditionalFieldVisibility();
}

function updateConditionalFieldVisibility() {
  const isCustomTourney = state.tourneyType === 'custom';
  document.getElementById('f-custom-title-wrap').hidden = !isCustomTourney;
  document.getElementById('f-custom-subtitle-wrap').hidden = !isCustomTourney;

  const isBigEvent = BIG_EVENT_TYPES.includes(state.tourneyType);
  const isOnlineEvent = ONLINE_EVENT_TYPES.includes(state.tourneyType);
  const noStore = isBigEvent || isOnlineEvent;
  document.getElementById('f-store-wrap').hidden = noStore;
  document.getElementById('f-store-custom-wrap').hidden = noStore || state.store !== 'custom';
  document.getElementById('f-store-location-wrap').hidden = isOnlineEvent;
  document.getElementById('f-store-location-label').textContent = isBigEvent ? 'City' : 'Store location';
  document.getElementById('f-store-location').placeholder = isBigEvent ? 'e.g. Indianapolis' : 'e.g. Saratoga Springs';
}

function wireStaticFields() {
  document.getElementById('f-tourney-type').addEventListener('change', e => {
    state.tourneyType = e.target.value;
    updateConditionalFieldVisibility();
    scheduleRender();
  });
  document.getElementById('f-custom-title').addEventListener('input', e => {
    state.customTitle = e.target.value;
    scheduleRender();
  });
  document.getElementById('f-custom-subtitle').addEventListener('input', e => {
    state.customSubtitle = e.target.value;
    scheduleRender();
  });
  document.getElementById('f-date').addEventListener('input', e => {
    state.date = e.target.value;
    scheduleRender();
  });
  document.getElementById('f-store').addEventListener('change', e => {
    state.store = e.target.value;
    updateConditionalFieldVisibility();
    scheduleRender();
  });
  document.getElementById('f-store-custom').addEventListener('input', e => {
    state.storeCustomName = e.target.value;
    scheduleRender();
  });
  document.getElementById('f-store-location').addEventListener('input', e => {
    state.storeLocation = e.target.value;
    scheduleRender();
  });
  document.getElementById('f-organizer').addEventListener('input', e => {
    state.organizer = e.target.value;
    scheduleRender();
  });
}

function buildPlacesEditor() {
  const container = document.getElementById('places-editor');
  container.querySelectorAll('.place-form-card').forEach(n => n.remove());
  resetTeamsheetPhotos();

  const cardTpl = document.getElementById('tpl-place-card-form');
  const slotTpl = document.getElementById('tpl-team-slot');

  state.places.forEach((place, placeIdx) => {
    const card = cardTpl.content.firstElementChild.cloneNode(true);
    card.querySelector('.place-form-legend').textContent = `${PLACE_LABELS[placeIdx]} place`;
    wireTeamsheetInputs(card, placeIdx);

    const nameInput = card.querySelector('.p-name');
    nameInput.value = place.name;
    nameInput.addEventListener('input', e => {
      state.places[placeIdx].name = e.target.value;
      scheduleRender();
    });

    const handleInput = card.querySelector('.p-handle');
    handleInput.value = place.handle;
    handleInput.addEventListener('input', e => {
      state.places[placeIdx].handle = e.target.value;
      scheduleRender();
    });

    const badgeInput = card.querySelector('.p-badge');
    badgeInput.value = place.badge;
    badgeInput.addEventListener('input', e => {
      state.places[placeIdx].badge = e.target.value;
      scheduleRender();
    });

    const slotsContainer = card.querySelector('.p-team-slots');
    place.team.forEach((slot, slotIdx) => {
      const slotNode = slotTpl.content.firstElementChild.cloneNode(true);
      slotNode.querySelector('.slot-label').textContent = `Pokémon ${slotIdx + 1}`;

      const pInput = slotNode.querySelector('.slot-pokemon');
      const iInput = slotNode.querySelector('.slot-item');
      pInput.value = slot.pokemon;
      pInput.addEventListener('input', e => {
        state.places[placeIdx].team[slotIdx].pokemon = e.target.value;
        // Mega Evolutions can only hold their one matching Mega Stone, so
        // picking one auto-fills (and overwrites) the item field with it.
        const stone = megaStoneFor(e.target.value);
        if (stone) {
          state.places[placeIdx].team[slotIdx].item = stone;
          iInput.value = stone;
        }
        scheduleRender();
      });

      iInput.value = slot.item;
      iInput.addEventListener('input', e => {
        state.places[placeIdx].team[slotIdx].item = e.target.value;
        scheduleRender();
      });

      slotsContainer.appendChild(slotNode);
    });

    container.appendChild(card);
  });
}

function rebuildFormFromState() {
  syncStaticFieldsFromState();
  buildPlacesEditor();
}

function wirePreviewZoom() {
  const range = document.getElementById('preview-zoom');
  const wrap = document.getElementById('preview-scale-wrap');
  const apply = () => {
    const scale = Number(range.value) / 100;
    document.getElementById('graphic').style.transform = `scale(${scale})`;
    wrap.style.width = `${2000 * scale}px`;
    wrap.style.height = `${1125 * scale}px`;
  };
  range.addEventListener('input', apply);
  apply();
}

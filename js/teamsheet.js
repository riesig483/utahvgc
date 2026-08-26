/**
 * Optional bring-your-own-key teamsheet photo scanning via the Claude API.
 *
 * This calls api.anthropic.com directly from the browser using the user's
 * own API key (pasted into Branding… -> saved only in this browser's
 * localStorage, see js/state.js `defaultSettings().claudeApiKey`). There is
 * no backend and no key of ours involved -- the request goes straight from
 * this page to Anthropic with the "direct browser access" opt-in header.
 *
 * Anthropic's own vision docs warn that Claude "might hallucinate or make
 * mistakes when interpreting low-quality, rotated, or very small images" --
 * so every extracted name is snapped onto this app's own scraped Champions
 * roster via findPokemon()/findItem() (js/sprites.js) before being used, and
 * anything Claude flagged low-confidence, or that didn't match a real
 * roster entry, is highlighted in the form for the organizer to check by
 * hand rather than trusted blindly. Nothing here auto-submits -- it only
 * pre-fills the same Pokémon/item fields the organizer would type into
 * anyway, exactly like typing a name in triggers findPokemon() already.
 */

const CLAUDE_MODEL = 'claude-opus-5';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

/** dataURL (or null) per placement index, populated by the file inputs below. */
const teamsheetPhotos = [null, null, null, null];

function resetTeamsheetPhotos() {
  for (let i = 0; i < teamsheetPhotos.length; i++) teamsheetPhotos[i] = null;
}

const TEAMSHEET_TOOL = {
  name: 'record_teamsheets',
  description:
    'Record the Pokemon and held items read off one or more Pokemon Champions teamsheet photos. ' +
    'Champions teams have up to 6 Pokemon each. There is no Tera type in Champions -- ignore any Tera type column/box entirely, it is not part of this data.',
  input_schema: {
    type: 'object',
    properties: {
      sheets: {
        type: 'array',
        description: 'One entry per teamsheet photo, in the same order the images were given.',
        items: {
          type: 'object',
          properties: {
            slots: {
              type: 'array',
              description: 'One entry per Pokemon listed on the sheet (up to 6), in the order written.',
              items: {
                type: 'object',
                properties: {
                  pokemon: { type: 'string', description: 'The Pokemon species/form name as best read. Empty string if the row is blank.' },
                  item: { type: 'string', description: 'The held item as best read, or empty string if blank/illegible.' },
                  confidence: { type: 'string', enum: ['high', 'low'], description: '"low" if handwriting/print was unclear, ambiguous, or guessed.' },
                },
                required: ['pokemon', 'item', 'confidence'],
              },
            },
          },
          required: ['slots'],
        },
      },
    },
    required: ['sheets'],
  },
};

function dataUrlToImageBlock(dataUrl) {
  const match = /^data:([^;]+);base64,([\s\S]*)$/.exec(dataUrl || '');
  if (!match) throw new Error('Not a valid image file.');
  return { type: 'image', source: { type: 'base64', media_type: match[1], data: match[2] } };
}

async function callClaudeTeamsheetScan(apiKey, entries) {
  const content = [];
  entries.forEach((entry, i) => {
    content.push({ type: 'text', text: `Image ${i + 1}: ${PLACE_LABELS[entry.placeIdx]} place team sheet.` });
    content.push(dataUrlToImageBlock(entry.dataUrl));
  });
  content.push({
    type: 'text',
    text: `Read each of the ${entries.length} teamsheet photo(s) above and call record_teamsheets with one "sheets" entry per image, in the same order as the images.`,
  });

  const res = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      tools: [TEAMSHEET_TOOL],
      tool_choice: { type: 'tool', name: 'record_teamsheets' },
      messages: [{ role: 'user', content }],
    }),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (body && body.error && body.error.message) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  const toolUse = (body.content || []).find(b => b.type === 'tool_use' && b.name === 'record_teamsheets');
  if (!toolUse) throw new Error('Claude did not return structured teamsheet data.');
  return toolUse.input.sheets || [];
}

/** Snap a Claude-read Pokemon name onto the app's own Champions roster where possible. */
function reconcilePokemon(raw) {
  const text = String(raw || '').trim();
  if (!text) return { value: '', matched: true };
  const p = findPokemon(text);
  return { value: p ? p.name : text, matched: !!p };
}

function reconcileItem(raw) {
  const text = String(raw || '').trim();
  if (!text) return { value: '', matched: true };
  const i = findItem(text);
  return { value: i ? i.name : text, matched: !!i };
}

/**
 * Writes one placement's scan results into `state` and its live form
 * inputs directly (rather than a full rebuildFormFromState()), so other
 * placements' not-yet-scanned photo attachments aren't wiped out.
 * Returns how many slots got flagged for a manual check.
 */
function applyTeamsheetResult(placeIdx, slots) {
  const card = document.querySelectorAll('.place-form-card')[placeIdx];
  if (!card) return 0;
  const slotNodes = card.querySelectorAll('.slot-form');
  let flagged = 0;

  slots.slice(0, 6).forEach((slot, slotIdx) => {
    const node = slotNodes[slotIdx];
    if (!node) return;
    const pField = reconcilePokemon(slot.pokemon);
    const iField = reconcileItem(slot.item);
    const lowConfidence = slot.confidence === 'low' || (pField.value && !pField.matched) || (iField.value && !iField.matched);
    if (lowConfidence) flagged++;

    state.places[placeIdx].team[slotIdx].pokemon = pField.value;
    state.places[placeIdx].team[slotIdx].item = iField.value;

    const pInput = node.querySelector('.slot-pokemon');
    const iInput = node.querySelector('.slot-item');
    pInput.value = pField.value;
    iInput.value = iField.value;
    pInput.classList.toggle('slot-low-confidence', lowConfidence);
    iInput.classList.toggle('slot-low-confidence', lowConfidence);

    // Same Mega Stone auto-fill rules as the manual form (js/form.js):
    // a Mega-form Pokemon reading forces its one matching stone, and --
    // since teamsheets often just say "Charizard" + "Charizardite X"
    // rather than writing out "Charizard (Mega X)" -- a stone reading
    // whose base species matches the Pokemon reading forces the Mega
    // form so the right sprite shows automatically either way.
    const stone = megaStoneFor(pField.value);
    if (stone) {
      state.places[placeIdx].team[slotIdx].item = stone;
      iInput.value = stone;
      iInput.classList.remove('slot-low-confidence');
    } else {
      const megaForm = megaFormForStone(iField.value);
      if (megaForm && pokemonSpeciesMatches(pField.value, megaForm)) {
        state.places[placeIdx].team[slotIdx].pokemon = megaForm;
        pInput.value = megaForm;
        pInput.classList.remove('slot-low-confidence');
      }
    }
  });

  return flagged;
}

function getClaudeApiKey() {
  const key = (settings.claudeApiKey || '').trim();
  if (!key) {
    alert('Add your Claude API key first: Branding… → Claude API key. Teamsheet scanning calls the Claude API directly from this browser using your own key.');
    return null;
  }
  return key;
}

async function scanTeamsheets(placeIndices) {
  const apiKey = getClaudeApiKey();
  if (!apiKey) return;

  const entries = placeIndices
    .filter(idx => teamsheetPhotos[idx])
    .map(idx => ({ placeIdx: idx, dataUrl: teamsheetPhotos[idx] }));
  if (!entries.length) {
    showToast('No teamsheet photos attached yet.');
    return;
  }

  const statusEls = document.querySelectorAll('.p-teamsheet-status');
  entries.forEach(e => { if (statusEls[e.placeIdx]) statusEls[e.placeIdx].textContent = 'Scanning…'; });

  const scanButtons = document.querySelectorAll('.p-teamsheet-scan');
  const batchBtn = document.getElementById('btn-scan-all-teamsheets');
  scanButtons.forEach(b => { b.disabled = true; });
  if (batchBtn) batchBtn.disabled = true;

  try {
    const sheets = await callClaudeTeamsheetScan(apiKey, entries);
    let totalFlagged = 0;
    entries.forEach((entry, i) => {
      const sheet = sheets[i];
      const statusEl = statusEls[entry.placeIdx];
      if (!sheet || !Array.isArray(sheet.slots)) {
        if (statusEl) statusEl.textContent = "Couldn't read this photo — check it by hand.";
        return;
      }
      const flagged = applyTeamsheetResult(entry.placeIdx, sheet.slots);
      totalFlagged += flagged;
      if (statusEl) {
        statusEl.textContent = flagged
          ? `Filled in — ${flagged} slot(s) flagged, double-check those.`
          : 'Filled in — looks clean.';
      }
    });
    scheduleRender();
    showToast(`Scanned ${entries.length} teamsheet(s)${totalFlagged ? ` — ${totalFlagged} slot(s) need a check` : ''}.`);
  } catch (err) {
    console.error(err);
    entries.forEach(e => {
      const statusEl = statusEls[e.placeIdx];
      if (statusEl) statusEl.textContent = `Scan failed: ${err.message || err}`;
    });
    alert(`Teamsheet scan failed: ${err.message || err}`);
  } finally {
    scanButtons.forEach(b => { b.disabled = false; });
    if (batchBtn) batchBtn.disabled = false;
  }
}

function wireTeamsheetInputs(card, placeIdx) {
  const fileInput = card.querySelector('.p-teamsheet-file');
  const statusEl = card.querySelector('.p-teamsheet-status');
  const scanBtn = card.querySelector('.p-teamsheet-scan');

  fileInput.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) {
      teamsheetPhotos[placeIdx] = null;
      statusEl.textContent = '';
      return;
    }
    teamsheetPhotos[placeIdx] = await fileToDataUrl(file);
    statusEl.textContent = 'Photo attached.';
  });

  scanBtn.addEventListener('click', () => scanTeamsheets([placeIdx]));
}

function wireTeamsheetBatch() {
  document.getElementById('btn-scan-all-teamsheets').addEventListener('click', () => {
    scanTeamsheets([0, 1, 2, 3]);
  });
}

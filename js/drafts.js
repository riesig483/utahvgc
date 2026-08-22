/** Drafts dialog: save/load/delete/duplicate + JSON import/export ("version control"). */

function draftLabel(s) {
  const type = TOURNEY_TYPES.find(t => t.id === s.tourneyType);
  const title = s.tourneyType === 'custom' ? (s.customTitle || 'Custom') : (type ? type.name : s.tourneyType);
  return `${title} — ${formatDateForGraphic(s.date) || 'no date'}`;
}

function renderDraftsList() {
  const ul = document.getElementById('list-drafts');
  const drafts = loadDrafts();
  ul.innerHTML = '';
  if (drafts.length === 0) {
    ul.innerHTML = '<li class="dlg-empty">No saved drafts yet.</li>';
    return;
  }
  for (const d of drafts.slice().sort((a, b) => b.savedAt - a.savedAt)) {
    const li = document.createElement('li');
    li.className = 'dlg-list-item';
    li.innerHTML = `
      <div class="dlg-list-main">
        <div class="dlg-list-title">${escapeHtml(d.name)}</div>
        <div class="dlg-list-sub">${escapeHtml(draftLabel(d.state))} &middot; saved ${new Date(d.savedAt).toLocaleString()}</div>
      </div>
      <div class="dlg-list-actions">
        <button class="btn btn-sm" data-act="load">Load</button>
        <button class="btn btn-sm" data-act="duplicate">Duplicate</button>
        <button class="btn btn-sm" data-act="export">Export JSON</button>
        <button class="btn btn-sm btn-danger" data-act="delete">Delete</button>
      </div>`;
    li.querySelector('[data-act="load"]').addEventListener('click', () => loadDraftIntoForm(d.id));
    li.querySelector('[data-act="duplicate"]').addEventListener('click', () => duplicateDraft(d.id));
    li.querySelector('[data-act="export"]').addEventListener('click', () => exportDraftJson(d));
    li.querySelector('[data-act="delete"]').addEventListener('click', () => deleteDraft(d.id));
    ul.appendChild(li);
  }
}

function renderHistoryList() {
  const ul = document.getElementById('list-history');
  const history = loadHistory();
  ul.innerHTML = '';
  if (history.length === 0) {
    ul.innerHTML = '<li class="dlg-empty">Nothing exported yet.</li>';
    return;
  }
  for (const h of history) {
    const li = document.createElement('li');
    li.className = 'dlg-list-item';
    li.innerHTML = `
      <div class="dlg-list-main">
        <div class="dlg-list-title">${escapeHtml(draftLabel(h.state))}</div>
        <div class="dlg-list-sub">exported ${new Date(h.exportedAt).toLocaleString()} &middot; ${escapeHtml(h.filename)}</div>
      </div>
      <div class="dlg-list-actions">
        <button class="btn btn-sm" data-act="reopen">Reopen &amp; edit</button>
      </div>`;
    li.querySelector('[data-act="reopen"]').addEventListener('click', () => {
      state = deepClone(h.state);
      rebuildFormFromState();
      scheduleRender();
      document.getElementById('dlg-drafts').close();
      showToast('Reopened export for editing');
    });
    ul.appendChild(li);
  }
}

function saveCurrentAsNewDraft() {
  const suggested = draftLabel(state);
  const name = prompt('Name this draft:', suggested);
  if (name === null) return;
  const drafts = loadDrafts();
  drafts.push({ id: uid(), name: name || suggested, state: deepClone(state), savedAt: Date.now() });
  saveDrafts(drafts);
  renderDraftsList();
  showToast('Draft saved');
}

function loadDraftIntoForm(id) {
  const drafts = loadDrafts();
  const d = drafts.find(x => x.id === id);
  if (!d) return;
  state = deepClone(d.state);
  rebuildFormFromState();
  scheduleRender();
  document.getElementById('dlg-drafts').close();
  showToast(`Loaded "${d.name}"`);
}

function duplicateDraft(id) {
  const drafts = loadDrafts();
  const d = drafts.find(x => x.id === id);
  if (!d) return;
  drafts.push({ id: uid(), name: d.name + ' (copy)', state: deepClone(d.state), savedAt: Date.now() });
  saveDrafts(drafts);
  renderDraftsList();
}

function deleteDraft(id) {
  if (!confirm('Delete this draft? This cannot be undone.')) return;
  const drafts = loadDrafts().filter(x => x.id !== id);
  saveDrafts(drafts);
  renderDraftsList();
}

function exportDraftJson(draft) {
  const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `${slugifyFilename(draft.name)}.json`);
}

function slugifyFilename(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'draft';
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function importDraftJsonFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const importedState = parsed.state || parsed; // accept a bare state export too
      const drafts = loadDrafts();
      drafts.push({
        id: uid(),
        name: (parsed.name || 'Imported draft'),
        state: Object.assign(defaultState(), importedState),
        savedAt: Date.now(),
      });
      saveDrafts(drafts);
      renderDraftsList();
      showToast('Draft imported');
    } catch (e) {
      alert('That file is not a valid draft JSON export.');
      console.error(e);
    }
  };
  reader.readAsText(file);
}

let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2500);
}

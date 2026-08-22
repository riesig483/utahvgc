/** App bootstrap: wires everything together once the DOM is ready. */

function wireDraftsDialog() {
  const dlg = document.getElementById('dlg-drafts');
  document.getElementById('btn-drafts').addEventListener('click', () => {
    renderDraftsList();
    renderHistoryList();
    dlg.showModal();
  });
  document.getElementById('btn-close-drafts').addEventListener('click', () => dlg.close());
  document.getElementById('btn-save-draft').addEventListener('click', saveCurrentAsNewDraft);

  document.getElementById('btn-import-json').addEventListener('click', () => {
    document.getElementById('file-import-json').click();
  });
  document.getElementById('file-import-json').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) importDraftJsonFile(file);
    e.target.value = '';
  });

  dlg.querySelectorAll('.dlg-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      dlg.querySelectorAll('.dlg-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      dlg.querySelectorAll('.dlg-tab-panel').forEach(p => {
        p.hidden = p.dataset.panel !== tab.dataset.tab;
      });
    });
  });
}

function wireNewButton() {
  document.getElementById('btn-new').addEventListener('click', () => {
    if (!confirm('Start a new graphic? Unsaved changes to the current one will be lost (save a draft first if you want to keep it).')) return;
    state = defaultState();
    rebuildFormFromState();
    scheduleRender();
  });
}

function init() {
  populateDatalists();
  populateTourneyTypeSelects();
  populateStoreSelects();
  rebuildFormFromState();
  wireStaticFields();
  wirePreviewZoom();
  wireDraftsDialog();
  wireSettingsDialog();
  wireExportDialog();
  wireNewButton();
  renderGraphic(state, settings);
}

document.addEventListener('DOMContentLoaded', init);

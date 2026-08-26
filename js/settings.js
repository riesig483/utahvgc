/** Branding dialog: upload logos/background, edit constant contact info + credits. */

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function wireSettingsDialog() {
  const dlg = document.getElementById('dlg-settings');

  document.getElementById('btn-settings').addEventListener('click', () => {
    syncSettingsFormFromSettings();
    dlg.showModal();
  });
  document.getElementById('btn-close-settings').addEventListener('click', () => dlg.close());

  document.getElementById('up-background').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    settings.background = await fileToDataUrl(file);
    persistSettingsAndRender();
  });
  document.getElementById('up-org-logo').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    settings.orgLogo = await fileToDataUrl(file);
    persistSettingsAndRender();
  });
  document.getElementById('up-tourney-logo').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    const typeId = document.getElementById('settings-tourney-type-select').value;
    settings.tourneyLogos[typeId] = await fileToDataUrl(file);
    persistSettingsAndRender();
  });
  document.getElementById('up-store-logo').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    const storeId = document.getElementById('settings-store-select').value;
    settings.storeLogos[storeId] = await fileToDataUrl(file);
    persistSettingsAndRender();
  });

  dlg.querySelectorAll('[data-clear]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.clear;
      if (target === 'background') settings.background = null;
      if (target === 'orgLogo') settings.orgLogo = null;
      if (target === 'tourneyLogo') {
        delete settings.tourneyLogos[document.getElementById('settings-tourney-type-select').value];
      }
      if (target === 'storeLogo') {
        delete settings.storeLogos[document.getElementById('settings-store-select').value];
      }
      persistSettingsAndRender();
    });
  });

  document.getElementById('btn-add-store').addEventListener('click', () => {
    const input = document.getElementById('new-store-name');
    const name = input.value.trim();
    if (!name) return;
    settings.stores.push({ id: uid(), name });
    input.value = '';
    populateStoreSelects();
    persistSettingsAndRender();
  });

  for (const [fieldId, key] of [
    ['s-twitter', 'twitter'], ['s-website', 'website'], ['s-email', 'email'],
    ['s-credit1', 'credit1'], ['s-credit2', 'credit2'],
    ['s-claude-api-key', 'claudeApiKey'],
  ]) {
    document.getElementById(fieldId).addEventListener('input', e => {
      settings[key] = e.target.value;
      persistSettingsAndRender();
    });
  }
}

function persistSettingsAndRender() {
  saveSettings(settings);
  renderGraphic(state, settings);
}

function syncSettingsFormFromSettings() {
  document.getElementById('s-twitter').value = settings.twitter;
  document.getElementById('s-website').value = settings.website;
  document.getElementById('s-email').value = settings.email;
  document.getElementById('s-credit1').value = settings.credit1;
  document.getElementById('s-credit2').value = settings.credit2;
  document.getElementById('s-claude-api-key').value = settings.claudeApiKey || '';
}

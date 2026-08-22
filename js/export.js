/** PNG export via the vendored html2canvas, at a chosen resolution multiplier. */

function wireExportDialog() {
  const dlg = document.getElementById('dlg-export');
  document.getElementById('btn-export').addEventListener('click', () => {
    document.getElementById('export-status').textContent = '';
    dlg.showModal();
  });
  document.getElementById('btn-cancel-export').addEventListener('click', () => dlg.close());
  document.getElementById('btn-run-export').addEventListener('click', runExport);
}

async function runExport() {
  const status = document.getElementById('export-status');
  const runBtn = document.getElementById('btn-run-export');
  const scale = Number(document.getElementById('export-scale').value) || 2;
  const graphic = document.getElementById('graphic');

  runBtn.disabled = true;
  status.textContent = 'Rendering… this can take a few seconds at higher resolutions.';

  // The preview is visually shrunk with a CSS transform; capture the graphic
  // at its true 2000x1125 layout size, not the shrunk-down screen size.
  const previousTransform = graphic.style.transform;
  graphic.style.transform = 'none';

  try {
    const canvas = await html2canvas(graphic, {
      scale,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: false,
      logging: false,
      width: 2000,
      height: 1125,
    });

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
    if (!blob) throw new Error('Canvas produced no image data.');

    const filename = `${slugifyFilename(draftLabel(state))}-${Date.now()}.png`;
    downloadBlob(blob, filename);

    pushHistory({ state: deepClone(state), exportedAt: Date.now(), filename });

    status.textContent = 'Downloaded! Saved to your export history too.';
    setTimeout(() => document.getElementById('dlg-export').close(), 900);
  } catch (err) {
    console.error(err);
    status.textContent =
      'Export failed — this is usually a sprite image blocking canvas export (CORS). ' +
      'Try again, or swap the offending Pokémon/item entry for a direct image URL. ' +
      `(${err.message || err})`;
  } finally {
    graphic.style.transform = previousTransform;
    runBtn.disabled = false;
  }
}

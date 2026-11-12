// ---------------------------------------------------------------------------
// backup.js — Exportar e importar los datos como archivo .json.
//
// Es importante porque los datos viven solo en el teléfono: si borras los
// datos de Safari o pasas mucho tiempo sin abrir la app, podrían perderse.
// ---------------------------------------------------------------------------

import { $, el, setupSheet } from './dom.js';
import { isValidTransaction } from '../models/transaction.js';
import { todayISO } from '../utils/dates.js';

export function createBackup({ getTransactions, onImport }) {
  const dialog = $('#backup-dialog');
  const status = $('#backup-status');
  const fileInput = $('#import-file');

  setupSheet(dialog);

  async function exportBackup() {
    const transactions = getTransactions();
    const content = JSON.stringify(
      { app: 'finanzas', version: 1, exportedAt: new Date().toISOString(), transactions },
      null,
      2
    );
    const filename = `finanzas-${todayISO()}.json`;
    const file = new File([content], filename, { type: 'application/json' });

    // En el iPhone abrimos el menú de compartir (Guardar en Archivos, AirDrop…).
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch (error) {
        if (error.name === 'AbortError') return; // el usuario canceló
      }
    }

    // En la computadora (o si compartir falla) lo descargamos como archivo.
    const url = URL.createObjectURL(file);
    el('a', { href: url, download: filename }).click();
    URL.revokeObjectURL(url);
    status.textContent = `Se exportaron ${transactions.length} movimientos.`;
  }

  async function importBackup(file) {
    try {
      const data = JSON.parse(await file.text());
      const list = Array.isArray(data.transactions) ? data.transactions : [];
      const valid = list.filter(isValidTransaction);
      const added = onImport(valid);

      status.textContent =
        added > 0
          ? `Se agregaron ${added} movimientos.`
          : 'El respaldo no tenía movimientos nuevos.';
    } catch {
      status.textContent = 'Ese archivo no es un respaldo válido.';
    }
  }

  $('#export-backup').addEventListener('click', exportBackup);
  $('#import-backup').addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    const [file] = fileInput.files;
    if (file) importBackup(file);
    fileInput.value = ''; // permite volver a elegir el mismo archivo
  });

  return {
    open() {
      status.textContent = '';
      dialog.showModal();
    }
  };
}

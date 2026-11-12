// ---------------------------------------------------------------------------
// app.js — Punto de entrada. Aquí se conectan todas las piezas.
//
// Si quieres entender la app, empieza por este archivo: es corto y te muestra
// quién habla con quién.
// ---------------------------------------------------------------------------

import { store } from './store.js';
import { byMonth, groupByDay, totals } from './selectors.js';
import { formatMonth, shiftMonth } from './utils/dates.js';
import { $ } from './ui/dom.js';
import { renderSummary } from './ui/summary.js';
import { renderTransactionList } from './ui/transactionList.js';
import { createTransactionForm } from './ui/transactionForm.js';
import { createBackup } from './ui/backup.js';

// 1. Cargar los datos guardados.
store.init();

// 2. Preparar las hojas (formulario y respaldo), diciéndoles qué hacer
//    cuando el usuario confirma una acción.
const form = createTransactionForm({
  onSave(fields, editingId) {
    if (editingId) store.updateTransaction(editingId, fields);
    else store.addTransaction(fields);
  },
  onDelete(id) {
    store.deleteTransaction(id);
  }
});

const backup = createBackup({
  getTransactions: () => store.getState().transactions,
  onImport: (transactions) => store.mergeTransactions(transactions)
});

// 3. Dibujar la pantalla a partir del estado.
//    Esta función se ejecuta completa cada vez que algo cambia. Es simple a
//    propósito: no hay que pensar "qué parte actualizo", siempre se redibuja todo.
function render(state) {
  const monthTransactions = byMonth(state.transactions, state.selectedMonth);

  $('#month-label').textContent = formatMonth(state.selectedMonth);

  renderSummary($('#summary'), {
    balance: totals(state.transactions).net, // saldo de toda la historia
    month: totals(monthTransactions)         // totales solo del mes visible
  });

  renderTransactionList($('#transaction-list'), groupByDay(monthTransactions), {
    onSelect: form.openEdit
  });
}

store.subscribe(render);  // redibujar en cada cambio
render(store.getState()); // primer dibujo

// 4. Botones de la pantalla principal.
$('#open-form').addEventListener('click', form.openNew);
$('#open-backup').addEventListener('click', backup.open);
$('#prev-month').addEventListener('click', () => {
  store.setMonth(shiftMonth(store.getState().selectedMonth, -1));
});
$('#next-month').addEventListener('click', () => {
  store.setMonth(shiftMonth(store.getState().selectedMonth, 1));
});

// 5. Service worker: hace que la app funcione sin internet.
//    En tu computadora (localhost) lo dejamos apagado para que al programar
//    siempre veas tus cambios al recargar.
const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
if ('serviceWorker' in navigator && !isLocal) {
  navigator.serviceWorker.register('./sw.js').catch((error) => {
    console.error('No se pudo registrar el service worker:', error);
  });
}

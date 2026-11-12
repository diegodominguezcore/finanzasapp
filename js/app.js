// ---------------------------------------------------------------------------
// app.js — Punto de entrada. Aquí se conectan todas las piezas.
//
// Si quieres entender la app, empieza por este archivo: te muestra quién
// habla con quién. Tiene cuatro partes:
//   1. Cargar los datos
//   2. Preparar las hojas (formularios) y decirles qué hacer al confirmar
//   3. render(): dibujar la pantalla a partir del estado
//   4. Conectar los botones fijos de la pantalla
// ---------------------------------------------------------------------------

import { store } from './store.js';
import { GOAL_TEXT } from './config.js';
import { byMonth, dailyExpenses, expensesByCategory, groupByDay, totals } from './selectors.js';
import { formatMonth, shiftMonth } from './utils/dates.js';
import { $, $$ } from './ui/dom.js';
import { renderSummary } from './ui/summary.js';
import { renderTransactionList } from './ui/transactionList.js';
import { renderDashboard } from './ui/dashboard.js';
import { renderGoals } from './ui/goals.js';
import { createTransactionForm } from './ui/transactionForm.js';
import { createEntryForm, createGoalForm } from './ui/goalForm.js';
import { createBackup } from './ui/backup.js';
import { showToast } from './ui/toast.js';

// 1. Cargar los datos guardados.
store.init();

// 2. Preparar las hojas. Cada una recibe funciones que dicen qué hacer
//    cuando el usuario confirma; así los formularios no dependen del store.
const transactionForm = createTransactionForm({
  onSave(fields, editingId) {
    if (editingId) store.updateTransaction(editingId, fields);
    else store.addTransaction(fields);
  },
  onDelete(id) {
    const removed = store.deleteTransaction(id);
    showToast('Movimiento eliminado', {
      actionLabel: 'Deshacer',
      onAction: () => store.restoreTransaction(removed)
    });
  }
});

const goalForm = createGoalForm({
  onSave(fields, editingId) {
    if (editingId) store.updateGoal(editingId, fields);
    else store.addGoal(fields);
  },
  onDelete(id) {
    const removed = store.deleteGoal(id);
    showToast(GOAL_TEXT[removed.kind].deleted, {
      actionLabel: 'Deshacer',
      onAction: () => store.restoreGoal(removed)
    });
  },
  onDeleteEntry: (goalId, entryId) => store.deleteGoalEntry(goalId, entryId)
});

const entryForm = createEntryForm({
  onSave: (goalId, fields) => store.addGoalEntry(goalId, fields)
});

const backup = createBackup({
  getData: () => store.getState(),
  onImport: (data) => store.mergeData(data)
});

// 3. Dibujar la pantalla a partir del estado.
//    Se ejecuta completa cada vez que algo cambia. Es simple a propósito: no
//    hay que pensar "qué parte actualizo"; se redibuja la pestaña visible.
function render(state) {
  const { view, selectedMonth, transactions, goals } = state;

  // Mostrar solo la pestaña activa y marcar su botón.
  for (const panel of $$('[data-view]')) panel.hidden = panel.dataset.view !== view;
  for (const tab of $$('[data-tab]')) {
    if (tab.dataset.tab === view) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }

  // Las metas no dependen del mes: ahí se muestra un título en vez del selector.
  $('#month-nav').hidden = view === 'goals';
  $('#view-title').hidden = view !== 'goals';
  $('#open-form').hidden = view !== 'home';
  $('#month-label').textContent = formatMonth(selectedMonth);

  const monthTransactions = byMonth(transactions, selectedMonth);

  if (view === 'home') {
    renderSummary($('#summary'), {
      balance: totals(transactions).net, // saldo de toda la historia
      month: totals(monthTransactions)   // totales solo del mes visible
    });
    renderTransactionList($('#transaction-list'), groupByDay(monthTransactions), {
      onSelect: transactionForm.openEdit
    });
  }

  if (view === 'dashboard') {
    const previousMonth = byMonth(transactions, shiftMonth(selectedMonth, -1));
    renderDashboard($('#dashboard'), {
      monthKey: selectedMonth,
      month: totals(monthTransactions),
      previousExpense: totals(previousMonth).expense,
      categories: expensesByCategory(monthTransactions),
      days: dailyExpenses(monthTransactions, selectedMonth)
    });
  }

  if (view === 'goals') {
    renderGoals($('#goals'), goals, {
      onNew: goalForm.openNew,
      onEdit: goalForm.openEdit,
      onEntry: entryForm.open
    });
  }
}

store.subscribe(render);  // redibujar en cada cambio
render(store.getState()); // primer dibujo

// 4. Botones fijos de la pantalla.
$('#open-form').addEventListener('click', transactionForm.openNew);
$('#open-backup').addEventListener('click', backup.open);
$('#prev-month').addEventListener('click', () => {
  store.setMonth(shiftMonth(store.getState().selectedMonth, -1));
});
$('#next-month').addEventListener('click', () => {
  store.setMonth(shiftMonth(store.getState().selectedMonth, 1));
});
for (const tab of $$('[data-tab]')) {
  tab.addEventListener('click', () => {
    store.setView(tab.dataset.tab);
    window.scrollTo(0, 0); // cada pestaña empieza desde arriba
  });
}

// 5. Service worker: hace que la app funcione sin internet.
//    En tu computadora (localhost) lo dejamos apagado para que al programar
//    siempre veas tus cambios al recargar.
const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
if ('serviceWorker' in navigator && !isLocal) {
  navigator.serviceWorker.register('./sw.js').catch((error) => {
    console.error('No se pudo registrar el service worker:', error);
  });
}

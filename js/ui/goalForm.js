// ---------------------------------------------------------------------------
// goalForm.js — Dos hojas relacionadas con las metas:
//   1. createGoalForm:  crear / editar una meta (y ver o quitar sus abonos)
//   2. createEntryForm: registrar un aporte (ahorro) o abono (deuda)
//
// Igual que transactionForm.js, no guardan nada por su cuenta: avisan a
// app.js mediante las funciones on… que reciben.
// ---------------------------------------------------------------------------

import { $, el, setupSheet } from './dom.js';
import { GOAL_TEXT } from '../config.js';
import { buildEntry, buildGoal } from '../models/goal.js';
import { goalProgress } from '../selectors.js';
import { formatMoney } from '../utils/money.js';
import { formatDayShort, todayISO } from '../utils/dates.js';

export function createGoalForm({ onSave, onDelete, onDeleteEntry }) {
  const dialog = $('#goal-dialog');
  const form = $('#goal-form');
  const errorBox = $('#goal-form-error');
  const deleteButton = $('#delete-goal');
  const historySection = $('#goal-history-section');
  const historyList = $('#goal-history');

  let editingId = null; // null = creando; con valor = editando esa meta
  let kind = null;      // 'saving' o 'debt'

  setupSheet(dialog);

  /** Lista de aportes / abonos de la meta, del más reciente al más antiguo. */
  function renderHistory(goal) {
    const entries = [...(goal?.entries ?? [])].sort((a, b) => b.date.localeCompare(a.date));
    historySection.hidden = entries.length === 0;

    historyList.replaceChildren(
      ...entries.map((entry) => {
        const item = el('li', {}, [
          el('span', { class: 'history__date', text: formatDayShort(entry.date) }),
          el('span', { class: 'history__amount num', text: formatMoney(entry.amount) })
        ]);

        item.append(
          el('button', {
            class: 'icon-btn',
            type: 'button',
            'aria-label': 'Quitar',
            text: '✕',
            onClick() {
              onDeleteEntry(goal.id, entry.id);
              item.remove();
              historySection.hidden = historyList.children.length === 0;
            }
          })
        );
        return item;
      })
    );
  }

  function open(goalKind, goal = null) {
    kind = goalKind;
    editingId = goal?.id ?? null;
    const text = GOAL_TEXT[kind];

    form.reset();
    form.elements.name.value = goal?.name ?? '';
    form.elements.name.placeholder = text.namePlaceholder;
    form.elements.target.value = goal ? (goal.target / 100).toFixed(2) : '';

    $('#goal-form-title').textContent = goal ? text.editTitle : text.newTitle;
    $('#goal-target-label').textContent = text.targetLabel;
    $('#goal-history-title').textContent = text.historyTitle;
    renderHistory(goal);

    deleteButton.hidden = !goal;
    errorBox.hidden = true;
    dialog.showModal();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const raw = Object.fromEntries(new FormData(form));
    const result = buildGoal({ ...raw, kind });

    if (!result.ok) {
      errorBox.textContent = result.error;
      errorBox.hidden = false;
      return;
    }

    onSave(result.value, editingId);
    dialog.close();
  });

  deleteButton.addEventListener('click', () => {
    if (editingId) onDelete(editingId);
    dialog.close();
  });

  return {
    openNew: (goalKind) => open(goalKind),
    openEdit: (goal) => open(goal.kind, goal)
  };
}

export function createEntryForm({ onSave }) {
  const dialog = $('#entry-dialog');
  const form = $('#entry-form');
  const errorBox = $('#entry-form-error');

  let goalId = null;

  setupSheet(dialog);

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const result = buildEntry(Object.fromEntries(new FormData(form)));

    if (!result.ok) {
      errorBox.textContent = result.error;
      errorBox.hidden = false;
      return;
    }

    onSave(goalId, result.value);
    dialog.close();
  });

  return {
    open(goal) {
      goalId = goal.id;
      const text = GOAL_TEXT[goal.kind];

      form.reset();
      form.elements.date.value = todayISO();
      $('#entry-form-title').textContent = `${text.entryTitle} ${goal.name}`;
      $('#entry-hint').textContent = `${text.remaining} ${formatMoney(goalProgress(goal).remaining)}`;
      errorBox.hidden = true;

      dialog.showModal();
    }
  };
}

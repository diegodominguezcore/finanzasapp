// ---------------------------------------------------------------------------
// transactionForm.js — Controla la hoja para crear o editar un movimiento.
//
// Este archivo NO guarda nada por su cuenta. Cuando el usuario toca Guardar o
// Eliminar, llama a las funciones que recibió (onSave / onDelete) y app.js
// decide qué hacer. Así el formulario no depende del store.
// ---------------------------------------------------------------------------

import { $, el, setupSheet } from './dom.js';
import { CATEGORIES, TYPES } from '../config.js';
import { buildTransaction } from '../models/transaction.js';
import { todayISO } from '../utils/dates.js';

export function createTransactionForm({ onSave, onDelete }) {
  const dialog = $('#transaction-dialog');
  const form = $('#transaction-form');
  const title = $('#form-title');
  const chips = $('#category-chips');
  const errorBox = $('#form-error');
  const deleteButton = $('#delete-transaction');

  let editingId = null; // null = creando uno nuevo; con valor = editando ese id

  setupSheet(dialog);

  /** Dibuja las categorías del tipo elegido y marca una. */
  function renderCategories(type, selectedId) {
    const options = CATEGORIES[type];
    const isKnown = options.some((category) => category.id === selectedId);
    const checkedId = isKnown ? selectedId : options[0].id;

    chips.replaceChildren(
      ...options.map((category) => {
        const input = el('input', { type: 'radio', name: 'category', value: category.id });
        input.checked = category.id === checkedId;
        return el('label', {}, [input, el('span', { text: `${category.icon} ${category.label}` })]);
      })
    );
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  function open(transaction = null) {
    editingId = transaction?.id ?? null;
    const type = transaction?.type ?? TYPES.EXPENSE;

    form.reset();
    form.elements.type.value = type;
    form.elements.amount.value = transaction ? (transaction.amount / 100).toFixed(2) : '';
    form.elements.description.value = transaction?.description ?? '';
    form.elements.date.value = transaction?.date ?? todayISO();
    renderCategories(type, transaction?.category);

    title.textContent = transaction ? 'Editar movimiento' : 'Nuevo movimiento';
    deleteButton.hidden = !transaction;
    errorBox.hidden = true;

    dialog.showModal();
  }

  // Al cambiar entre Gasto / Ingreso, cambian las categorías disponibles.
  form.addEventListener('change', (event) => {
    if (event.target.name === 'type') renderCategories(event.target.value, null);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault(); // evita que el navegador recargue la página

    // FormData lee todos los campos del formulario por su atributo "name".
    const raw = Object.fromEntries(new FormData(form));
    const result = buildTransaction(raw);

    if (!result.ok) {
      showError(result.error);
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
    openNew: () => open(),
    openEdit: (transaction) => open(transaction)
  };
}

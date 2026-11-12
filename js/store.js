// ---------------------------------------------------------------------------
// store.js — El "estado" de la app: la única fuente de verdad.
//
// Idea central (la misma que usan React, Redux, etc.):
//   1. Los datos viven en UN solo lugar (state).
//   2. Nadie los modifica directamente: se usan las funciones de abajo.
//   3. Cada vez que cambian, se avisa a quien esté "suscrito" para que
//      vuelva a dibujar la pantalla.
//
//   usuario toca algo → store.addTransaction() → cambia state → se guarda
//                     → se avisa a los suscriptores → la pantalla se redibuja
// ---------------------------------------------------------------------------

import { loadTransactions, saveTransactions } from './storage.js';
import { currentMonthKey, monthKeyOf } from './utils/dates.js';

let state = {
  transactions: [],
  selectedMonth: currentMonthKey()
};

const listeners = new Set();

function notify() {
  for (const listener of listeners) listener(state);
}

/** Cambia la lista de movimientos, la guarda y avisa. */
function commitTransactions(transactions, extra = {}) {
  // Creamos un objeto NUEVO en vez de modificar el anterior (inmutabilidad).
  state = { ...state, ...extra, transactions };
  saveTransactions(transactions);
  notify();
}

function createId() {
  // randomUUID solo existe en páginas seguras (https o localhost).
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const store = {
  /** Carga los datos guardados. Se llama una sola vez al abrir la app. */
  init() {
    state = { ...state, transactions: loadTransactions() };
  },

  getState() {
    return state;
  },

  /** Registra una función que se ejecuta en cada cambio. Devuelve cómo cancelarla. */
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  addTransaction(fields) {
    const transaction = { ...fields, id: createId(), createdAt: Date.now() };
    // Saltamos al mes del movimiento para que el usuario lo vea aparecer.
    commitTransactions([...state.transactions, transaction], {
      selectedMonth: monthKeyOf(transaction.date)
    });
  },

  updateTransaction(id, fields) {
    const transactions = state.transactions.map((transaction) =>
      transaction.id === id ? { ...transaction, ...fields } : transaction
    );
    commitTransactions(transactions, { selectedMonth: monthKeyOf(fields.date) });
  },

  deleteTransaction(id) {
    commitTransactions(state.transactions.filter((transaction) => transaction.id !== id));
  },

  /** Agrega movimientos de un respaldo sin duplicar. Devuelve cuántos agregó. */
  mergeTransactions(incoming) {
    const existingIds = new Set(state.transactions.map((transaction) => transaction.id));
    const fresh = incoming.filter((transaction) => !existingIds.has(transaction.id));
    if (fresh.length > 0) commitTransactions([...state.transactions, ...fresh]);
    return fresh.length;
  },

  setMonth(monthKey) {
    state = { ...state, selectedMonth: monthKey };
    notify();
  }
};

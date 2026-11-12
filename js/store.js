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

import { loadData, saveData } from './storage.js';
import { currentMonthKey, monthKeyOf } from './utils/dates.js';

let state = {
  transactions: [],               // ingresos y gastos
  goals: [],                      // metas de ahorro y deudas
  selectedMonth: currentMonthKey(),
  view: 'home'                    // pestaña visible: 'home' | 'dashboard' | 'goals'
};

const listeners = new Set();

/**
 * Único lugar donde cambia el estado. Crea un objeto NUEVO en vez de
 * modificar el anterior (inmutabilidad), lo guarda si hace falta y avisa.
 */
function setState(patch, { persist = false } = {}) {
  state = { ...state, ...patch };
  if (persist) saveData({ transactions: state.transactions, goals: state.goals });
  for (const listener of listeners) listener(state);
}

function createId() {
  // randomUUID solo existe en páginas seguras (https o localhost).
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Devuelve la lista de metas con UNA meta transformada por la función dada. */
function mapGoal(goalId, transform) {
  return state.goals.map((goal) => (goal.id === goalId ? transform(goal) : goal));
}

export const store = {
  /** Carga los datos guardados. Se llama una sola vez al abrir la app. */
  init() {
    state = { ...state, ...loadData() };
  },

  getState() {
    return state;
  },

  /** Registra una función que se ejecuta en cada cambio. Devuelve cómo cancelarla. */
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  // --- Navegación (no se guarda: al abrir la app siempre empieza igual) -----

  setMonth(monthKey) {
    setState({ selectedMonth: monthKey });
  },

  setView(view) {
    setState({ view });
  },

  // --- Movimientos ----------------------------------------------------------

  addTransaction(fields) {
    const transaction = { ...fields, id: createId(), createdAt: Date.now() };
    // Saltamos al mes del movimiento para que el usuario lo vea aparecer.
    setState(
      { transactions: [...state.transactions, transaction], selectedMonth: monthKeyOf(transaction.date) },
      { persist: true }
    );
  },

  updateTransaction(id, fields) {
    const transactions = state.transactions.map((transaction) =>
      transaction.id === id ? { ...transaction, ...fields } : transaction
    );
    setState({ transactions, selectedMonth: monthKeyOf(fields.date) }, { persist: true });
  },

  /** Elimina y DEVUELVE el movimiento eliminado, para poder deshacer. */
  deleteTransaction(id) {
    const removed = state.transactions.find((transaction) => transaction.id === id);
    setState(
      { transactions: state.transactions.filter((transaction) => transaction.id !== id) },
      { persist: true }
    );
    return removed;
  },

  /** Vuelve a poner un movimiento eliminado (botón "Deshacer"). */
  restoreTransaction(transaction) {
    const alreadyThere = state.transactions.some((item) => item.id === transaction.id);
    if (alreadyThere) return;
    setState({ transactions: [...state.transactions, transaction] }, { persist: true });
  },

  // --- Metas: ahorro y deudas ----------------------------------------------

  addGoal(fields) {
    const goal = { ...fields, id: createId(), entries: [], createdAt: Date.now() };
    setState({ goals: [...state.goals, goal] }, { persist: true });
  },

  updateGoal(id, fields) {
    setState({ goals: mapGoal(id, (goal) => ({ ...goal, ...fields })) }, { persist: true });
  },

  deleteGoal(id) {
    const removed = state.goals.find((goal) => goal.id === id);
    setState({ goals: state.goals.filter((goal) => goal.id !== id) }, { persist: true });
    return removed;
  },

  restoreGoal(goal) {
    if (state.goals.some((item) => item.id === goal.id)) return;
    setState({ goals: [...state.goals, goal] }, { persist: true });
  },

  /** Agrega un aporte (ahorro) o abono (deuda) a una meta. */
  addGoalEntry(goalId, fields) {
    const entry = { ...fields, id: createId() };
    const goals = mapGoal(goalId, (goal) => ({ ...goal, entries: [...goal.entries, entry] }));
    setState({ goals }, { persist: true });
  },

  deleteGoalEntry(goalId, entryId) {
    const goals = mapGoal(goalId, (goal) => ({
      ...goal,
      entries: goal.entries.filter((entry) => entry.id !== entryId)
    }));
    setState({ goals }, { persist: true });
  },

  // --- Respaldo -------------------------------------------------------------

  /** Agrega lo que venga en un respaldo sin duplicar. Devuelve cuántos registros agregó. */
  mergeData({ transactions = [], goals = [] }) {
    const knownIds = new Set([...state.transactions, ...state.goals].map((item) => item.id));
    const newTransactions = transactions.filter((item) => !knownIds.has(item.id));
    const newGoals = goals.filter((item) => !knownIds.has(item.id));
    const added = newTransactions.length + newGoals.length;

    if (added > 0) {
      setState(
        {
          transactions: [...state.transactions, ...newTransactions],
          goals: [...state.goals, ...newGoals]
        },
        { persist: true }
      );
    }
    return added;
  }
};

// ---------------------------------------------------------------------------
// selectors.js — Cálculos sobre los movimientos.
//
// Todas son "funciones puras": reciben datos, devuelven un resultado y no
// modifican nada ni tocan la pantalla. Por eso son fáciles de probar
// (ver la carpeta tests/).
// ---------------------------------------------------------------------------

import { TYPES } from './config.js';
import { daysInMonth, monthKeyOf } from './utils/dates.js';

/** Solo los movimientos de un mes ("2026-11"). */
export function byMonth(transactions, monthKey) {
  return transactions.filter((transaction) => monthKeyOf(transaction.date) === monthKey);
}

/** Suma ingresos y gastos. Devuelve { income, expense, net } en centavos. */
export function totals(transactions) {
  let income = 0;
  let expense = 0;

  for (const transaction of transactions) {
    if (transaction.type === TYPES.INCOME) income += transaction.amount;
    else expense += transaction.amount;
  }

  return { income, expense, net: income - expense };
}

/**
 * Agrupa por día, del más reciente al más antiguo:
 *   [{ date: "2026-11-12", items: [...], net: -5000 }, ...]
 */
export function groupByDay(transactions) {
  const groups = new Map(); // fecha → lista de movimientos de ese día

  for (const transaction of transactions) {
    if (!groups.has(transaction.date)) groups.set(transaction.date, []);
    groups.get(transaction.date).push(transaction);
  }

  return [...groups.entries()]
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .map(([date, items]) => ({
      date,
      items: items.sort((a, b) => b.createdAt - a.createdAt),
      net: totals(items).net
    }));
}

// ---------------------------------------------------------------------------
// Cálculos para la pantalla de Resumen
// ---------------------------------------------------------------------------

/**
 * Gastos sumados por categoría, del mayor al menor:
 *   [{ category: "food", total: 3550, share: 0.71 }, ...]
 * "share" es la parte del total (0.71 = 71 %).
 */
export function expensesByCategory(transactions) {
  const sums = new Map(); // id de categoría → total en centavos
  let grandTotal = 0;

  for (const transaction of transactions) {
    if (transaction.type !== TYPES.EXPENSE) continue;
    sums.set(transaction.category, (sums.get(transaction.category) ?? 0) + transaction.amount);
    grandTotal += transaction.amount;
  }

  return [...sums.entries()]
    .map(([category, total]) => ({ category, total, share: total / grandTotal }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Gasto de cada día del mes, incluyendo los días en cero:
 *   [{ date: "2026-11-01", day: 1, total: 0 }, { date: "2026-11-02", day: 2, total: 4500 }, ...]
 */
export function dailyExpenses(transactions, monthKey) {
  const days = [];
  for (let day = 1; day <= daysInMonth(monthKey); day++) {
    days.push({ date: `${monthKey}-${String(day).padStart(2, '0')}`, day, total: 0 });
  }

  for (const transaction of transactions) {
    const isThisMonth = monthKeyOf(transaction.date) === monthKey;
    if (transaction.type === TYPES.EXPENSE && isThisMonth) {
      days[Number(transaction.date.slice(8)) - 1].total += transaction.amount;
    }
  }

  return days;
}

// ---------------------------------------------------------------------------
// Cálculos para Ahorro y deudas
// ---------------------------------------------------------------------------

/** Avance de una meta: cuánto lleva, cuánto falta y la proporción (0 a 1). */
export function goalProgress(goal) {
  const done = goal.entries.reduce((sum, entry) => sum + entry.amount, 0);
  const remaining = Math.max(goal.target - done, 0);
  const ratio = Math.min(done / goal.target, 1);
  return { done, remaining, ratio, complete: remaining === 0 };
}

/** Suma el avance de todas las metas de un tipo ("saving" o "debt"). */
export function goalsSummary(goals, kind) {
  let done = 0;
  let remaining = 0;

  for (const goal of goals) {
    if (goal.kind !== kind) continue;
    const progress = goalProgress(goal);
    done += progress.done;
    remaining += progress.remaining;
  }

  return { done, remaining };
}

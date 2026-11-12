// ---------------------------------------------------------------------------
// selectors.js — Cálculos sobre los movimientos.
//
// Todas son "funciones puras": reciben datos, devuelven un resultado y no
// modifican nada ni tocan la pantalla. Por eso son fáciles de probar
// (ver la carpeta tests/).
// ---------------------------------------------------------------------------

import { TYPES } from './config.js';
import { monthKeyOf } from './utils/dates.js';

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

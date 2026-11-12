// ---------------------------------------------------------------------------
// summary.js — Dibuja el saldo total y los totales del mes.
// Recibe los números ya calculados: este archivo solo se ocupa de mostrarlos.
// ---------------------------------------------------------------------------

import { el } from './dom.js';
import { formatMoney } from '../utils/money.js';

export function renderSummary(root, { balance, month }) {
  const balanceText = balance < 0 ? `−${formatMoney(-balance)}` : formatMoney(balance);

  root.replaceChildren(
    el('p', { class: 'summary__label', text: 'Saldo total' }),
    el('p', { class: 'summary__balance', text: balanceText }),
    el('div', { class: 'summary__cards' }, [
      el('div', { class: 'card' }, [
        el('p', { class: 'card__label', text: 'Ingresos del mes' }),
        el('p', { class: 'card__value card__value--income', text: formatMoney(month.income) })
      ]),
      el('div', { class: 'card' }, [
        el('p', { class: 'card__label', text: 'Gastos del mes' }),
        el('p', { class: 'card__value', text: formatMoney(month.expense) })
      ])
    ])
  );
}

// ---------------------------------------------------------------------------
// summary.js — Dibuja el saldo total y los totales del mes (pestaña Inicio).
// Recibe los números ya calculados: este archivo solo se ocupa de mostrarlos.
// ---------------------------------------------------------------------------

import { el } from './dom.js';
import { formatMoney } from '../utils/money.js';

export function renderSummary(root, { balance, month }) {
  const balanceText = balance < 0 ? `−${formatMoney(-balance)}` : formatMoney(balance);

  root.replaceChildren(
    el('p', { class: 'hero__label', text: 'Saldo total' }),
    el('p', { class: 'hero__value num', text: balanceText }),
    el('div', { class: 'cards' }, [
      card('Ingresos del mes', formatMoney(month.income), 'card__value num card__value--income'),
      card('Gastos del mes', formatMoney(month.expense))
    ])
  );
}

/** Tarjeta pequeña con una etiqueta y un valor. La reutilizan otras pestañas. */
export function card(label, value, valueClass = 'card__value num') {
  return el('div', { class: 'card' }, [
    el('p', { class: 'card__label', text: label }),
    el('p', { class: valueClass, text: value })
  ]);
}

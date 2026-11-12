// ---------------------------------------------------------------------------
// transactionList.js — Dibuja la lista de movimientos agrupada por día.
// ---------------------------------------------------------------------------

import { el } from './dom.js';
import { findCategory, TYPES } from '../config.js';
import { formatMoney, formatSigned } from '../utils/money.js';
import { formatDay } from '../utils/dates.js';

/**
 * @param root     elemento donde se dibuja
 * @param groups   resultado de groupByDay() en selectors.js
 * @param onSelect función que se llama al tocar un movimiento
 */
export function renderTransactionList(root, groups, { onSelect }) {
  if (groups.length === 0) {
    root.replaceChildren(
      el('div', { class: 'empty' }, [
        el('p', { class: 'empty__title', text: 'Sin movimientos este mes' }),
        el('p', { text: 'Toca + para registrar el primero.' })
      ])
    );
    return;
  }

  root.replaceChildren(...groups.map((group) => renderDay(group, onSelect)));
}

function renderDay(group, onSelect) {
  return el('section', { class: 'day' }, [
    el('header', { class: 'day__header' }, [
      el('span', { text: formatDay(group.date) }),
      el('span', { text: formatSigned(group.net) })
    ]),
    el('div', { class: 'day__items' },
      group.items.map((transaction) => renderRow(transaction, onSelect))
    )
  ]);
}

function renderRow(transaction, onSelect) {
  const category = findCategory(transaction.type, transaction.category);
  const isIncome = transaction.type === TYPES.INCOME;

  // Si hay descripción, es el título y la categoría va debajo.
  const title = transaction.description || category.label;
  const textChildren = [el('p', { class: 'row__title', text: title })];
  if (transaction.description) {
    textChildren.push(el('p', { class: 'row__subtitle', text: category.label }));
  }

  const amountText = isIncome
    ? `+${formatMoney(transaction.amount)}`
    : `−${formatMoney(transaction.amount)}`;

  return el('button', { class: 'row', type: 'button', onClick: () => onSelect(transaction) }, [
    el('span', { class: 'row__icon', 'aria-hidden': 'true', text: category.icon }),
    el('div', { class: 'row__text' }, textChildren),
    el('span', {
      class: isIncome ? 'row__amount row__amount--income' : 'row__amount',
      text: amountText
    })
  ]);
}

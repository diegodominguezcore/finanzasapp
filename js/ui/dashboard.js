// ---------------------------------------------------------------------------
// dashboard.js — Pestaña Resumen: en qué se fue el dinero este mes.
// Recibe todo ya calculado desde app.js; aquí solo se decide cómo mostrarlo.
// ---------------------------------------------------------------------------

import { el } from './dom.js';
import { card } from './summary.js';
import { barList, dailyChart, describeDay } from './charts.js';
import { findCategory, TYPES } from '../config.js';
import { formatMoney, formatSigned } from '../utils/money.js';
import { elapsedDays, formatMonthName, shiftMonth } from '../utils/dates.js';

/**
 * @param data.monthKey        mes visible, ej. "2026-11"
 * @param data.month           totals() del mes: { income, expense, net }
 * @param data.previousExpense gasto total del mes anterior, en centavos
 * @param data.categories      expensesByCategory() del mes
 * @param data.days            dailyExpenses() del mes
 */
export function renderDashboard(root, { monthKey, month, previousExpense, categories, days }) {
  const hero = el('section', { class: 'hero' }, [
    el('p', { class: 'hero__label', text: `Gastos de ${formatMonthName(monthKey)}` }),
    el('p', { class: 'hero__value num', text: formatMoney(month.expense) })
  ]);

  const comparison = compareWithPrevious(month.expense, previousExpense, monthKey);
  if (comparison) hero.append(el('p', { class: 'hero__note', text: comparison }));

  if (month.expense === 0) {
    root.replaceChildren(
      hero,
      el('div', { class: 'empty' }, [
        el('p', { class: 'empty__title', text: 'Aún no hay gastos este mes' }),
        el('p', { text: 'Cuando registres gastos, aquí verás en qué se va tu dinero.' })
      ])
    );
    return;
  }

  const average = Math.round(month.expense / elapsedDays(monthKey));

  root.replaceChildren(
    hero,
    el('div', { class: 'cards' }, [
      card('Promedio por día', formatMoney(average)),
      card('Balance del mes', formatSigned(month.net))
    ]),
    categoryPanel(categories),
    dailyPanel(days)
  );
}

/** "12% más que en octubre", "8% menos que en octubre", o null si no hay con qué comparar. */
function compareWithPrevious(current, previous, monthKey) {
  if (previous === 0) return null;

  const previousName = formatMonthName(shiftMonth(monthKey, -1));
  const change = Math.round(((current - previous) / previous) * 100);

  if (change === 0) return `Igual que en ${previousName}`;
  return `${Math.abs(change)}% ${change > 0 ? 'más' : 'menos'} que en ${previousName}`;
}

function categoryPanel(categories) {
  const items = categories.map((item) => {
    const category = findCategory(TYPES.EXPENSE, item.category);
    return { label: `${category.icon} ${category.label}`, total: item.total, share: item.share };
  });

  return el('section', { class: 'panel' }, [
    el('header', { class: 'panel__header' }, [
      el('h2', { class: 'panel__title', text: 'Por categoría' })
    ]),
    barList(items)
  ]);
}

function dailyPanel(days) {
  // Por defecto mostramos el día con más gasto; al tocar una barra, ese día.
  const peak = days.reduce((best, day) => (day.total > best.total ? day : best));
  const defaultText = `Día más alto: ${describeDay(peak)}`;

  const readout = el('p', { class: 'panel__aside num', text: defaultText });

  const chart = dailyChart(days, {
    onSelect(day) {
      readout.textContent = day ? describeDay(day) : defaultText;
    }
  });

  return el('section', { class: 'panel' }, [
    el('header', { class: 'panel__header' }, [
      el('h2', { class: 'panel__title', text: 'Por día' }),
      readout
    ]),
    chart
  ]);
}

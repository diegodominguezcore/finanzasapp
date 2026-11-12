// Pruebas automáticas de la lógica (no de la pantalla).
// Se corren con:  npm test   (necesitas tener Node.js instalado)
//
// Cada test dice: "con estos datos de entrada, espero este resultado".
// Si luego cambias el código y rompes algo, el test te avisa.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseAmount } from '../js/utils/money.js';
import { shiftMonth, monthKeyOf, daysInMonth } from '../js/utils/dates.js';
import {
  byMonth, totals, groupByDay, expensesByCategory, dailyExpenses, goalProgress, goalsSummary
} from '../js/selectors.js';
import { buildGoal, buildEntry, isValidGoal } from '../js/models/goal.js';
import { sanitizeData } from '../js/storage.js';
import { buildTransaction, isValidTransaction } from '../js/models/transaction.js';

const sample = [
  { id: 'a', type: 'income',  amount: 100000, category: 'salary', description: '', date: '2026-11-01', createdAt: 1 },
  { id: 'b', type: 'expense', amount: 2550,   category: 'food',   description: '', date: '2026-11-12', createdAt: 2 },
  { id: 'c', type: 'expense', amount: 1000,   category: 'food',   description: '', date: '2026-11-12', createdAt: 3 },
  { id: 'd', type: 'expense', amount: 5000,   category: 'fun',    description: '', date: '2026-10-30', createdAt: 4 }
];

test('parseAmount convierte texto a centavos', () => {
  assert.equal(parseAmount('125'), 12500);
  assert.equal(parseAmount('125.5'), 12550);
  assert.equal(parseAmount('125,50'), 12550);
  assert.equal(parseAmount('1,250.75'), 125075);
  assert.equal(parseAmount('1,500'), 150000);
  assert.equal(parseAmount('2,500,000'), 250000000);
  assert.equal(parseAmount('0.1'), 10);
});

test('parseAmount rechaza montos inválidos', () => {
  for (const bad of ['', 'abc', '0', '-5', '12.3.4']) {
    assert.equal(parseAmount(bad), null);
  }
});

test('shiftMonth cruza de año correctamente', () => {
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.equal(monthKeyOf('2026-11-12'), '2026-11');
});

test('byMonth y totals calculan el mes', () => {
  const november = byMonth(sample, '2026-11');
  assert.equal(november.length, 3);
  assert.deepEqual(totals(november), { income: 100000, expense: 3550, net: 96450 });
  assert.equal(totals(sample).net, 91450);
});

test('groupByDay ordena del día más reciente al más antiguo', () => {
  const groups = groupByDay(byMonth(sample, '2026-11'));
  assert.deepEqual(groups.map((group) => group.date), ['2026-11-12', '2026-11-01']);
  assert.deepEqual(groups[0].items.map((item) => item.id), ['c', 'b']);
  assert.equal(groups[0].net, -3550);
});

test('buildTransaction valida el formulario', () => {
  const good = buildTransaction({
    type: 'expense', amount: '25.50', category: 'food', description: '  Almuerzo ', date: '2026-11-12'
  });
  assert.equal(good.ok, true);
  assert.deepEqual(good.value, {
    type: 'expense', amount: 2550, category: 'food', description: 'Almuerzo', date: '2026-11-12'
  });

  assert.equal(buildTransaction({ type: 'expense', amount: '', category: 'food', date: '2026-11-12' }).ok, false);
  assert.equal(buildTransaction({ type: 'expense', amount: '5', category: 'salary', date: '2026-11-12' }).ok, false);
  assert.equal(buildTransaction({ type: 'income', amount: '5', category: 'salary', date: '' }).ok, false);
});

test('isValidTransaction filtra datos dañados', () => {
  assert.equal(isValidTransaction(sample[0]), true);
  assert.equal(isValidTransaction({ ...sample[0], amount: 10.5 }), false);
  assert.equal(isValidTransaction({ ...sample[0], type: 'otro' }), false);
  assert.equal(isValidTransaction(null), false);
});

// ---------------------------------------------------------------------------
// Versión 2: resumen y metas
// ---------------------------------------------------------------------------

test('daysInMonth conoce febrero y los años bisiestos', () => {
  assert.equal(daysInMonth('2026-11'), 30);
  assert.equal(daysInMonth('2026-02'), 28);
  assert.equal(daysInMonth('2028-02'), 29);
});

test('expensesByCategory suma por categoría y ordena de mayor a menor', () => {
  const result = expensesByCategory(sample);
  assert.deepEqual(result.map((item) => [item.category, item.total]), [['fun', 5000], ['food', 3550]]);
  assert.equal(Math.round(result[0].share * 100), 58);
  assert.deepEqual(expensesByCategory([sample[0]]), []); // solo ingresos → nada
});

test('dailyExpenses devuelve todos los días del mes', () => {
  const days = dailyExpenses(sample, '2026-11');
  assert.equal(days.length, 30);
  assert.equal(days[11].total, 3550); // día 12
  assert.equal(days[0].total, 0);     // el día 1 solo hubo un ingreso
});

const goal = {
  id: 'g1', kind: 'saving', name: 'Laptop', target: 100000, createdAt: 1,
  entries: [{ id: 'e1', amount: 25000, date: '2026-11-01' }, { id: 'e2', amount: 5000, date: '2026-11-10' }]
};

test('goalProgress calcula avance y nunca pasa de 100 %', () => {
  assert.deepEqual(goalProgress(goal), { done: 30000, remaining: 70000, ratio: 0.3, complete: false });

  const overpaid = { ...goal, target: 20000 };
  assert.deepEqual(goalProgress(overpaid), { done: 30000, remaining: 0, ratio: 1, complete: true });
});

test('goalsSummary separa ahorro de deudas', () => {
  const debt = { ...goal, id: 'g2', kind: 'debt', target: 50000, entries: [] };
  assert.deepEqual(goalsSummary([goal, debt], 'saving'), { done: 30000, remaining: 70000 });
  assert.deepEqual(goalsSummary([goal, debt], 'debt'), { done: 0, remaining: 50000 });
});

test('buildGoal y buildEntry validan sus formularios', () => {
  assert.deepEqual(buildGoal({ kind: 'debt', name: ' Préstamo ', target: '1,500' }), {
    ok: true, value: { kind: 'debt', name: 'Préstamo', target: 150000 }
  });
  assert.equal(buildGoal({ kind: 'debt', name: '', target: '100' }).ok, false);
  assert.equal(buildGoal({ kind: 'saving', name: 'X', target: '0' }).ok, false);
  assert.equal(buildEntry({ amount: '50', date: '2026-11-12' }).ok, true);
  assert.equal(buildEntry({ amount: '50', date: '' }).ok, false);
});

test('sanitizeData acepta datos de la versión 1 (sin metas) y descarta lo dañado', () => {
  const v1 = { version: 1, transactions: [sample[0], { roto: true }] };
  assert.deepEqual(sanitizeData(v1), { transactions: [sample[0]], goals: [] });

  const v2 = { version: 2, transactions: [], goals: [goal, { ...goal, entries: 'mal' }] };
  assert.equal(sanitizeData(v2).goals.length, 1);
  assert.equal(isValidGoal(goal), true);
});

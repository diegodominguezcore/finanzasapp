// Pruebas automáticas de la lógica (no de la pantalla).
// Se corren con:  npm test   (necesitas tener Node.js instalado)
//
// Cada test dice: "con estos datos de entrada, espero este resultado".
// Si luego cambias el código y rompes algo, el test te avisa.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseAmount } from '../js/utils/money.js';
import { shiftMonth, monthKeyOf } from '../js/utils/dates.js';
import { byMonth, totals, groupByDay } from '../js/selectors.js';
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

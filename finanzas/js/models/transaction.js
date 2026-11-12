// ---------------------------------------------------------------------------
// transaction.js — Define QUÉ ES un movimiento y cuándo es válido.
//
// Un movimiento guardado se ve así:
// {
//   id: "b3f1…",             identificador único
//   type: "expense",         "expense" (gasto) o "income" (ingreso)
//   amount: 12550,           en centavos, siempre positivo (el tipo da el signo)
//   category: "food",        id de una categoría de config.js
//   description: "Almuerzo", texto libre, puede ir vacío
//   date: "2026-11-12",      día del movimiento
//   createdAt: 1794512345678 momento exacto en que se registró
// }
// ---------------------------------------------------------------------------

import { CATEGORIES, TYPES } from '../config.js';
import { parseAmount } from '../utils/money.js';
import { isISODate } from '../utils/dates.js';

const VALID_TYPES = Object.values(TYPES);

/**
 * Toma los datos crudos del formulario (todo texto) y los convierte en los
 * campos de un movimiento. Devuelve:
 *   { ok: true, value: {...} }      si todo está bien
 *   { ok: false, error: "mensaje" } si algo falla
 * Así quien llama decide qué hacer con el error, sin usar try/catch.
 */
export function buildTransaction(input) {
  const type = input.type;
  if (!VALID_TYPES.includes(type)) {
    return { ok: false, error: 'Elige si es gasto o ingreso.' };
  }

  const amount = parseAmount(input.amount ?? '');
  if (amount === null) {
    return { ok: false, error: 'Escribe un monto mayor que cero.' };
  }

  const categoryExists = CATEGORIES[type].some((category) => category.id === input.category);
  if (!categoryExists) {
    return { ok: false, error: 'Elige una categoría.' };
  }

  if (!isISODate(input.date)) {
    return { ok: false, error: 'Elige una fecha.' };
  }

  return {
    ok: true,
    value: {
      type,
      amount,
      category: input.category,
      description: String(input.description ?? '').trim(),
      date: input.date
    }
  };
}

/**
 * Revisa que un objeto ya guardado (o importado de un respaldo) tenga la forma
 * correcta. Nunca confíes en datos que vienen de afuera sin revisarlos.
 */
export function isValidTransaction(value) {
  return (
    typeof value === 'object' && value !== null &&
    typeof value.id === 'string' && value.id.length > 0 &&
    VALID_TYPES.includes(value.type) &&
    Number.isInteger(value.amount) && value.amount > 0 &&
    typeof value.category === 'string' &&
    typeof value.description === 'string' &&
    isISODate(value.date)
  );
}

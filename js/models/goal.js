// ---------------------------------------------------------------------------
// goal.js — Define qué es una META (de ahorro o una deuda) y cuándo es válida.
//
// Una meta guardada se ve así:
// {
//   id: "9c2e…",
//   kind: "saving",            "saving" (ahorro) o "debt" (deuda)
//   name: "Laptop nueva",
//   target: 500000,            monto objetivo en centavos
//   entries: [                 cada aporte (ahorro) o abono (deuda)
//     { id: "a1…", amount: 50000, date: "2026-11-12" }
//   ],
//   createdAt: 1794512345678
// }
//
// Lo ahorrado / pagado NO se guarda: se calcula sumando "entries"
// (ver goalProgress en selectors.js). Guardar un dato que se puede calcular
// es arriesgado, porque tarde o temprano los dos valores dejan de coincidir.
// ---------------------------------------------------------------------------

import { GOAL_KINDS } from '../config.js';
import { parseAmount } from '../utils/money.js';
import { isISODate } from '../utils/dates.js';

const VALID_KINDS = Object.values(GOAL_KINDS);

/** Datos crudos del formulario → campos de una meta. Devuelve { ok, value | error }. */
export function buildGoal(input) {
  if (!VALID_KINDS.includes(input.kind)) {
    return { ok: false, error: 'Tipo de meta no válido.' };
  }

  const name = String(input.name ?? '').trim();
  if (name.length === 0) {
    return { ok: false, error: 'Escribe un nombre.' };
  }

  const target = parseAmount(input.target ?? '');
  if (target === null) {
    return { ok: false, error: 'Escribe un monto mayor que cero.' };
  }

  return { ok: true, value: { kind: input.kind, name, target } };
}

/** Datos crudos del formulario → un aporte o abono. */
export function buildEntry(input) {
  const amount = parseAmount(input.amount ?? '');
  if (amount === null) {
    return { ok: false, error: 'Escribe un monto mayor que cero.' };
  }

  if (!isISODate(input.date)) {
    return { ok: false, error: 'Elige una fecha.' };
  }

  return { ok: true, value: { amount, date: input.date } };
}

function isValidEntry(value) {
  return (
    typeof value === 'object' && value !== null &&
    typeof value.id === 'string' && value.id.length > 0 &&
    Number.isInteger(value.amount) && value.amount > 0 &&
    isISODate(value.date)
  );
}

/** Revisa una meta ya guardada o importada de un respaldo. */
export function isValidGoal(value) {
  return (
    typeof value === 'object' && value !== null &&
    typeof value.id === 'string' && value.id.length > 0 &&
    VALID_KINDS.includes(value.kind) &&
    typeof value.name === 'string' && value.name.length > 0 &&
    Number.isInteger(value.target) && value.target > 0 &&
    Array.isArray(value.entries) && value.entries.every(isValidEntry)
  );
}

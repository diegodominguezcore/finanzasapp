// ---------------------------------------------------------------------------
// dates.js — Ayudas para fechas.
//
// Las fechas se guardan como texto "AAAA-MM-DD" (ej. "2026-11-12") y los meses
// como "AAAA-MM". Ventajas: se ordenan bien alfabéticamente, son fáciles de
// leer y no dependen de la zona horaria.
// ---------------------------------------------------------------------------

import { APP } from '../config.js';

const pad = (number) => String(number).padStart(2, '0');

/** Objeto Date → "2026-11-12" (usando la hora local del teléfono). */
export function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "2026-11-12" → objeto Date local. */
function fromISODate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day); // en Date los meses van de 0 a 11
}

export function todayISO() {
  return toISODate(new Date());
}

/** "2026-11-12" → "2026-11" */
export function monthKeyOf(isoDate) {
  return isoDate.slice(0, 7);
}

export function currentMonthKey() {
  return monthKeyOf(todayISO());
}

/** Avanza o retrocede meses: shiftMonth("2026-12", 1) → "2027-01" */
export function shiftMonth(monthKey, delta) {
  const [year, month] = monthKey.split('-').map(Number);
  return monthKeyOf(toISODate(new Date(year, month - 1 + delta, 1)));
}

/** "2026-11" → "noviembre de 2026" */
export function formatMonth(monthKey) {
  const date = fromISODate(`${monthKey}-01`);
  return new Intl.DateTimeFormat(APP.locale, { month: 'long', year: 'numeric' }).format(date);
}

/** "2026-11-12" → "Hoy", "Ayer" o "jueves, 12 de noviembre" */
export function formatDay(isoDate) {
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

  if (isoDate === toISODate(today)) return 'Hoy';
  if (isoDate === toISODate(yesterday)) return 'Ayer';

  return new Intl.DateTimeFormat(APP.locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(fromISODate(isoDate));
}

/** Revisa que un texto tenga forma de fecha "AAAA-MM-DD". */
export function isISODate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

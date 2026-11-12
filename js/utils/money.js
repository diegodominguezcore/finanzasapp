// ---------------------------------------------------------------------------
// money.js — Todo lo relacionado con dinero.
//
// REGLA IMPORTANTE: el dinero se guarda en CENTAVOS, como número entero.
// ¿Por qué? Porque los decimales en JavaScript no son exactos:
//     0.1 + 0.2  →  0.30000000000000004
// Con enteros (10 + 20 = 30) ese problema no existe. Solo convertimos a
// "Q0.30" en el último momento, al mostrarlo en pantalla.
// ---------------------------------------------------------------------------

import { APP } from '../config.js';

const formatter = new Intl.NumberFormat(APP.locale, {
  style: 'currency',
  currency: APP.currency
});

/** 12550 → "Q125.50" */
export function formatMoney(cents) {
  return formatter.format(cents / 100);
}

/** Igual que formatMoney, pero con signo: "+Q125.50" o "−Q125.50". */
export function formatSigned(cents) {
  if (cents === 0) return formatMoney(0);
  const sign = cents > 0 ? '+' : '−';
  return sign + formatMoney(Math.abs(cents));
}

/**
 * Convierte lo que escribió el usuario a centavos.
 * Acepta "125", "125.5", "125,50", "1,500" y "1,250.75".
 * Devuelve null si no es un monto válido mayor que cero.
 */
export function parseAmount(text) {
  let clean = String(text).trim().replace(/\s/g, '');

  const hasComma = clean.includes(',');
  const hasDot = clean.includes('.');

  if (hasComma && hasDot) {
    clean = clean.replace(/,/g, '');     // "1,250.75" → la coma separa miles
  } else if (/^\d{1,3}(,\d{3})+$/.test(clean)) {
    clean = clean.replace(/,/g, '');     // "1,500"    → la coma separa miles
  } else if (hasComma) {
    clean = clean.replace(',', '.');     // "125,50"   → la coma es el decimal
  }

  if (!/^\d+(\.\d+)?$/.test(clean)) return null;

  const cents = Math.round(Number(clean) * 100);
  return cents > 0 ? cents : null;
}

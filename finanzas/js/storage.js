// ---------------------------------------------------------------------------
// storage.js — Guarda y lee los datos del teléfono.
//
// Este es el ÚNICO archivo que sabe DÓNDE se guardan los datos (localStorage).
// Si algún día quieres pasar a IndexedDB o a un servidor, solo cambias este
// archivo y el resto de la app sigue funcionando igual.
// ---------------------------------------------------------------------------

import { APP } from './config.js';
import { isValidTransaction } from './models/transaction.js';

const SCHEMA_VERSION = 1; // súbelo si algún día cambias la forma de los datos

/** Devuelve la lista de movimientos guardados (o [] si no hay nada). */
export function loadTransactions() {
  try {
    const raw = localStorage.getItem(APP.storageKey);
    if (!raw) return [];

    const data = JSON.parse(raw); // texto → objeto
    if (!Array.isArray(data.transactions)) return [];

    return data.transactions.filter(isValidTransaction);
  } catch (error) {
    console.error('No se pudieron leer los datos guardados:', error);
    return [];
  }
}

/** Guarda la lista completa. Devuelve true si se pudo guardar. */
export function saveTransactions(transactions) {
  try {
    const data = { version: SCHEMA_VERSION, transactions };
    localStorage.setItem(APP.storageKey, JSON.stringify(data)); // objeto → texto
    return true;
  } catch (error) {
    console.error('No se pudieron guardar los datos:', error);
    return false;
  }
}

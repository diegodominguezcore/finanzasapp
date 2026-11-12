// ---------------------------------------------------------------------------
// storage.js — Guarda y lee los datos del teléfono.
//
// Este es el ÚNICO archivo que sabe DÓNDE se guardan los datos (localStorage).
// Si algún día quieres pasar a IndexedDB o a un servidor, solo cambias este
// archivo y el resto de la app sigue funcionando igual.
// ---------------------------------------------------------------------------

import { APP } from './config.js';
import { isValidTransaction } from './models/transaction.js';
import { isValidGoal } from './models/goal.js';

// Versión de la FORMA de los datos. La versión 1 solo tenía "transactions";
// la 2 agrega "goals". Al leer aceptamos las dos: si "goals" no existe,
// usamos una lista vacía. A esto se le llama compatibilidad hacia atrás, y
// es lo que permite actualizar la app sin perder lo que ya estaba guardado.
const SCHEMA_VERSION = 2;

const EMPTY = { transactions: [], goals: [] };

/** Devuelve { transactions, goals } con lo guardado (o listas vacías). */
export function loadData() {
  try {
    const raw = localStorage.getItem(APP.storageKey);
    if (!raw) return EMPTY;

    return sanitizeData(JSON.parse(raw)); // texto → objeto
  } catch (error) {
    console.error('No se pudieron leer los datos guardados:', error);
    return EMPTY;
  }
}

/** Guarda todo. Devuelve true si se pudo guardar. */
export function saveData({ transactions, goals }) {
  try {
    const data = { version: SCHEMA_VERSION, transactions, goals };
    localStorage.setItem(APP.storageKey, JSON.stringify(data)); // objeto → texto
    return true;
  } catch (error) {
    console.error('No se pudieron guardar los datos:', error);
    return false;
  }
}

/**
 * Deja pasar solo los registros con la forma correcta. Se usa al leer del
 * teléfono y al importar un respaldo: nunca confíes en datos que vienen de afuera.
 */
export function sanitizeData(data) {
  const transactions = Array.isArray(data?.transactions) ? data.transactions : [];
  const goals = Array.isArray(data?.goals) ? data.goals : [];

  return {
    transactions: transactions.filter(isValidTransaction),
    goals: goals.filter(isValidGoal)
  };
}

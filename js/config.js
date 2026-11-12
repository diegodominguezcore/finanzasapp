// ---------------------------------------------------------------------------
// config.js — Configuración central de la app.
// Cualquier valor "fijo" (moneda, categorías, nombre de la clave de guardado)
// vive aquí, para que el resto del código no tenga valores escritos a mano.
// ---------------------------------------------------------------------------

export const APP = {
  locale: 'es-GT',          // formato de números y fechas (Guatemala)
  currency: 'GTQ',          // quetzales
  storageKey: 'finanzas:v1' // nombre bajo el que se guardan los datos
};

// Usamos constantes en vez de escribir 'expense' / 'income' por todo el código:
// si te equivocas en una letra, el editor te avisa en lugar de fallar en silencio.
export const TYPES = {
  EXPENSE: 'expense',
  INCOME: 'income'
};

// Para agregar una categoría nueva solo añade una línea aquí.
// El "id" se guarda en los datos: NO lo cambies después (el "label" sí puedes).
export const CATEGORIES = {
  [TYPES.EXPENSE]: [
    { id: 'food',      label: 'Comida',     icon: '🍽️' },
    { id: 'transport', label: 'Transporte', icon: '🚌' },
    { id: 'study',     label: 'Estudios',   icon: '📚' },
    { id: 'home',      label: 'Casa',       icon: '🏠' },
    { id: 'fun',       label: 'Ocio',       icon: '🎮' },
    { id: 'health',    label: 'Salud',      icon: '💊' },
    { id: 'other',     label: 'Otros',      icon: '📦' }
  ],
  [TYPES.INCOME]: [
    { id: 'salary',    label: 'Sueldo',     icon: '💼' },
    { id: 'allowance', label: 'Mesada',     icon: '🤝' },
    { id: 'sale',      label: 'Venta',      icon: '🏷️' },
    { id: 'other',     label: 'Otros',      icon: '💰' }
  ]
};

const UNKNOWN_CATEGORY = { id: 'unknown', label: 'Sin categoría', icon: '❔' };

/** Busca una categoría por tipo e id. Nunca devuelve undefined. */
export function findCategory(type, id) {
  const list = CATEGORIES[type] ?? [];
  return list.find((category) => category.id === id) ?? UNKNOWN_CATEGORY;
}

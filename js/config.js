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

// ---------------------------------------------------------------------------
// Metas: ahorro y deudas.
// Las dos funcionan igual por dentro (un monto objetivo y una lista de abonos),
// así que comparten el mismo código. Lo único que cambia son los textos, y
// esos textos viven aquí.
// ---------------------------------------------------------------------------
export const GOAL_KINDS = {
  SAVING: 'saving',
  DEBT: 'debt'
};

export const GOAL_TEXT = {
  [GOAL_KINDS.SAVING]: {
    sectionTitle: 'Ahorro',
    newTitle: 'Nueva meta de ahorro',
    editTitle: 'Editar meta',
    namePlaceholder: 'Ej. Laptop nueva',
    targetLabel: 'Meta',
    entryAction: 'Aportar',
    entryTitle: 'Aportar a',
    historyTitle: 'Aportes',
    remaining: 'Faltan',
    complete: 'Meta cumplida',
    empty: 'Crea una meta para empezar a ahorrar.',
    deleted: 'Meta eliminada'
  },
  [GOAL_KINDS.DEBT]: {
    sectionTitle: 'Deudas',
    newTitle: 'Nueva deuda',
    editTitle: 'Editar deuda',
    namePlaceholder: 'Ej. Préstamo de la U',
    targetLabel: 'Monto total',
    entryAction: 'Abonar',
    entryTitle: 'Abonar a',
    historyTitle: 'Abonos',
    remaining: 'Debes',
    complete: 'Deuda pagada',
    empty: 'No tienes deudas registradas.',
    deleted: 'Deuda eliminada'
  }
};

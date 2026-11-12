// ---------------------------------------------------------------------------
// dom.js — Ayudas pequeñas para crear elementos HTML desde JavaScript.
// ---------------------------------------------------------------------------

/** Atajo de document.querySelector. */
export const $ = (selector, root = document) => root.querySelector(selector);

/**
 * Crea un elemento:  el('p', { class: 'nota', text: 'Hola' })
 *
 * Usamos "text" (textContent) y NO innerHTML. Así, si alguien escribe
 * "<script>…" en una descripción, se muestra como texto y no se ejecuta.
 * (Ese tipo de ataque se llama XSS.)
 */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(props)) {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'onClick') node.addEventListener('click', value);
    else node.setAttribute(key, value);
  }

  node.append(...children);
  return node;
}

/** Atajo de document.querySelectorAll, devuelto como arreglo. */
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/**
 * Igual que el(), pero para gráficas SVG. Los elementos SVG necesitan
 * createElementNS (con "namespace"); con createElement no se dibujan.
 */
export function svg(tag, attributes = {}, children = []) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'text') node.textContent = value;
    else node.setAttribute(key, value);
  }
  node.append(...children);
  return node;
}

/** Conecta el comportamiento común de las hojas: botón ✕ y toque fuera. */
export function setupSheet(dialog) {
  dialog.addEventListener('click', (event) => {
    const tappedBackdrop = event.target === dialog;
    const tappedClose = event.target.closest('[data-close]');
    if (tappedBackdrop || tappedClose) dialog.close();
  });
}

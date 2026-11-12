// ---------------------------------------------------------------------------
// toast.js — Aviso temporal en la parte de abajo, con un botón opcional.
// Se usa para "Movimiento eliminado · Deshacer".
//
// ¿Por qué "Deshacer" en vez de preguntar "¿Seguro que quieres eliminar?"
// Porque la pregunta interrumpe SIEMPRE, incluso cuando sí querías borrar, y
// la gente termina aceptando sin leer. Deshacer no estorba y aun así te
// protege de un error.
// ---------------------------------------------------------------------------

import { $ } from './dom.js';

const VISIBLE_MS = 5000;
let hideTimer = null;

export function showToast(message, { actionLabel, onAction } = {}) {
  const toast = $('#toast');
  const button = $('#toast-action');

  $('#toast-message').textContent = message;

  button.hidden = !actionLabel;
  button.textContent = actionLabel ?? '';
  button.onclick = () => {
    onAction?.();
    hideToast();
  };

  // Ocultar y volver a mostrar reinicia la animación de entrada.
  toast.hidden = true;
  void toast.offsetWidth; // fuerza al navegador a registrar el cambio
  toast.hidden = false;

  clearTimeout(hideTimer);
  hideTimer = setTimeout(hideToast, VISIBLE_MS);
}

export function hideToast() {
  clearTimeout(hideTimer);
  $('#toast').hidden = true;
}

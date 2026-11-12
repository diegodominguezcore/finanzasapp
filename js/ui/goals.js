// ---------------------------------------------------------------------------
// goals.js — Pestaña Metas: ahorro y deudas.
//
// Las dos secciones se dibujan con LA MISMA función (renderSection). Lo que
// cambia entre una y otra son los textos, que vienen de GOAL_TEXT en config.js.
// ---------------------------------------------------------------------------

import { el } from './dom.js';
import { card } from './summary.js';
import { GOAL_KINDS, GOAL_TEXT } from '../config.js';
import { goalProgress, goalsSummary } from '../selectors.js';
import { formatMoney } from '../utils/money.js';

/**
 * @param handlers.onNew(kind)   crear una meta de ese tipo
 * @param handlers.onEdit(goal)  abrir una meta para editarla
 * @param handlers.onEntry(goal) registrar un aporte o abono
 */
export function renderGoals(root, goals, handlers) {
  const saving = goalsSummary(goals, GOAL_KINDS.SAVING);
  const debt = goalsSummary(goals, GOAL_KINDS.DEBT);

  root.replaceChildren(
    el('div', { class: 'cards' }, [
      card('Ahorrado', formatMoney(saving.done)),
      card('Por pagar', formatMoney(debt.remaining))
    ]),
    renderSection(GOAL_KINDS.SAVING, goals, handlers),
    renderSection(GOAL_KINDS.DEBT, goals, handlers)
  );
}

function renderSection(kind, goals, handlers) {
  const text = GOAL_TEXT[kind];
  const ownGoals = goals
    .filter((goal) => goal.kind === kind)
    .sort((a, b) => a.createdAt - b.createdAt);

  const content = ownGoals.length > 0
    ? ownGoals.map((goal) => renderGoal(goal, text, handlers))
    : [el('p', { class: 'empty empty--inline', text: text.empty })];

  return el('section', { class: 'goal-section' }, [
    el('header', { class: 'goal-section__header' }, [
      el('h2', { class: 'section-title', text: text.sectionTitle }),
      el('button', { class: 'link-btn', type: 'button', text: '+ Nueva', onClick: () => handlers.onNew(kind) })
    ]),
    ...content
  ]);
}

function renderGoal(goal, text, handlers) {
  const progress = goalProgress(goal);

  const fill = el('div', { class: 'meter__fill' });
  fill.style.width = `${progress.ratio * 100}%`;

  const detail = progress.complete
    ? [`${text.complete} · ${formatMoney(goal.target)}`]
    : [
        `${formatMoney(progress.done)} de ${formatMoney(goal.target)}`,
        `${text.remaining} ${formatMoney(progress.remaining)}`
      ];

  const main = el('button', { class: 'goal__main', type: 'button', onClick: () => handlers.onEdit(goal) }, [
    el('div', { class: 'goal__top' }, [
      el('span', { class: 'goal__name', text: goal.name }),
      el('span', { class: 'goal__percent num', text: `${Math.floor(progress.ratio * 100)}%` })
    ]),
    el('div', { class: 'meter' }, [fill]),
    el('p', { class: 'goal__detail num' }, detail.map((part) => el('span', { text: part })))
  ]);

  const children = [main];
  if (!progress.complete) {
    children.push(
      el('button', {
        class: 'pill-btn',
        type: 'button',
        text: text.entryAction,
        onClick: () => handlers.onEntry(goal)
      })
    );
  }

  return el('article', { class: 'goal' }, children);
}

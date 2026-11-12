// ---------------------------------------------------------------------------
// charts.js — Las dos gráficas del Resumen, hechas a mano (sin librerías).
//
// Decisiones de diseño:
//  - Barras, no gráfica de pastel: comparar largos sobre una misma línea es
//    mucho más exacto que comparar ángulos o áreas.
//  - Un solo color: aquí el color no distingue nada (cada barra ya tiene su
//    nombre al lado), así que usar varios solo agregaría ruido.
// ---------------------------------------------------------------------------

import { el, svg } from './dom.js';
import { formatMoney } from '../utils/money.js';
import { formatDayShort } from '../utils/dates.js';

/**
 * Lista de barras horizontales, de mayor a menor.
 * @param items [{ label, total, share }] ya ordenados
 */
export function barList(items) {
  const largest = items[0].total; // la barra más grande ocupa todo el ancho

  return el('div', { class: 'bar-list' },
    items.map((item) => {
      const fill = el('div', { class: 'bar-row__fill' });
      fill.style.width = `${(item.total / largest) * 100}%`;

      return el('div', { class: 'bar-row' }, [
        el('div', { class: 'bar-row__top' }, [
          el('span', { class: 'bar-row__name', text: item.label }),
          el('span', { class: 'bar-row__value num' }, [
            formatMoney(item.total),
            el('span', { class: 'bar-row__share', text: `${Math.round(item.share * 100)}%` })
          ])
        ]),
        el('div', { class: 'bar-row__track' }, [fill])
      ]);
    })
  );
}

/**
 * Gráfica de barras: una barra por día del mes.
 * @param days     resultado de dailyExpenses() en selectors.js
 * @param onSelect se llama con el día tocado (o null al soltar) para mostrar su detalle
 */
export function dailyChart(days, { onSelect }) {
  // Medidas internas del dibujo. El SVG se estira al ancho disponible,
  // así que estos números son proporciones, no píxeles reales.
  const WIDTH = 320;
  const PLOT_HEIGHT = 110;
  const LABEL_HEIGHT = 18;
  const GAP = 2;

  const barWidth = (WIDTH - GAP * (days.length - 1)) / days.length;
  const highest = Math.max(...days.map((day) => day.total), 1);

  const chart = svg('svg', {
    class: 'daily-chart',
    viewBox: `0 0 ${WIDTH} ${PLOT_HEIGHT + LABEL_HEIGHT}`,
    role: 'img',
    'aria-label': 'Gasto por día del mes'
  });

  const bars = [];

  function select(index) {
    bars.forEach((bar, barIndex) => bar?.classList.toggle('is-active', barIndex === index));
    chart.classList.toggle('has-active', index !== null);
    onSelect(index === null ? null : days[index]);
  }

  days.forEach((day, index) => {
    const x = index * (barWidth + GAP);

    // La barra (solo si hubo gasto ese día). Mínimo 2 de alto para que se vea.
    if (day.total > 0) {
      const height = Math.max((day.total / highest) * PLOT_HEIGHT, 2);
      const bar = svg('path', {
        class: 'daily-chart__bar',
        d: roundedTopBar(x, PLOT_HEIGHT - height, barWidth, height, 3)
      });
      bars[index] = bar;
      chart.append(bar);
    }

    // Etiqueta del eje: solo algunos días, para no saturar.
    if (day.day === 1 || day.day % 7 === 1) {
      chart.append(svg('text', {
        class: 'daily-chart__tick',
        x: x + barWidth / 2,
        y: PLOT_HEIGHT + 14,
        text: day.day
      }));
    }

    // Zona invisible para tocar: ocupa toda la altura, porque una barra
    // delgada o bajita sería casi imposible de atinar con el dedo.
    const hit = svg('rect', {
      class: 'daily-chart__hit',
      x: x - GAP / 2,
      y: 0,
      width: barWidth + GAP,
      height: PLOT_HEIGHT + LABEL_HEIGHT
    });
    hit.addEventListener('pointerenter', () => select(index));
    hit.addEventListener('pointerdown', () => select(index));
    chart.append(hit);
  });

  chart.append(svg('line', {
    class: 'daily-chart__axis',
    x1: 0, y1: PLOT_HEIGHT + 0.5, x2: WIDTH, y2: PLOT_HEIGHT + 0.5
  }));

  // Con mouse, al salir de la gráfica se quita la selección.
  chart.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'mouse') select(null);
  });

  return chart;
}

/** Texto para el detalle de un día: "12 nov · Q45.50" */
export function describeDay(day) {
  return `${formatDayShort(day.date)} · ${formatMoney(day.total)}`;
}

/**
 * Dibuja un rectángulo con SOLO las esquinas de arriba redondeadas, como
 * instrucciones de trazo SVG. La base queda recta porque descansa sobre el eje.
 *   M = mover, V = línea vertical, H = línea horizontal, Q = curva, Z = cerrar
 */
function roundedTopBar(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height);
  const right = x + width;
  const bottom = y + height;

  return [
    `M${x},${bottom}`,
    `V${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `H${right - r}`,
    `Q${right},${y} ${right},${y + r}`,
    `V${bottom}`,
    'Z'
  ].join(' ');
}

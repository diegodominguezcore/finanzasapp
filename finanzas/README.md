# Finanzas

App personal para llevar ingresos y gastos. Es una PWA: una página web que se
instala en el iPhone como si fuera una app. Está hecha con HTML, CSS y
JavaScript puro, sin librerías ni pasos de compilación.

## Correrla en tu computadora

Los módulos de JavaScript (`import` / `export`) no funcionan abriendo
`index.html` con doble clic; necesitan un servidor local. Dos opciones:

- **VS Code:** instala la extensión *Live Server*, clic derecho sobre
  `index.html` → *Open with Live Server*.
- **Terminal:** dentro de esta carpeta ejecuta `python -m http.server 8000`
  y abre `http://localhost:8000`.

Para verla como en el teléfono: F12 en el navegador → ícono de dispositivo móvil.

## Ponerla en tu iPhone

1. Publica la carpeta en un hosting con HTTPS (GitHub Pages o Netlify, ambos
   gratis). Sube el **contenido** de la carpeta, con `index.html` en la raíz.
2. Abre la dirección en **Safari** en el iPhone.
3. Compartir → **Agregar a pantalla de inicio**.

## Cómo está organizado el código

```
index.html              Estructura de la pantalla (qué hay)
css/styles.css          Apariencia (cómo se ve)
js/
  app.js                Punto de entrada: conecta todas las piezas  ← empieza aquí
  config.js             Moneda, categorías y otros valores fijos
  store.js              Estado de la app y las acciones que lo cambian
  storage.js            Guardar / leer del teléfono (localStorage)
  selectors.js          Cálculos: totales, filtro por mes, agrupar por día
  models/transaction.js Qué es un movimiento y cuándo es válido
  utils/money.js        Convertir y dar formato al dinero
  utils/dates.js        Ayudas para fechas
  ui/                   Cada archivo dibuja una parte de la pantalla
sw.js                   Service worker: permite usar la app sin internet
manifest.webmanifest    Nombre, ícono y colores de la app instalada
tests/                  Pruebas automáticas de la lógica
```

### La idea principal: los datos fluyen en un solo sentido

```
 tocas un botón ──► store (cambia el estado) ──► storage (lo guarda)
                              │
                              └──► render() en app.js ──► ui/ dibuja la pantalla
```

La pantalla nunca se modifica "a mano". Siempre se cambia el estado y la
pantalla se vuelve a dibujar a partir de él. Por eso cada archivo tiene una
sola responsabilidad y puedes cambiar uno sin romper los demás.

### Decisiones que vale la pena entender

- **El dinero se guarda en centavos (enteros).** En JavaScript
  `0.1 + 0.2` da `0.30000000000000004`. Con enteros no pasa.
- **Las fechas se guardan como texto `"2026-11-12"`.** Se ordenan solas y no
  dependen de la zona horaria.
- **Se usa `textContent`, nunca `innerHTML`**, para mostrar lo que escribe el
  usuario. Evita que un texto se ejecute como código (XSS).
- **Solo `storage.js` conoce `localStorage`.** Si luego quieres una base de
  datos, cambias ese archivo y nada más.

## Al publicar una versión nueva

En `sw.js` sube `CACHE_VERSION` (`finanzas-v1` → `finanzas-v2`) y agrega a
`ASSETS` cualquier archivo nuevo. Si no, el teléfono seguirá mostrando la
versión anterior.

## Pruebas

Con Node.js instalado: `npm test`.

## Ejercicios para practicar (de fácil a difícil)

1. Agrega una categoría nueva en `config.js`.
2. Cambia los colores en la sección 1 de `styles.css`.
3. Muestra en el resumen una tercera tarjeta con el balance del mes
   (pista: `month.net` ya existe en `summary.js`).
4. Agrega un selector nuevo en `selectors.js` que sume los gastos por
   categoría, con su test en `tests/logic.test.js`.
5. Usa ese selector para dibujar un desglose por categoría en un archivo
   nuevo dentro de `ui/`.

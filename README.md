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
  config.js             Moneda, categorías y textos de las metas
  store.js              Estado de la app y las acciones que lo cambian
  storage.js            Guardar / leer del teléfono (localStorage)
  selectors.js          Cálculos: totales, por categoría, por día, avance de metas
  models/
    transaction.js      Qué es un movimiento y cuándo es válido
    goal.js             Qué es una meta (ahorro o deuda) y cuándo es válida
  utils/money.js        Convertir y dar formato al dinero
  utils/dates.js        Ayudas para fechas
  ui/                   Cada archivo dibuja una parte de la pantalla
    summary.js            Inicio: saldo y totales del mes
    transactionList.js    Inicio: lista de movimientos
    transactionForm.js    Hoja para crear / editar / eliminar un movimiento
    dashboard.js          Resumen: gastos del mes
    charts.js             Las gráficas del resumen (SVG hecho a mano)
    goals.js              Metas: ahorro y deudas
    goalForm.js           Hojas para crear una meta y registrar abonos
    toast.js              Aviso "Eliminado · Deshacer"
    backup.js             Exportar / importar respaldo
    dom.js                Ayudas para crear elementos HTML y SVG
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

- **Lo que se puede calcular no se guarda.** El avance de una meta se obtiene
  sumando sus abonos cada vez; así nunca hay dos números que se contradigan.
- **Ahorro y deudas comparten el mismo código.** Por dentro son lo mismo (un
  monto objetivo y una lista de abonos); solo cambian los textos, que están
  en `GOAL_TEXT` dentro de `config.js`.
- **Los datos tienen versión.** `storage.js` lee tanto el formato viejo (sin
  metas) como el nuevo, para que actualizar la app no borre nada.
- **Barras en vez de pastel, y un solo color.** Comparar largos es más exacto
  que comparar ángulos, y el color no hace falta cuando cada barra ya tiene
  su nombre al lado.

## Cómo se relacionan el saldo y las metas

Son independientes: aportar a una meta de ahorro o abonar a una deuda **no**
cambia el saldo total. Si pagaste una deuda con tu dinero, regístralo también
como gasto en Inicio. (Conectar ambas cosas es el ejercicio 6.)

## Al publicar una versión nueva

En `sw.js` sube `CACHE_VERSION` (`finanzas-v1` → `finanzas-v2`) y agrega a
`ASSETS` cualquier archivo nuevo. Si no, el teléfono seguirá mostrando la
versión anterior.

## Pruebas

Con Node.js instalado: `npm test`.

## Ejercicios para practicar (de fácil a difícil)

1. Agrega una categoría nueva en `config.js`.
2. Cambia el color de las gráficas (`--chart`) en la sección 1 de `styles.css`.
3. Agrega una tercera tarjeta al Resumen con el gasto más grande del mes
   (pista: mira cómo `dashboard.js` usa `card()`).
4. Escribe un selector `incomeByCategory` en `selectors.js`, con su test en
   `tests/logic.test.js`, copiando la idea de `expensesByCategory`.
5. Muestra en la pestaña Metas la fecha del último abono de cada meta.
6. Haz que al abonar a una deuda se cree también un gasto automáticamente
   (pista: en `app.js`, dentro de `onSave` de `entryForm`, puedes llamar a
   `store.addTransaction`; necesitarás una categoría "Deudas").

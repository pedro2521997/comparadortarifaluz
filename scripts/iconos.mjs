// Símbolos de las dos webs y todos sus iconos, a partir de un único dibujo por marca (cuadro redondeado con la
// inicial en blanco y un punto de color):
//  - ComparadorTarifaLuz: «C» sobre verde y punto menta (la luz encendida).
//  - PowerPriceNow: «P» sobre naranja y punto amarillo (el precio de ahora).
// Escribe en public/ de cada web: favicon.svg, favicon.ico (32 y 48), apple-touch-icon.png (180), icono-192.png,
// icono-512.png (a sangre, para iOS y Android) y logo.png (512, para Google y redes sociales).
// Los componentes del logotipo (apps/web/src/components/Logo.astro y apps/global/src/components/Logo.astro)
// llevan el mismo dibujo: si cambia aquí, hay que cambiarlo allí.
//
// Uso: node scripts/iconos.mjs

import sharp from "sharp";
import { writeFileSync } from "node:fs";

const MARCAS = {
  web: {
    defs: "",
    fondo: "#104336",
    dibujo: `<path d="M31.71 14.81A12 12 0 1 0 31.71 33.19" fill="none" stroke="#fff" stroke-width="7"/><circle cx="32" cy="24" r="4.5" fill="#0fff87"/>`,
  },
  global: {
    defs: `<defs><linearGradient id="ppn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F97316"/><stop offset="1" stop-color="#C2410C"/></linearGradient></defs>`,
    fondo: "url(#ppn)",
    dibujo: `<path d="M17 35.5V12.5H25.5a7.75 7.75 0 0 1 0 15.5H17" fill="none" stroke="#fff" stroke-width="6.5" stroke-linejoin="round"/><circle cx="33.5" cy="33.5" r="4.2" fill="#FDE047"/>`,
  },
};

/** Cuadro con las esquinas redondeadas (favicon, logo) o a sangre con el dibujo algo más pequeño (iconos de app). */
const svg = (m, sangre = false) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${m.defs}<rect width="48" height="48" rx="${sangre ? 0 : 12}" fill="${m.fondo}"/>${
    sangre ? `<g transform="translate(4.8 4.8) scale(.8)">${m.dibujo}</g>` : m.dibujo
  }</svg>`;

const png = (s, n) => sharp(Buffer.from(s), { density: Math.ceil(72 * (n / 48) * 2) }).resize(n, n).png().toBuffer();

/** favicon.ico con PNG dentro (lo admiten todos los navegadores actuales). */
async function ico(s, tams) {
  const imgs = await Promise.all(tams.map((n) => png(s, n)));
  const cab = Buffer.alloc(6 + 16 * tams.length);
  cab.writeUInt16LE(0, 0);
  cab.writeUInt16LE(1, 2);
  cab.writeUInt16LE(tams.length, 4);
  let off = cab.length;
  tams.forEach((n, i) => {
    const e = 6 + 16 * i;
    cab.writeUInt8(n, e);
    cab.writeUInt8(n, e + 1);
    cab.writeUInt16LE(1, e + 4);
    cab.writeUInt16LE(32, e + 6);
    cab.writeUInt32LE(imgs[i].length, e + 8);
    cab.writeUInt32LE(off, e + 12);
    off += imgs[i].length;
  });
  return Buffer.concat([cab, ...imgs]);
}

for (const [app, m] of Object.entries(MARCAS)) {
  const dir = new URL(`../apps/${app}/public/`, import.meta.url);
  const redondo = svg(m);
  const cuadrado = svg(m, true);
  writeFileSync(new URL("favicon.svg", dir), redondo);
  writeFileSync(new URL("favicon.ico", dir), await ico(redondo, [32, 48]));
  writeFileSync(new URL("apple-touch-icon.png", dir), await png(cuadrado, 180));
  writeFileSync(new URL("icono-192.png", dir), await png(cuadrado, 192));
  writeFileSync(new URL("icono-512.png", dir), await png(cuadrado, 512));
  writeFileSync(new URL("logo.png", dir), await png(redondo, 512));
  console.log(`${app}: iconos listos`);
}

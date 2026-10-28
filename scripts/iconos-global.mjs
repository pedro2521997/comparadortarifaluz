// Iconos naranjas de PowerPriceNow a partir del mismo dibujo que favicon.svg.
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
const dir = process.argv[2];
const redondo = readFileSync(`${dir}/favicon.svg`);
// Para iOS/Android: fondo naranja a sangre (sin transparencias) y el rayo un poco más pequeño.
const cuadrado = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FB923C"/><stop offset="1" stop-color="#EA580C"/></linearGradient></defs><rect width="32" height="32" fill="url(#f)"/><g transform="translate(3.2 3.2) scale(.8)"><path d="M18 5 9 18h6l-2 9 10-14h-6l1-8z" fill="#FDE047" stroke="#FEF08A" stroke-width=".6" stroke-linejoin="round"/></g></svg>`);
const png = (svg, n) => sharp(svg, { density: 72 * (n / 32) * 2 }).resize(n, n).png().toBuffer();
writeFileSync(`${dir}/apple-touch-icon.png`, await png(cuadrado, 180));
writeFileSync(`${dir}/icono-192.png`, await png(cuadrado, 192));
writeFileSync(`${dir}/icono-512.png`, await png(cuadrado, 512));
// favicon.ico con dos tamaños (PNG dentro del ICO, lo admiten todos los navegadores actuales).
const tam = [32, 48];
const imgs = await Promise.all(tam.map((n) => png(redondo, n)));
const cab = Buffer.alloc(6 + 16 * tam.length);
cab.writeUInt16LE(0, 0); cab.writeUInt16LE(1, 2); cab.writeUInt16LE(tam.length, 4);
let off = cab.length;
tam.forEach((n, i) => {
  const e = 6 + 16 * i;
  cab.writeUInt8(n, e); cab.writeUInt8(n, e + 1); cab.writeUInt8(0, e + 2); cab.writeUInt8(0, e + 3);
  cab.writeUInt16LE(1, e + 4); cab.writeUInt16LE(32, e + 6); cab.writeUInt32LE(imgs[i].length, e + 8); cab.writeUInt32LE(off, e + 12);
  off += imgs[i].length;
});
writeFileSync(`${dir}/favicon.ico`, Buffer.concat([cab, ...imgs]));
console.log("ok");

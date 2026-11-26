// Descarga el icono oficial de cada comercializadora del catálogo (apple-touch-icon o favicon de su web)
// a apps/web/public/logos/ y escribe data/logos.json { dominio: ruta }. Se sirven desde nuestro dominio:
// la web no carga nada de terceros. Los logotipos son de sus titulares y solo identifican cada oferta.
//
// Uso: node scripts/logos.mjs [--forzar]

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const RAIZ = new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const DESTINO = join(RAIZ, "apps/web/public/logos");
const INDICE = join(RAIZ, "data/logos.json");
const forzar = process.argv.includes("--forzar");
mkdirSync(DESTINO, { recursive: true });

const leer = (f) => JSON.parse(readFileSync(join(RAIZ, f), "utf8"));
const tarifas = [...leer("data/tarifas.json").tarifas, ...leer("data/tarifas-manuales.json").tarifas];
export const dominio = (url) => (url || "").replace(/^https?:\/\/(www\.)?/, "").split("/")[0].toLowerCase();

// Dominio de la marca cuando el de la oferta no es el principal (subdominios, landings).
const AJUSTES = { "es.met.com": "met.com", "cnmc.es": null };
const dominios = [...new Set(tarifas.map((t) => dominio(t.url_contratar || t.url_fuente)))].filter((d) => d && AJUSTES[d] !== null);

// Revisados a mano: webs que bloquean la portada o cuyo icono no es su marca.
const MANUAL = {
  "endesa.com": "https://www.endesa.com/content/dam/endesa-com/endesa_logo.svg",
  "inerenergia.es": "https://www.inerenergia.es/static/img/favicon/favicon.ico",
};
// Su icono no los identifica (el de WordPress por defecto, un recorte o un círculo vacío): mejor las iniciales.
const EXCLUIR = new Set(["adxenergia.es", "hscomercializadora.com"]);
// Preparados a mano y guardados en el repositorio; el script no los toca ni con --forzar:
// - chcenergia.es: su favicon.svg oficial pesa 3,9 MB (lleva imágenes dentro); se pasó a PNG de 180 px.
// - iberdrola.es: su web bloquea las descargas automáticas; es su isotipo oficial (Wikimedia Commons,
//   «Isotipo Iberdrola (2023).svg») pasado a PNG de 180 px.
// - masnorte.es: su favicon es solo la «O» amarilla del logotipo; se usa el logotipo completo
//   (masnorte_logo.svg de su web) en PNG de 360×61.
const A_MANO = new Set(["chcenergia.es", "iberdrola.es", "masnorte.es"]);

const indice = existsSync(INDICE) ? JSON.parse(readFileSync(INDICE, "utf8")) : {};
for (const d of EXCLUIR) delete indice[d];
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

async function traer(url, ms = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { headers: { "User-Agent": UA, Accept: "*/*" }, redirect: "follow", signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

/** Ancho de un PNG (cabecera IHDR) o de un ICO (mayor de sus imágenes); 0 si no se sabe. */
function ancho(buf, tipo) {
  if (tipo === "png" && buf.length > 24) return buf.readUInt32BE(16);
  if (tipo === "ico" && buf.length > 6) {
    let max = 0;
    for (let i = 0; i < buf.readUInt16LE(4); i++) max = Math.max(max, buf[6 + i * 16] || 256);
    return max;
  }
  if (tipo === "svg") return 512;
  return 0;
}

function tipoDe(buf, ct) {
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf[0] === 0xff && buf[1] === 0xd8) return "jpg";
  if (buf.slice(0, 4).toString("latin1") === "RIFF" && buf.slice(8, 12).toString("latin1") === "WEBP") return "webp";
  if (buf[0] === 0 && buf[1] === 0 && buf[2] === 1 && buf[3] === 0) return "ico";
  const txt = buf.slice(0, 400).toString("utf8").toLowerCase();
  if (/svg/.test(ct) || txt.includes("<svg")) return "svg";
  return null;
}

/** Los SVG pueden llevar scripts: solo se aceptan sin <script>, sin manejadores on…= y sin referencias externas. */
const svgSeguro = (s) => !/<script|\son[a-z]+\s*=|javascript:|<foreignobject|xlink:href\s*=\s*["']https?:|href\s*=\s*["']https?:/i.test(s);

async function candidatos(d) {
  const base = `https://${d}/`;
  const lista = [];
  try {
    const r = await traer(base);
    const html = (await r.text()).slice(0, 400000);
    const final = r.url || base;
    for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
      const tag = m[0];
      const rel = /rel\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase() ?? "";
      const href = /href\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
      if (!href || !/icon/.test(rel) || /mask-icon/.test(rel)) continue;
      const tam = Number(/sizes\s*=\s*["'](\d+)/i.exec(tag)?.[1] ?? 0);
      const prioridad = (/apple-touch-icon/.test(rel) ? 1000 : 0) + (tam || (/\.svg/i.test(href) ? 400 : 32));
      lista.push({ url: new URL(href.replace(/&amp;/g, "&"), final).href, prioridad });
    }
  } catch {
    /* web caída o que no deja entrar: probamos rutas habituales */
  }
  lista.push({ url: `${base}apple-touch-icon.png`, prioridad: 900 }, { url: `${base}favicon.ico`, prioridad: 1 });
  return lista.sort((a, b) => b.prioridad - a.prioridad);
}

for (const d of dominios) {
  if ((indice[d] && !forzar) || EXCLUIR.has(d) || A_MANO.has(d)) continue;
  let guardado = null;
  for (const c of MANUAL[d] ? [{ url: MANUAL[d], prioridad: 9999 }] : await candidatos(d)) {
    try {
      const r = await traer(c.url);
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 100 || buf.length > 400_000) continue;
      const tipo = tipoDe(buf, r.headers.get("content-type") ?? "");
      if (!tipo) continue;
      if (tipo === "svg" && !svgSeguro(buf.toString("utf8"))) continue;
      const w = ancho(buf, tipo);
      if (w && w < 32) continue; // demasiado pequeño para verse bien
      const fichero = `${d.replace(/[^a-z0-9.-]/g, "")}.${tipo}`;
      writeFileSync(join(DESTINO, fichero), buf);
      guardado = `/logos/${fichero}`;
      console.log(`✓ ${d} ← ${c.url} (${tipo}${w ? `, ${w}px` : ""})`);
      break;
    } catch {
      /* siguiente candidato */
    }
  }
  if (guardado) indice[d] = guardado;
  else console.log(`✗ ${d}: sin icono utilizable (se verán las iniciales)`);
}

writeFileSync(INDICE, JSON.stringify(Object.fromEntries(Object.entries(indice).sort()), null, 2) + "\n");
console.log(`${Object.keys(indice).length} de ${dominios.length} comercializadoras con logo.`);

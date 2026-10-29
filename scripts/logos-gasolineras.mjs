// Descarga el icono oficial de cada marca de gasolineras (apple-touch-icon o favicon de su web) para el mapa, las
// listas y las fichas de PowerPriceNow. Se guarda como PNG de 96×96 en apps/global/public/marcas/<id>.png y la
// lista de marcas con logo en apps/global/src/lib/logos-marcas.json (la lee lib/marcas.ts). Se sirven desde nuestro
// dominio: el mapa no carga nada de terceros. Los logotipos son de sus titulares y solo identifican cada gasolinera.
// Las marcas sin icono utilizable siguen con su insignia de colores. No hace falta repetirlo: las imágenes van al
// repositorio. Para añadir una marca: su dominio en DOMINIOS y volver a ejecutarlo.
//
// Uso: node scripts/logos-gasolineras.mjs [--forzar] [id…]

import sharp from "sharp";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";

const DESTINO = new URL("../apps/global/public/marcas/", import.meta.url);
const INDICE = new URL("../apps/global/src/lib/logos-marcas.json", import.meta.url);
mkdirSync(DESTINO, { recursive: true });

/** id de la marca (lib/marcas.ts) → webs de las que se puede tomar el icono, por orden. */
const DOMINIOS = {
  repsol: ["repsol.com", "repsol.es"],
  campsa: ["campsa.es", "campsaexpress.es"],
  petronor: ["petronor.com", "petronor.eus"],
  moeve: "moeveglobal.com",
  cepsa: "cepsa.es",
  galp: "galp.com",
  ballenoil: "ballenoil.es",
  plenergy: "plenergy.es",
  shell: "shell.es",
  petroprix: "petroprix.com",
  bp: "bp.com",
  carrefour: ["carrefour.es", "carrefour.com"],
  avia: ["avia.es", "avia-international.com"],
  q8: ["q8.it", "q8.com"],
  esclatoil: ["esclatoil.com", "esclatoil.es"],
  bonarea: ["bonarea.com", "bonarea-agrupa.net"],
  valcarce: "grupovalcarce.com",
  agla: "agla.es",
  alcampo: ["alcampo.es", "auchan.fr"],
  eni: "eni.com",
  gasexpress: "gasexpress.es",
  eroski: "eroski.es",
  beroil: "beroil.es",
  meroil: "meroil.es",
  tamoil: ["tamoil.it", "tamoil.es"],
  disa: ["disagrupo.es", "disa.es"],
  naturgy: "naturgy.es",
  petrocat: "petrocat.cat",
  autonetoil: "autonetoil.com",
  easygas: "easygas.es",
  "gm-oil": "gmoil.es",
  petromiralles: "petromiralles.com",
  supeco: "supeco.es",
  "e-leclerc": ["e.leclerc", "e-leclerc.es"],
  intermarche: ["intermarche.com", "intermarche.pt"],
  totalenergies: ["totalenergies.com", "totalenergies.es", "totalenergies.fr"],
  esso: "esso.com",
  prio: "prio.pt",
  lidl: "lidl.es",
  aldi: "aldi.es",
  makro: "makro.es",
  costco: "costco.es",
  ip: ["ip.gruppoapi.com", "gruppoapi.com"],
};
/** Revisados a mano: el icono de su web no es la marca (genérico, recortado o de la empresa madre). */
// esso.com lleva a ExxonMobil (sale el Pegaso de Mobil); gmoil.es da el icono genérico de su proveedor web;
// el de costco.es no se reconoce como la marca.
const EXCLUIR = new Set(["esso", "gm-oil", "costco"]);

const forzar = process.argv.includes("--forzar");
const pedidos = process.argv.slice(2).filter((x) => !x.startsWith("--"));
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

/** Los SVG pueden llevar scripts: solo se aceptan sin <script>, sin manejadores on…= y sin referencias externas. */
const svgSeguro = (s) => !/<script|\son[a-z]+\s*=|javascript:|<foreignobject|xlink:href\s*=\s*["']https?:|href\s*=\s*["']https?:/i.test(s);

/** Iconos que anuncia la portada, del mejor al peor (apple-touch-icon y los más grandes primero). */
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
  // Último recurso: el icono que Google tiene guardado de esa web (a veces la portada no deja entrar a un programa).
  lista.push({ url: `https://www.google.com/s2/favicons?domain=${d}&sz=128`, prioridad: 0 });
  return lista.sort((a, b) => b.prioridad - a.prioridad);
}

/** Imagen que sharp sabe leer; de un ICO, la mayor de las imágenes PNG que lleva dentro. */
function legible(buf) {
  if (buf[0] === 0 && buf[1] === 0 && buf[2] === 1 && buf[3] === 0) {
    let mejor = null;
    for (let i = 0; i < buf.readUInt16LE(4); i++) {
      const e = 6 + i * 16;
      const w = buf[e] || 256;
      const tam = buf.readUInt32LE(e + 8);
      const off = buf.readUInt32LE(e + 12);
      const img = buf.subarray(off, off + tam);
      if (img.subarray(1, 4).toString("latin1") === "PNG" && (!mejor || w > mejor.w)) mejor = { w, img };
    }
    return mejor?.img ?? null;
  }
  const txt = buf.subarray(0, 400).toString("utf8").toLowerCase();
  if (txt.includes("<svg") && !svgSeguro(buf.toString("utf8"))) return null;
  return buf;
}

const ids = pedidos.length ? pedidos : Object.keys(DOMINIOS);
for (const id of ids) {
  const fichero = new URL(`${id}.png`, DESTINO);
  if ((existsSync(fichero) && !forzar) || EXCLUIR.has(id)) continue;
  let ok = false;
  const doms = [DOMINIOS[id]].flat();
  for (const c of (await Promise.all(doms.map(candidatos))).flat()) {
    try {
      const r = await traer(c.url);
      if (!r.ok) continue;
      const buf = legible(Buffer.from(await r.arrayBuffer()));
      if (!buf || buf.length < 100 || buf.length > 600_000) continue;
      const meta = await sharp(buf, { density: 300 }).metadata();
      if ((meta.width ?? 0) < 48 && meta.format !== "svg") continue; // demasiado pequeño para verse bien
      // Cuadrado de 96 px sobre blanco: así se ve igual en el mapa (dentro de un círculo) que en las listas.
      const png = await sharp(buf, { density: 300 }).resize(96, 96, { fit: "contain", background: "#ffffff" }).flatten({ background: "#ffffff" }).png().toBuffer();
      writeFileSync(fichero, png);
      console.log(`✓ ${id} ← ${c.url} (${meta.format}, ${meta.width}px)`);
      ok = true;
      break;
    } catch {
      /* siguiente candidato */
    }
  }
  if (!ok) console.log(`✗ ${id}: sin icono utilizable (se verá su insignia)`);
}

const conLogo = readdirSync(DESTINO)
  .filter((f) => f.endsWith(".png"))
  .map((f) => f.slice(0, -4))
  .filter((id) => DOMINIOS[id] && !EXCLUIR.has(id))
  .sort();
writeFileSync(INDICE, JSON.stringify(conLogo) + "\n");
console.log(`${conLogo.length} de ${Object.keys(DOMINIOS).length} marcas con logo.`);

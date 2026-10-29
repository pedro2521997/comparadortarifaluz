// Nomenclátor para el buscador de los mapas de gasolineras: todas las localidades de cada país con sus
// coordenadas, también las que no tienen gasolinera (así se puede buscar un pueblo y ver las más cercanas).
// Fuente: GeoNames (CC BY 4.0, https://www.geonames.org/): todos los municipios (communes en Francia) y los núcleos
// de población con habitantes; en España y Portugal también las aldeas sin dato de población (en Galicia o Asturias
// son la mayoría de los pueblos). Sin barrios, históricos ni abandonados. Se guarda en apps/global/public/localidades/<cc>.json y va al repositorio: no hace
// falta volver a ejecutarlo (los pueblos no cambian), salvo para añadir un país.
//
// Formato: { r: [nombres de provincia/región], l: [[nombre, lat, lon, índice de r], …] } de mayor a menor población.
//
// Uso: node scripts/localidades.mjs [ES FR PT]   (Italia no está: sin mapa, y sus nombres de provincia vienen mal)

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DEPARTAMENTOS } from "../apps/global/src/lib/departamentos.mjs";

const DESTINO = new URL("../apps/global/public/localidades/", import.meta.url);
mkdirSync(DESTINO, { recursive: true });
const BASE = "https://download.geonames.org/export/dump/";
/** Nivel administrativo que hace de provincia en cada país: España y Francia el 2; Portugal (distritos) el 1. */
const NIVEL = { ES: 2, FR: 2, PT: 1 };
/** Código GeoNames de los municipios de cada país. */
const MUNICIPIO = { ES: "ADM3", FR: "ADM4", PT: "ADM2" };
/** Países en los que también entran los núcleos sin dato de población. */
const ALDEAS = new Set(["ES", "PT"]);
/** «Provincia de Madrid» → «Madrid»; «Distrito de Lisboa» → «Lisboa»; «Département du Rhône» → «Rhône». */
const region = (s) =>
  s?.replace(/^(Provincia|Província|Provintzia|Province|Distrito|Città metropolitana|Metropolitan City|Libero consorzio comunale|Département)( autonoma)?( of| de la| de l'| de| di| do| da| du| des| d')?\s+/i, "").replace(/^d'/, "");
/** Ciudades que GeoNames trae con el nombre en inglés. */
const EXONIMOS = { Lisbon: "Lisboa", Seville: "Sevilla", Cordoba: "Córdoba", Saragossa: "Zaragoza", Corunna: "A Coruña" };
/** Barrios (PPLX), históricos (PPLH), abandonados (PPLQ) y destruidos (PPLW) no son sitios a los que ir. */
const FUERA = new Set(["PPLX", "PPLH", "PPLQ", "PPLW", "PPLCH"]);

async function texto(url) {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`${url}: ${r.status}`);
      return Buffer.from(await r.arrayBuffer());
    } catch (e) {
      if (i === 3) throw e;
      await new Promise((ok) => setTimeout(ok, 5000 * i));
    }
  }
}
const tabla = (buf) => buf.toString("utf8").split("\n").filter(Boolean).map((l) => l.split("\t"));

for (const cc of process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(NIVEL)) {
  const tmp = mkdtempSync(join(tmpdir(), "geonames-"));
  writeFileSync(join(tmp, `${cc}.zip`), await texto(`${BASE}${cc}.zip`));
  execFileSync("unzip", ["-o", "-q", join(tmp, `${cc}.zip`), `${cc}.txt`, "-d", tmp]);
  const filas = tabla(readFileSync(join(tmp, `${cc}.txt`)));
  rmSync(tmp, { recursive: true, force: true });

  // Nombre de cada provincia/región en el idioma del país (GeoNames los da a menudo en inglés: «Upper Garonne»,
  // «Lisbon»). España: el de la provincia; Francia: la tabla de departamentos; Portugal: el de la capital del
  // distrito, que se llama igual (Porto, Braga…; la de Lisboa también viene en inglés).
  const admin = new Map();
  const codigo = (c) => (NIVEL[cc] === 1 ? c[10] : `${c[10]}.${c[11]}`);
  for (const c of filas) {
    if (cc === "ES" && c[6] === "A" && c[7] === "ADM2") admin.set(codigo(c), c[1]);
    if (cc === "PT" && (c[7] === "PPLA" || c[7] === "PPLC")) admin.set(codigo(c), c[1] === "Lisbon" ? "Lisboa" : c[1]);
  }
  if (cc === "FR") for (const [d, n] of Object.entries(DEPARTAMENTOS)) admin.set(`${filas.find((c) => c[11] === d)?.[10]}.${d}`, n);

  const regiones = [];
  const indice = new Map();
  const l = [];
  // Rejilla de ~0,2° para buscar sitios cercanos sin recorrer toda la lista.
  const rejilla = new Map();
  const celda = (lat, lon) => `${Math.floor(lat * 5)},${Math.floor(lon * 5)}`;
  const vecinos = (lat, lon) => {
    const [a, b] = [Math.floor(lat * 5), Math.floor(lon * 5)];
    const r = [];
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) r.push(...(rejilla.get(`${a + i},${b + j}`) ?? []));
    return r;
  };
  const km = (x, lat, lon) => 111 * Math.hypot(x[1] - lat, (x[2] - lon) * Math.cos((lat * Math.PI) / 180));
  // «Seville» y «Sevilla», «Cordoba» y «Córdoba», «Palma» y «Palma de Mallorca», «Lisbon» y «Lisboa»: el mismo sitio.
  const plano = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const parecido = (a, b) => {
    const [x, y] = [plano(a), plano(b)];
    if (x === y || x.startsWith(`${y} `) || y.startsWith(`${x} `) || x.startsWith(`${y}/`) || y.startsWith(`${x}/`)) return true;
    if (x.slice(0, 4) !== y.slice(0, 4) || Math.abs(x.length - y.length) > 2) return false;
    let dif = 0;
    for (let i = 0; i < Math.max(x.length, y.length); i++) if (x[i] !== y[i]) dif++;
    return dif <= 2;
  };
  // [1] nombre, [4] lat, [5] lon, [6] clase, [7] código, [10] admin1, [11] admin2, [14] población
  // Los distritos de París, Lyon y Marsella («Paris 15 Vaugirard») salen como communes: sobran, ya está la ciudad.
  const vale = (c) =>
    ((c[6] === "A" && c[7] === MUNICIPIO[cc]) || (c[6] === "P" && !FUERA.has(c[7]) && (Number(c[14]) > 0 || ALDEAS.has(cc)))) && !/^(Paris|Lyon|Marseille) \d/.test(c[1]);
  // Primero los núcleos (la posición del pueblo) y luego los municipios (el centro de su término, que puede caer
  // lejos del pueblo). Si un municipio coincide con un núcleo cercano de nombre parecido, se quedan la posición y el
  // nombre del núcleo (los municipios grandes vienen a veces en inglés: «Seville») y la población del municipio.
  const orden = (c) => (c[6] === "P" ? 0 : 1);
  for (const c of filas.filter(vale).sort((a, b) => orden(a) - orden(b) || Number(b[14]) - Number(a[14]))) {
    if (!c[1]) continue;
    const reg = region(admin.get(codigo(c)));
    const lat = Math.round(Number(c[4]) * 1000) / 1000;
    const lon = Math.round(Number(c[5]) * 1000) / 1000;
    let ri = -1;
    if (reg) {
      if (!indice.has(reg)) indice.set(reg, regiones.push(reg) - 1);
      ri = indice.get(reg);
    }
    const igual = vecinos(lat, lon).find((x) => x[3] === ri && km(x, lat, lon) < 15 && parecido(x[0], c[1]));
    if (igual) {
      igual.pob = Math.max(igual.pob, Number(c[14]));
      continue;
    }
    const x = Object.assign([EXONIMOS[c[1]] ?? c[1], lat, lon, ri], { pob: Number(c[14]) });
    rejilla.set(celda(lat, lon), [...(rejilla.get(celda(lat, lon)) ?? []), x]);
    l.push(x);
  }
  l.sort((a, b) => b.pob - a.pob);
  writeFileSync(new URL(`${cc.toLowerCase()}.json`, DESTINO), JSON.stringify({ r: regiones, l: l.map((x) => [...x]) }));
  console.log(`${cc}: ${l.length} localidades`);
}

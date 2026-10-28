// Precios de carburantes:
//  1. España, cada gasolinera (Ministerio para la Transición Ecológica, API REST pública, se actualiza cada ~30 min):
//     - data/carburantes/estaciones.json  → foto completa de hoy (no va al repositorio: se descarga en cada build)
//     - data/carburantes/resumen/AAAA-MM-DD.json → medias nacionales y por provincia (sí va al repositorio: histórico)
//  2. Europa, semanal (Comisión Europea, Weekly Oil Bulletin, «reproduction is authorised provided the source is
//     acknowledged»): data/carburantes-ue.json con gasolina 95, gasóleo, gasóleo de calefacción y GLP por país,
//     con y sin impuestos, en €/litro.
//
// Uso: node scripts/carburantes.mjs [--solo-es | --solo-ue]

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { leerXlsx } from "./lib/xlsx.mjs";

const DIR = new URL("../data/carburantes/", import.meta.url);
const UE = new URL("../data/carburantes-ue.json", import.meta.url);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const num = (s) => (s ? Number(String(s).replace(",", ".")) : null);

/** Carburantes que se publican (clave corta → campo de la API del Ministerio). */
export const PRODUCTOS_ES = {
  g95: "Precio Gasolina 95 E5",
  g98: "Precio Gasolina 98 E5",
  diesel: "Precio Gasoleo A",
  dieselPremium: "Precio Gasoleo Premium",
  glp: "Precio Gases licuados del petróleo",
  gnc: "Precio Gas Natural Comprimido",
  adblue: "Precio Adblue",
};

async function descargar(url, opciones = {}) {
  for (let i = 1; i <= 3; i++) {
    try {
      const r = await fetch(url, { ...opciones, signal: AbortSignal.timeout(120000) });
      if (r.ok) return r;
    } catch {
      /* reintento */
    }
    await espera(5000 * i);
  }
  throw new Error(`No responde: ${url}`);
}

/** "27/10/2026 11:57:43" → { fecha: "2026-10-27", hora: "11:57" }. Antes de las 10 la hora viene con una cifra («9:51:13»). */
export function fechaMinisterio(s) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{1,2}):(\d{2})/.exec(s);
  return m ? { fecha: `${m[3]}-${m[2]}-${m[1]}`, hora: `${m[4].padStart(2, "0")}:${m[5]}` } : null;
}

/** Medias, mínimo y número de gasolineras por carburante. */
export function estadisticas(estaciones) {
  const out = {};
  for (const k of Object.keys(PRODUCTOS_ES)) {
    const v = estaciones.map((e) => e.p[k]).filter((x) => x > 0);
    if (!v.length) continue;
    out[k] = { media: Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 1000) / 1000, min: Math.min(...v), max: Math.max(...v), n: v.length };
  }
  return out;
}

export function compactar(e) {
  const p = {};
  for (const [k, campo] of Object.entries(PRODUCTOS_ES)) {
    const v = num(e[campo]);
    if (v && v > 0.2 && v < 5) p[k] = v;
  }
  return {
    id: e.IDEESS,
    rotulo: (e["Rótulo"] ?? "").trim(),
    dir: (e["Dirección"] ?? "").trim(),
    mun: (e.Municipio ?? "").trim(),
    idMun: e.IDMunicipio,
    prov: e.IDProvincia,
    cp: e["C.P."],
    lat: num(e.Latitud),
    lon: num(e["Longitud (WGS84)"]),
    horario: (e.Horario ?? "").trim(),
    p,
  };
}

/** El Ministerio a veces responde con un error o con la lista vacía: se reintenta antes de rendirse. */
async function listaMinisterio() {
  for (let i = 1; ; i++) {
    try {
      const r = await descargar("https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/", { headers: { Accept: "application/json" } });
      const j = await r.json();
      if (j.ResultadoConsulta === "OK" && fechaMinisterio(j.Fecha) && j.ListaEESSPrecio?.length) return j;
      throw new Error(`Ministerio: respuesta inesperada (${String(j.ResultadoConsulta ?? "").slice(0, 80)})`);
    } catch (e) {
      if (i >= 4) throw e;
      console.error(`${e.message}; reintento ${i} de 3`);
      await espera(20000 * i);
    }
  }
}

async function espana() {
  const j = await listaMinisterio();
  const cuando = fechaMinisterio(j.Fecha);
  // Solo gasolineras de venta al público (las «R» son de uso restringido, p. ej. cooperativas o flotas).
  const estaciones = j.ListaEESSPrecio.filter((e) => e["Tipo Venta"] === "P").map(compactar).filter((e) => Object.keys(e.p).length);
  mkdirSync(new URL("resumen/", DIR), { recursive: true });
  writeFileSync(new URL("estaciones.json", DIR), JSON.stringify({ ...cuando, estaciones }));
  const provincias = {};
  for (const id of new Set(estaciones.map((e) => e.prov))) provincias[id] = estadisticas(estaciones.filter((e) => e.prov === id));
  const resumen = { ...cuando, nacional: estadisticas(estaciones), provincias };
  writeFileSync(new URL(`resumen/${cuando.fecha}.json`, DIR), JSON.stringify(resumen) + "\n");
  console.log(`España: ${estaciones.length} gasolineras (${cuando.fecha} ${cuando.hora}). Gasolina 95: ${resumen.nacional.g95?.media} €/l · Gasóleo A: ${resumen.nacional.diesel?.media} €/l`);
}

// ---------------- Europa (Weekly Oil Bulletin) ----------------

const PRODUCTOS_UE = { euro95: 0, diesel: 1, calefaccion: 2, glp: 5 }; // posición dentro del bloque de cada país
const SEMANAS = 160; // unos tres años

async function urlHistorico() {
  try {
    const html = await (await descargar("https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en")).text();
    const m = /href="([^"]*Prices_History[^"]*\.xlsx[^"]*)"/i.exec(html);
    if (m) return new URL(m[1].replace(/&amp;/g, "&"), "https://energy.ec.europa.eu").href;
  } catch {
    /* se usa la dirección conocida */
  }
  return "https://energy.ec.europa.eu/document/download/906e60ca-8b6a-44e7-8589-652854d2fd3f_en?filename=Weekly_Oil_Bulletin_Prices_History_maticni_4web.xlsx";
}

const fechaExcel = (n) => new Date(Date.UTC(1899, 11, 30) + n * 86400000).toISOString().slice(0, 10);

/** Hoja de precios → { semanas: [fecha…] (de la más antigua a la más reciente), paises: { ES: { euro95: [€/l…] … } } } */
export function leerHoja(filas, sufijo) {
  const cab = filas[0];
  const bloques = cab
    .map((c, i) => [c, i])
    .filter(([c]) => typeof c === "string" && c.endsWith(`_${sufijo}_euro95`))
    .map(([c, i]) => [c.split("_")[0], i])
    .filter(([cc]) => /^[A-Z]{2}$/.test(cc));
  const datos = filas.slice(3).filter((f) => typeof f[0] === "number").slice(0, SEMANAS).reverse();
  const semanas = datos.map((f) => fechaExcel(f[0]));
  const paises = {};
  for (const [cc, i] of bloques) {
    paises[cc] = {};
    for (const [k, off] of Object.entries(PRODUCTOS_UE)) {
      const serie = datos.map((f) => (typeof f[i + off] === "number" && f[i + off] > 0 ? Math.round(f[i + off]) / 1000 : null));
      if (serie.some((x) => x !== null)) paises[cc][k] = serie;
    }
  }
  return { semanas, paises };
}

async function europa() {
  const url = await urlHistorico();
  const buf = Buffer.from(await (await descargar(url)).arrayBuffer());
  const hojas = leerXlsx(buf);
  const con = leerHoja(hojas.get("Prices with taxes"), "price_with_tax");
  const sin = leerHoja(hojas.get("Prices wo taxes"), "price_wo_tax");
  if (!con.semanas.length) throw new Error("Boletín petrolero: sin datos");
  const salida = { actualizado: con.semanas.at(-1), fuente: "European Commission, Weekly Oil Bulletin", semanas: con.semanas, conImpuestos: con.paises, sinImpuestos: sin.paises };
  writeFileSync(UE, JSON.stringify(salida) + "\n");
  console.log(`Europa: ${Object.keys(con.paises).length} países, semana del ${salida.actualizado}`);
}

async function main() {
  const arg = process.argv[2];
  if (arg !== "--solo-ue") await espana().catch((e) => console.warn(`España: ${e.message}`));
  if (arg !== "--solo-es") {
    // El boletín es semanal: basta con descargarlo una vez al día.
    const previo = existsSync(UE) ? JSON.parse(readFileSync(UE, "utf8")) : null;
    const hoy = new Date().toISOString().slice(0, 10);
    if (!previo || previo._descargado !== hoy) {
      await europa().catch((e) => console.warn(`Europa: ${e.message}`));
      if (existsSync(UE)) {
        const j = JSON.parse(readFileSync(UE, "utf8"));
        writeFileSync(UE, JSON.stringify({ ...j, _descargado: hoy }) + "\n");
      }
    }
  }
}

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();

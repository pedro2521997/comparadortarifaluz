// Gasolineras con su precio para los mapas de la web global (powerpricenow.com), un fichero por país en
// data/estaciones/<CC>.json (no va al repositorio: se descarga en cada build y GitHub Actions guarda la última copia buena).
//  - Francia: prix-carburants.gouv.fr, flujo instantáneo (Licence Ouverte 2.0).
//  - España: Ministerio para la Transición Ecológica (lo descarga antes scripts/carburantes.mjs).
//  - Italia: Ministero delle Imprese e del Made in Italy, CSV diario «prezzo alle 8» (IODL 2.0).
//  - Portugal: DGEG, Preços dos Combustíveis Online.
//
// Formato: { cc, actualizado, combustibles: [claves], e: [[lat, lon, nombre, dirección, municipio, cp, [precios], "AAAA-MM-DD", autopista]] }
// Los precios van en €/l en el mismo orden que «combustibles» (null si la gasolinera no lo vende).
//
// Uso: node scripts/estaciones-global.mjs [FR ES IT PT]

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = new URL("../data/estaciones/", import.meta.url);
const ES = new URL("../data/carburantes/estaciones.json", import.meta.url);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
/** Precios de hace más de un mes no se enseñan: la gasolinera probablemente ya no los aplica. */
const DIAS_MAX = 30;

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

const redondear = (x, d) => Math.round(x * 10 ** d) / 10 ** d;
const limpio = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
/** Precio razonable en €/l (el E85 y el GLP rondan 0,6-1 €; nada cuesta menos de 0,3 ni más de 4). */
const precio = (x) => (typeof x === "number" && x > 0.3 && x < 4 ? redondear(x, 3) : null);

/** «AVENIDA DE LA PAZ» → «Avenida de la Paz» (solo si todo viene en mayúsculas). */
export function capitalizar(s) {
  s = limpio(s);
  if (s !== s.toUpperCase()) return s;
  const menores = new Set(["de", "del", "la", "las", "el", "los", "y", "e", "di", "da", "do", "dos", "das", "des", "du", "le", "les", "et", "en", "a", "al", "s/n"]);
  const SIGLAS = new Set(["ZI", "ZA", "ZAC", "ZAE", "CC", "SS", "SP", "SR", "EN", "IC", "IP"]);
  const palabras = s.split(" ");
  return palabras
    .map((w, i) => {
      // Siglas de carretera o de polígono se quedan como están: «RN 94», «EN 109», «ZI», «N-332».
      if (/^[A-Z]{1,3}$/.test(w) && (!/[AEIOU]/.test(w) || SIGLAS.has(w) || /^\d/.test(palabras[i + 1] ?? ""))) return w;
      if (/\d/.test(w) && /^[A-Z0-9\-./]+$/.test(w)) return w;
      const l = w.toLowerCase();
      if (i > 0 && menores.has(l)) return l;
      const c = l.replace(/(^|[\-/'(.])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
      return i > 0 ? c.replace(/^([DL])'/, (x) => x.toLowerCase()) : c;
    })
    .join(" ");
}

/** Fila de salida; descarta gasolineras sin coordenadas válidas o sin ningún precio. */
export function fila({ lat, lon, nombre, dir, ciudad, cp, precios, fecha, autopista }, combustibles) {
  if (!(Math.abs(lat) > 1 && Math.abs(lon) > 0.01 && Math.abs(lat) <= 90 && Math.abs(lon) <= 180)) return null;
  const p = combustibles.map((k) => precio(precios[k]));
  if (p.every((x) => x === null)) return null;
  return [redondear(lat, 5), redondear(lon, 5), limpio(nombre), capitalizar(dir), capitalizar(ciudad), limpio(cp), p, fecha ?? "", autopista ? 1 : 0];
}

const haceDias = (iso, hoy = new Date()) => (hoy.getTime() - new Date(iso).getTime()) / 86400000;

// ---------------- Francia ----------------

const FR = { g95: "sp95", e10: "e10", g98: "sp98", diesel: "gazole", glp: "gplc", e85: "e85" };

export function francia(lista, hoy = new Date()) {
  const combustibles = Object.keys(FR);
  const e = lista
    .map((s) => {
      const precios = {};
      let fecha = "";
      for (const [k, c] of Object.entries(FR)) {
        const maj = s[`${c}_maj`];
        if (s[`${c}_prix`] == null || !maj || haceDias(maj, hoy) > DIAS_MAX) continue;
        precios[k] = s[`${c}_prix`];
        if (maj.slice(0, 10) > fecha) fecha = maj.slice(0, 10);
      }
      return fila({ lat: s.geom?.lat, lon: s.geom?.lon, nombre: "", dir: s.adresse, ciudad: s.ville, cp: s.cp, precios, fecha, autopista: s.pop === "A" }, combustibles);
    })
    .filter(Boolean);
  return { combustibles, e };
}

async function descargarFrancia() {
  const r = await descargar("https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/exports/json");
  return francia(await r.json());
}

// ---------------- España ----------------

const ES_C = ["g95", "g98", "diesel", "dieselPremium", "glp"];

/** «Palmas de Gran Canaria (Las)» → «Las Palmas de Gran Canaria»; «Hospitalet de Llobregat (L')» → «L'Hospitalet de Llobregat». */
export function municipioEs(s) {
  const m = /^(.*) \((La|El|Els|Los|Las|L'|Les|Lo|A|O|Os|As|Es|Sa|Ses|S'|Na|Era|Eras)\)$/i.exec(limpio(s));
  if (!m) return limpio(s);
  const art = m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase();
  return art.endsWith("'") ? `${art}${m[1]}` : `${art} ${m[1]}`;
}
/** Algunas gasolineras ponen de rótulo un número («Nº 10.935»): mejor sin nombre. */
const rotuloEs = (s) => (/^n[º°o.]?\s*[\d.]+$/i.test(limpio(s)) ? "" : s);

export function espana(j) {
  const e = j.estaciones
    .map((s) => fila({ lat: s.lat, lon: s.lon, nombre: rotuloEs(s.rotulo), dir: s.dir, ciudad: municipioEs(s.mun), cp: s.cp, precios: s.p, fecha: j.fecha }, ES_C))
    .filter(Boolean);
  return { combustibles: ES_C, e };
}

async function leerEspana() {
  if (!existsSync(ES)) throw new Error("Falta data/carburantes/estaciones.json (npm run carburantes)");
  const j = JSON.parse(readFileSync(ES, "utf8"));
  if (haceDias(j.fecha) > 2) throw new Error(`Datos de España antiguos (${j.fecha})`);
  return espana(j);
}

// ---------------- Italia ----------------

/** CSV del MIMIT: primera línea «Estrazione del …», luego cabecera; separador «|» (antes «;»). */
export function csvMimit(texto) {
  const lineas = texto.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  const i = lineas.findIndex((l) => /idImpianto/i.test(l));
  if (i < 0) throw new Error("CSV del MIMIT sin cabecera");
  const sep = lineas[i].includes("|") ? "|" : ";";
  const cab = lineas[i].split(sep).map((c) => c.trim());
  return lineas.slice(i + 1).map((l) => Object.fromEntries(l.split(sep).map((v, k) => [cab[k], v.trim()])));
}

const IT_C = ["g95", "diesel", "glp", "gnc"];
const IT_CARB = { benzina: "g95", gasolio: "diesel", gpl: "glp", metano: "gnc" };

/** «27/10/2026 07:12:33» → «2026-10-27» */
const fechaIt = (s) => (/^(\d{2})\/(\d{2})\/(\d{4})/.exec(s ?? "") ?? []).slice(1).reverse().join("-");

export function italia(anagrafica, prezzi, hoy = new Date()) {
  // Precio en autoservicio si lo hay (es el que paga casi todo el mundo); si no, el servido.
  const precios = new Map();
  for (const r of prezzi) {
    const k = IT_CARB[limpio(r.descCarburante).toLowerCase()];
    const fecha = fechaIt(r.dtComu);
    if (!k || !fecha || haceDias(fecha, hoy) > DIAS_MAX) continue;
    const v = Number(String(r.prezzo).replace(",", "."));
    const self = r.isSelf === "1";
    const id = r.idImpianto;
    const p = precios.get(id) ?? { fecha: "", v: {} };
    const ant = p.v[k];
    if (!ant || (self && !ant.self) || (self === ant.self && v < ant.v)) p.v[k] = { v, self };
    if (fecha > p.fecha) p.fecha = fecha;
    precios.set(id, p);
  }
  const e = anagrafica
    .map((s) => {
      const p = precios.get(s.idImpianto);
      if (!p) return null;
      const nombre = limpio(s.Bandiera) && !/pompe bianche/i.test(s.Bandiera) ? s.Bandiera : s["Nome Impianto"];
      return fila(
        {
          lat: Number(String(s.Latitudine).replace(",", ".")),
          lon: Number(String(s.Longitudine).replace(",", ".")),
          nombre: capitalizar(nombre),
          dir: s.Indirizzo,
          ciudad: s.Comune,
          cp: s.Provincia,
          precios: Object.fromEntries(Object.entries(p.v).map(([k, x]) => [k, x.v])),
          fecha: p.fecha,
          autopista: /autostrad/i.test(s["Tipo Impianto"] ?? ""),
        },
        IT_C,
      );
    })
    .filter(Boolean);
  return { combustibles: IT_C, e };
}

async function descargarItalia() {
  const base = "https://www.mimit.gov.it/images/exportCSV/";
  const [a, p] = await Promise.all(["anagrafica_impianti_attivi.csv", "prezzo_alle_8.csv"].map(async (f) => csvMimit(await (await descargar(base + f)).text())));
  return italia(a, p);
}

// ---------------- Portugal ----------------

const PT = { g95: 3201, g98: 3400, diesel: 2101, glp: 1120 };

/** «1,949 €» → 1.949 */
const precioPt = (s) => Number(String(s ?? "").replace(/[^\d,]/g, "").replace(",", "."));

export function portugal(porCombustible, hoy = new Date()) {
  const combustibles = Object.keys(PT);
  const postos = new Map();
  for (const [k, lista] of Object.entries(porCombustible))
    for (const s of lista) {
      const fecha = String(s.DataAtualizacao ?? "").slice(0, 10);
      if (!fecha || haceDias(fecha, hoy) > DIAS_MAX) continue;
      const x = postos.get(s.Id) ?? { s, precios: {}, fecha: "" };
      x.precios[k] = precioPt(s.Preco);
      if (fecha > x.fecha) x.fecha = fecha;
      postos.set(s.Id, x);
    }
  const e = [...postos.values()]
    .map(({ s, precios, fecha }) =>
      fila({ lat: s.Latitude, lon: s.Longitude, nombre: limpio(s.Marca) || s.Nome, dir: s.Morada, ciudad: s.Localidade || s.Municipio, cp: s.CodPostal, precios, fecha, autopista: /autoestrada/i.test(s.TipoPosto ?? "") }, combustibles),
    )
    .filter(Boolean);
  return { combustibles, e };
}

async function descargarPortugal() {
  const porCombustible = {};
  for (const [k, id] of Object.entries(PT)) {
    const r = await descargar(`https://precoscombustiveis.dgeg.gov.pt/api/PrecoComb/PesquisarPostos?idsTiposComb=${id}&qtdPorPagina=10000&pagina=1`);
    const j = await r.json();
    if (!j.status || !Array.isArray(j.resultado)) throw new Error("DGEG: respuesta inesperada");
    porCombustible[k] = j.resultado;
  }
  return portugal(porCombustible);
}

// ---------------- Principal ----------------

const PAISES = { FR: descargarFrancia, ES: leerEspana, IT: descargarItalia, PT: descargarPortugal };
/** Si salen muchas menos gasolineras de lo normal, algo ha fallado: mejor quedarse con la copia anterior. */
const MINIMO = { FR: 7000, ES: 8000, IT: 15000, PT: 2000 };

async function main() {
  const pedidos = process.argv.slice(2).map((x) => x.toUpperCase());
  const lista = pedidos.length ? pedidos : Object.keys(PAISES);
  mkdirSync(DIR, { recursive: true });
  let fallos = 0;
  for (const cc of lista) {
    try {
      const { combustibles, e } = await PAISES[cc]();
      if (e.length < MINIMO[cc]) throw new Error(`solo ${e.length} gasolineras`);
      writeFileSync(new URL(`${cc}.json`, DIR), JSON.stringify({ cc, actualizado: new Date().toISOString(), combustibles, e }));
      console.log(`${cc}: ${e.length} gasolineras`);
    } catch (err) {
      fallos++;
      console.error(`${cc}: ${err.message} (se mantiene la copia anterior, si la hay)`);
    }
  }
  if (fallos === lista.length) process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();

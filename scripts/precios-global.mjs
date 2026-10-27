// Precios del mercado diario (day-ahead) de cada zona de la web global → data/global/<ZONA>/AAAA-MM-DD.json
// y tipos de cambio del BCE → data/global/fx.json.
//
// Fuentes:
//  - ENTSO-E Transparency Platform (principal): todas las zonas. Necesita ENTSOE_TOKEN (gratis, se pide por correo).
//  - Energy-Charts (Fraunhofer ISE): respaldo, solo zonas con licencia CC BY 4.0 (las que tienen "ec" en paises.json).
//    Las demás zonas de Energy-Charts no permiten uso comercial, así que no se usan.
//
// Desde octubre de 2025 el mercado diario europeo casa cada 15 minutos: se guarda la media de cada hora de reloj
// (hora local de la zona). Nunca se escribe un día incompleto.
//
// Uso: node scripts/precios-global.mjs [días hacia atrás=30]

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import paisesJson from "../apps/global/src/paises.json" with { type: "json" };

const DIAS = Number(process.argv[2] ?? 30);
const DIR = new URL("../data/global/", import.meta.url);
const TOKEN = process.env.ENTSOE_TOKEN;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

export const fechaEn = (d, tz) => new Intl.DateTimeFormat("sv-SE", { timeZone: tz }).format(d);
export const horaEn = (d, tz) => Number(new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hourCycle: "h23" }).format(d));
export const sumar = (iso, n) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

/** [[instante en ms, €/MWh], …] → Map fecha local → 24 medias horarias (null si la hora no existe). */
export function porHoras(puntos, tz) {
  const acum = new Map();
  for (const [t, p] of puntos) {
    const d = new Date(t);
    const f = fechaEn(d, tz);
    const h = horaEn(d, tz);
    const dia = acum.get(f) ?? Array.from({ length: 24 }, () => ({ s: 0, n: 0 }));
    dia[h].s += p;
    dia[h].n++;
    acum.set(f, dia);
  }
  const out = new Map();
  for (const [f, dia] of acum) out.set(f, dia.map((x) => (x.n ? Math.round((x.s / x.n) * 100) / 100 : null)));
  return out;
}

/** Día completo: al menos 23 horas con precio (el día del cambio de hora de marzo tiene 23). */
export const completo = (precios) => precios.filter((p) => p !== null).length >= 23;

/** Lee el XML de un Publication_MarketDocument (A44) de ENTSO-E. Rellena los puntos omitidos (curva A03). */
export function leerEntsoe(xml) {
  const puntos = new Map();
  for (const ts of xml.split("<TimeSeries>").slice(1)) {
    // Algunas zonas publican varias series (p. ej. por subasta); la de posición 1 es la del mercado diario.
    const clas = /<classificationSequence_AttributeInstanceComponent\.position>(\d+)</.exec(ts);
    if (clas && clas[1] !== "1") continue;
    for (const per of ts.split("<Period>").slice(1)) {
      const ini = Date.parse(/<start>([^<]+)<\/start>/.exec(per)[1]);
      const fin = Date.parse(/<end>([^<]+)<\/end>/.exec(per)[1]);
      const res = /<resolution>PT(\d+)M<\/resolution>/.exec(per);
      const min = res ? Number(res[1]) : 60;
      const total = Math.round((fin - ini) / (min * 60000));
      const valores = new Map();
      for (const m of per.matchAll(/<position>(\d+)<\/position>\s*<price\.amount>([-\d.]+)<\/price\.amount>/g)) valores.set(Number(m[1]), Number(m[2]));
      let ultimo = null;
      for (let pos = 1; pos <= total; pos++) {
        if (valores.has(pos)) ultimo = valores.get(pos);
        if (ultimo === null) continue;
        const t = ini + (pos - 1) * min * 60000;
        if (!puntos.has(t)) puntos.set(t, ultimo);
      }
    }
  }
  return [...puntos.entries()].sort((a, b) => a[0] - b[0]);
}

const fmtEntsoe = (iso) => iso.replace(/-/g, "") + "0000";

/** Petición a la API de ENTSO-E (texto XML). Sin datos para el periodo devuelve un Acknowledgement_MarketDocument: "". */
async function pedirEntsoe(params, desde, hasta) {
  const url = `https://web-api.tp.entsoe.eu/api?securityToken=${TOKEN}&${params}&periodStart=${fmtEntsoe(sumar(desde, -1))}&periodEnd=${fmtEntsoe(sumar(hasta, 1))}`;
  for (let i = 1; i <= 3; i++) {
    const r = await fetch(url);
    const xml = await r.text();
    if (r.ok) return xml.includes("Acknowledgement_MarketDocument") ? "" : xml;
    if (r.status === 400 && xml.includes("No matching data")) return "";
    if (r.status === 400 || r.status === 401) throw new Error(`ENTSO-E ${r.status}: ${/<text>([^<]+)/.exec(xml)?.[1] ?? ""}`.slice(0, 200));
    await espera(3000 * i);
  }
  throw new Error("ENTSO-E no responde");
}

/** Precios del mercado diario. La API admite como mucho un año por petición: se trocea. */
async function entsoe(zona, desde, hasta) {
  const puntos = [];
  for (let a = desde; a <= hasta; a = sumar(a, 300)) {
    const b = sumar(a, 299) < hasta ? sumar(a, 299) : hasta;
    puntos.push(...leerEntsoe(await pedirEntsoe(`documentType=A44&in_Domain=${zona.eic}&out_Domain=${zona.eic}`, a, b)));
  }
  return [...new Map(puntos).entries()].sort((x, y) => x[0] - y[0]);
}

/** Series de cantidades (MW) de un documento de ENTSO-E, separadas por tipo de generación (psrType). */
export function leerSeries(xml) {
  const series = [];
  for (const ts of xml.split("<TimeSeries>").slice(1)) {
    const psr = /<psrType>(\w+)<\/psrType>/.exec(ts)?.[1] ?? "total";
    // En la generación real, las series con outBiddingZone son consumo (bombeo, baterías): no cuentan.
    const consumo = ts.includes("<outBiddingZone_Domain.mRID") && !ts.includes("<inBiddingZone_Domain.mRID");
    const puntos = [];
    for (const per of ts.split("<Period>").slice(1)) {
      const ini = Date.parse(/<start>([^<]+)<\/start>/.exec(per)[1]);
      const fin = Date.parse(/<end>([^<]+)<\/end>/.exec(per)[1]);
      const min = Number(/<resolution>PT(\d+)M<\/resolution>/.exec(per)?.[1] ?? 60);
      const total = Math.round((fin - ini) / (min * 60000));
      const valores = new Map([...per.matchAll(/<position>(\d+)<\/position>\s*<quantity>([-\d.]+)<\/quantity>/g)].map((m) => [Number(m[1]), Number(m[2])]));
      let ultimo = null;
      for (let pos = 1; pos <= total; pos++) {
        if (valores.has(pos)) ultimo = valores.get(pos);
        if (ultimo !== null) puntos.push([ini + (pos - 1) * min * 60000, ultimo]);
      }
    }
    series.push({ psr, consumo, puntos });
  }
  return series;
}

/** Tipo de generación de ENTSO-E (psrType) → grupo que se muestra. */
export const GRUPO_PSR = {
  B01: "biomasa", B02: "carbon", B03: "carbon", B04: "gas", B05: "carbon", B06: "petroleo", B07: "petroleo", B08: "petroleo",
  B09: "otrasRenovables", B10: "hidraulica", B11: "hidraulica", B12: "hidraulica", B13: "otrasRenovables", B14: "nuclear",
  B15: "otrasRenovables", B16: "solar", B17: "otras", B18: "eolica", B19: "eolica", B20: "otras", B25: "otras",
};

/** Series por tipo → Map fecha → { grupo: [24 MWh] } (media de cada hora de reloj en la hora local). */
export function mixPorDia(series, tz) {
  const dias = new Map();
  for (const s of series) {
    if (s.consumo) continue;
    const g = GRUPO_PSR[s.psr] ?? "otras";
    for (const [fecha, horas] of porHoras(s.puntos, tz)) {
      const dia = dias.get(fecha) ?? {};
      const acc = dia[g] ?? Array(24).fill(null);
      horas.forEach((v, h) => v !== null && (acc[h] = Math.round(((acc[h] ?? 0) + v) * 10) / 10));
      dia[g] = acc;
      dias.set(fecha, dia);
    }
  }
  return dias;
}

const DIR_MIX = new URL("../data/global-mix/", import.meta.url);
const DIR_PREV = new URL("../data/global-prevision/", import.meta.url);

/** Generación real por tecnología de los últimos `dias` días (y la de hoy hasta ahora). */
async function mix(pais, zona, dias) {
  const hoy = fechaEn(new Date(), pais.tz);
  const dir = new URL(`${zona.id}/`, DIR_MIX);
  mkdirSync(dir, { recursive: true });
  const faltan = [];
  for (let f = sumar(hoy, -dias); f <= hoy; f = sumar(f, 1)) if (f >= sumar(hoy, -2) || !existsSync(new URL(`${f}.json`, dir))) faltan.push(f);
  if (!faltan.length) return 0;
  const xml = await pedirEntsoe(`documentType=A75&processType=A16&in_Domain=${zona.eic}`, faltan[0], faltan.at(-1));
  let n = 0;
  for (const [fecha, grupos] of mixPorDia(leerSeries(xml), pais.tz)) {
    if (!faltan.includes(fecha)) continue;
    const horas = Math.max(...Object.values(grupos).map((v) => v.filter((x) => x !== null).length));
    if (horas < 3) continue;
    writeFileSync(new URL(`${fecha}.json`, dir), JSON.stringify({ fecha, zona: zona.id, completo: horas >= 23, horas: grupos }) + "\n");
    n++;
  }
  return n;
}

/** Previsión del día siguiente (y de hoy): eólica, solar y demanda, hora a hora. */
async function prevision(pais, zona) {
  const hoy = fechaEn(new Date(), pais.tz);
  const manana = sumar(hoy, 1);
  const dir = new URL(`${zona.id}/`, DIR_PREV);
  mkdirSync(dir, { recursive: true });
  const renov = mixPorDia(leerSeries(await pedirEntsoe(`documentType=A69&processType=A01&in_Domain=${zona.eic}`, hoy, manana)), pais.tz);
  const demanda = porHoras(leerSeries(await pedirEntsoe(`documentType=A65&processType=A01&outBiddingZone_Domain=${zona.eic}`, hoy, manana)).flatMap((s) => s.puntos), pais.tz);
  let n = 0;
  for (const fecha of [hoy, manana]) {
    const r = renov.get(fecha);
    const d = demanda.get(fecha);
    if (!r && !d) continue;
    writeFileSync(new URL(`${fecha}.json`, dir), JSON.stringify({ fecha, zona: zona.id, eolica: r?.eolica ?? null, solar: r?.solar ?? null, demanda: d ?? null }) + "\n");
    n++;
  }
  return n;
}

async function energyCharts(zona, desde, hasta) {
  const url = `https://api.energy-charts.info/price?bzn=${encodeURIComponent(zona.ec)}&start=${desde}&end=${hasta}`;
  for (let i = 1; i <= 4; i++) {
    const r = await fetch(url);
    if (r.ok) {
      const j = await r.json();
      return j.unix_seconds.map((s, k) => [s * 1000, j.price[k]]).filter(([, p]) => p !== null);
    }
    if (r.status === 404) return [];
    await espera(8000 * i); // limita las peticiones seguidas (429)
  }
  throw new Error(`Energy-Charts no responde (${zona.id})`);
}

async function tiposDeCambio() {
  const xml = await (await fetch("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml")).text();
  const fecha = /time=['"](\d{4}-\d{2}-\d{2})['"]/.exec(xml)?.[1];
  const tipos = Object.fromEntries([...xml.matchAll(/currency=['"](\w{3})['"]\s+rate=['"]([\d.]+)['"]/g)].map((m) => [m[1], Number(m[2])]));
  if (!fecha || !tipos.NOK) throw new Error("BCE: respuesta inesperada");
  return { fecha, EUR: 1, NOK: tipos.NOK, SEK: tipos.SEK, DKK: tipos.DKK };
}

async function main() {
  mkdirSync(DIR, { recursive: true });
  try {
    const fx = await tiposDeCambio();
    writeFileSync(new URL("fx.json", DIR), JSON.stringify(fx, null, 2) + "\n");
    console.log(`BCE ${fx.fecha}: NOK ${fx.NOK} · SEK ${fx.SEK} · DKK ${fx.DKK}`);
  } catch (e) {
    console.warn(`Tipos de cambio: ${e.message} (se mantienen los anteriores)`);
  }
  if (!TOKEN) console.warn("Sin ENTSOE_TOKEN: solo se descargan las zonas con licencia CC BY de Energy-Charts.");

  let escritos = 0;
  for (const pais of paisesJson.paises) {
    for (const zona of pais.zonas) {
      if (!TOKEN && !zona.ec) continue;
      const hoy = fechaEn(new Date(), pais.tz);
      const desde = sumar(hoy, -DIAS);
      const hasta = sumar(hoy, 1);
      const dirZona = new URL(`${zona.id}/`, DIR);
      mkdirSync(dirZona, { recursive: true });
      // Solo se pide lo que falta (y siempre ayer, hoy y mañana).
      const faltan = [];
      for (let f = desde; f <= hasta; f = sumar(f, 1)) if (f >= sumar(hoy, -1) || !existsSync(new URL(`${f}.json`, dirZona))) faltan.push(f);
      if (!faltan.length) continue;
      try {
        const puntos = TOKEN ? await entsoe(zona, faltan[0], faltan.at(-1)) : await energyCharts(zona, faltan[0], faltan.at(-1));
        const fuente = TOKEN ? "ENTSO-E" : "Energy-Charts (Bundesnetzagentur | SMARD.de, CC BY 4.0)";
        for (const [fecha, precios] of porHoras(puntos, pais.tz)) {
          if (!faltan.includes(fecha) || !completo(precios)) continue;
          const fichero = new URL(`${fecha}.json`, dirZona);
          const nuevo = JSON.stringify({ fecha, zona: zona.id, fuente, unidad: "EUR/MWh", precios }) + "\n";
          if (existsSync(fichero) && readFileSync(fichero, "utf8") === nuevo) continue;
          writeFileSync(fichero, nuevo);
          escritos++;
        }
        console.log(`${zona.id}: ${puntos.length} puntos`);
      } catch (e) {
        console.warn(`${zona.id}: ${e.message}`);
      }
      if (!TOKEN) await espera(4000);
    }
  }
  console.log(`${escritos} días nuevos o actualizados`);

  // Mix de generación real (35 días) y previsión de eólica, solar y demanda para hoy y mañana. Solo con token.
  if (!TOKEN) return;
  let nMix = 0;
  let nPrev = 0;
  for (const pais of paisesJson.paises) {
    for (const zona of pais.zonas) {
      try {
        nMix += await mix(pais, zona, 35);
      } catch (e) {
        console.warn(`Mix ${zona.id}: ${e.message}`);
      }
      try {
        nPrev += await prevision(pais, zona);
      } catch (e) {
        console.warn(`Previsión ${zona.id}: ${e.message}`);
      }
    }
  }
  console.log(`Mix: ${nMix} días · Previsión: ${nPrev} días`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();

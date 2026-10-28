// Gasolineras de España (Ministerio para la Transición Ecológica) para las páginas en español de la web global
// (/es/): precio de la gasolina, del gasóleo y de las gasolineras más baratas de cada provincia y municipio.
// Datos de scripts/carburantes.mjs. Antes estaban en la web española, que ahora redirige aquí.

import provinciasJson from "../../../../data/provincias.json";
import { slugTexto as slug } from "./carburantes";
import { leerJson, leerJsonsDe } from "./ficheros";

export type Producto = "g95" | "g98" | "diesel" | "dieselPremium" | "glp" | "gnc" | "adblue";

export const PRODUCTOS: Record<Producto, { nombre: string; corto: string }> = {
  g95: { nombre: "Gasolina 95", corto: "Gasolina 95" },
  g98: { nombre: "Gasolina 98", corto: "Gasolina 98" },
  diesel: { nombre: "Gasóleo A (diésel)", corto: "Diésel" },
  dieselPremium: { nombre: "Gasóleo premium", corto: "Diésel premium" },
  glp: { nombre: "GLP (autogás)", corto: "GLP" },
  gnc: { nombre: "Gas natural comprimido (GNC)", corto: "GNC" },
  adblue: { nombre: "AdBlue", corto: "AdBlue" },
};

export interface Estacion {
  id: string;
  rotulo: string;
  dir: string;
  mun: string;
  idMun: string;
  prov: string;
  cp: string;
  lat: number | null;
  lon: number | null;
  horario: string;
  p: Partial<Record<Producto, number>>;
}
export interface Stats { media: number; min: number; max: number; n: number }
export type Resumen = { fecha: string; hora: string; nacional: Partial<Record<Producto, Stats>>; provincias: Record<string, Partial<Record<Producto, Stats>>> };

// La foto de hoy no va al repositorio (se descarga en cada build): si falta, no hay páginas de gasolineras.
const foto = leerJson<{ fecha: string; hora: string; estaciones: Estacion[] }>("carburantes/estaciones.json");
export const HAY_GASOLINERAS = !!foto;
export const FECHA = foto?.fecha ?? "";
export const HORA = foto?.hora ?? "";
/** «Solana (La)» → «La Solana»; «Hospitalet de Llobregat (L')» → «L'Hospitalet de Llobregat». */
export function nombreMunicipio(s: string): string {
  const m = /^(.*?)\s*\((La|El|Los|Las|Lo|A|O|As|Os|L'|Les|Els|Es|Sa|Ses|Il)\)$/i.exec(s.trim());
  if (!m) return s.trim();
  const art = m[2].charAt(0).toUpperCase() + m[2].slice(1);
  return art.endsWith("'") ? `${art}${m[1]}` : `${art} ${m[1]}`;
}
export const ESTACIONES: Estacion[] = (foto?.estaciones ?? []).map((e) => ({ ...e, mun: nombreMunicipio(e.mun) }));

/** Un resumen por día (el último de cada día), del más antiguo al más reciente. */
export const HISTORICO: Resumen[] = leerJsonsDe<Resumen>("carburantes/resumen").sort((a, b) => a.fecha.localeCompare(b.fecha));

const nombres = (provinciasJson as { provincias: Record<string, { nombre: string }> }).provincias;

export interface Provincia { id: string; nombre: string; slug: string; estaciones: Estacion[] }
export interface Municipio { id: string; nombre: string; slug: string; prov: Provincia; estaciones: Estacion[] }

export const PROVINCIAS: Provincia[] = [...new Set(ESTACIONES.map((e) => e.prov))]
  .filter((id) => nombres[id])
  .map((id) => ({ id, nombre: nombres[id].nombre, slug: slug(nombres[id].nombre), estaciones: ESTACIONES.filter((e) => e.prov === id) }))
  .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

/** Municipios con al menos 2 gasolineras (con una sola no hay nada que comparar). */
export const MUNICIPIOS: Municipio[] = PROVINCIAS.flatMap((prov) => {
  const grupos = new Map<string, Estacion[]>();
  for (const e of prov.estaciones) grupos.set(e.idMun, [...(grupos.get(e.idMun) ?? []), e]);
  const lista = [...grupos.entries()].filter(([, es]) => es.length >= 2).map(([id, es]) => ({ id, nombre: es[0].mun, slug: slug(es[0].mun), prov, estaciones: es }));
  // Dos municipios con el mismo nombre en una provincia: se distinguen con su código.
  const usados = new Map<string, number>();
  for (const m of lista) usados.set(m.slug, (usados.get(m.slug) ?? 0) + 1);
  return lista.map((m) => (usados.get(m.slug)! > 1 ? { ...m, slug: `${m.slug}-${m.id}` } : m)).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
});

export const urlProvincia = (p: Provincia) => `/es/gasolineras-baratas/${p.slug}/`;
export const urlMunicipio = (m: Municipio) => `/es/gasolineras-baratas/${m.prov.slug}/${m.slug}/`;
/** El mapa de gasolineras encuadrado en unas gasolineras (?b=oeste,sur,este,norte). */
export function urlEnMapa(es: Estacion[]): string {
  const c = es.filter((e) => e.lat && e.lon);
  if (!c.length) return "/es/mapa-gasolineras/";
  const r = (x: number) => Math.round(x * 1000) / 1000;
  const b = [Math.min(...c.map((e) => e.lon!)), Math.min(...c.map((e) => e.lat!)), Math.max(...c.map((e) => e.lon!)), Math.max(...c.map((e) => e.lat!))].map(r);
  return `/es/mapa-gasolineras/?b=${b.join(",")}`;
}

export function stats(es: Estacion[], k: Producto): Stats | null {
  const v = es.map((e) => e.p[k]).filter((x): x is number => !!x);
  if (!v.length) return null;
  return { media: v.reduce((a, b) => a + b, 0) / v.length, min: Math.min(...v), max: Math.max(...v), n: v.length };
}

/** Las `n` más baratas para un carburante. */
export const masBaratas = (es: Estacion[], k: Producto, n: number) => es.filter((e) => e.p[k]).sort((a, b) => a.p[k]! - b.p[k]!).slice(0, n);

export const eurL = (n: number) => `${n.toLocaleString("es-ES", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} €/l`;
export const eurL2 = (n: number) => `${n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

/** «REPSOL» → «Repsol»; «AVENIDA CASTILLA LA MANCHA, 26» → «Avenida Castilla la Mancha, 26». */
const MENORES = new Set(["de", "del", "la", "las", "los", "el", "y", "a", "en"]);
export function bonito(s: string): string {
  if (!s || s !== s.toUpperCase()) return s;
  return s
    .toLowerCase()
    .split(/(\s+)/)
    .map((w, i) => (i > 0 && MENORES.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join("")
    .replace(/\b(Km|Cv|N|Nº|S\/n)\b/gi, (m) => m.toUpperCase().replace("S/N", "s/n"));
}

export const mapa = (e: Estacion) => (e.lat && e.lon ? `https://www.google.com/maps/search/?api=1&query=${e.lat},${e.lon}` : null);

/** Ahorro al llenar un depósito de 50 litros entre dos precios. */
export const ahorroDeposito = (caro: number, barato: number, litros = 50) => (caro - barato) * litros;

/** Serie diaria de la media nacional (o de una provincia) para la gráfica. */
export function serieDiaria(k: Producto, prov?: string) {
  return HISTORICO.map((r) => ({ fecha: r.fecha, valor: (prov ? r.provincias[prov]?.[k] : r.nacional[k])?.media ?? null }));
}

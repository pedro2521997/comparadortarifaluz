// Mapas de gasolineras de la web global: qué países tienen mapa (los que tienen data/estaciones/<CC>.json, que
// descarga scripts/estaciones-global.mjs), URLs, y las cifras que se ven sin JavaScript (medias, las más baratas…).

import { leerJson } from "./ficheros";
import { PAISES_C, CC, slugTexto } from "./carburantes";
import { nombrePais } from "../../../web/src/lib/compartido/carburantes-ue";
import { TEXTOS_M } from "./textos-mapa";
import { absoluta, type Pais } from "./datos";

export type Comb = "g95" | "e10" | "g98" | "diesel" | "dieselPremium" | "glp" | "e85" | "gnc";
/** [lat, lon, nombre, dirección, municipio, cp, precios (en el orden de «combustibles»), fecha del precio, autopista] */
export type Fila = [number, number, string, string, string, string, (number | null)[], string, 0 | 1];
export interface Estaciones { cc: string; actualizado: string; combustibles: Comb[]; e: Fila[] }

const datos = new Map<string, Estaciones | null>();
export function estaciones(cc: string): Estaciones | null {
  if (!datos.has(cc)) datos.set(cc, leerJson<Estaciones>(`estaciones/${cc}.json`));
  return datos.get(cc)!;
}

/** Países con mapa, en el orden en que se enseñan. */
export const MAPAS = ["FR", "ES", "IT", "PT"].filter((cc) => estaciones(cc));
/** Gasolina que más se vende en cada país (la que sale de primeras en el mapa). */
export const GASOLINA: Record<string, Comb> = { FR: "e10", ES: "g95", IT: "g95", PT: "g95" };
/** Límites de la vista inicial (sin islas lejanas ni territorios de ultramar). */
export const LIMITES: Record<string, [number, number, number, number]> = {
  FR: [-5.2, 41.3, 9.6, 51.1],
  ES: [-9.4, 35.9, 3.4, 43.8],
  IT: [6.6, 36.6, 18.6, 47.1],
  PT: [-9.6, 36.9, -6.1, 42.2],
};
/** Organismo que publica los datos (nombre oficial, igual en todos los idiomas) y su web. */
export const FUENTE_MAPA: Record<string, { nombre: string; url: string }> = {
  FR: { nombre: "prix-carburants.gouv.fr", url: "https://www.prix-carburants.gouv.fr/" },
  ES: { nombre: "Ministerio para la Transición Ecológica", url: "https://geoportalgasolineras.es/" },
  IT: { nombre: "MIMIT – Osservaprezzi carburanti", url: "https://carburanti.mise.gov.it/" },
  PT: { nombre: "DGEG – Preços dos Combustíveis Online", url: "https://precoscombustiveis.dgeg.gov.pt/" },
};

export const tieneMapas = (p: Pais) => !!TEXTOS_M[p.lang] && MAPAS.length > 0;
export const mapaPropio = (p: Pais) => MAPAS.includes(CC(p));
/** /fr/carte-stations-service/ (mapa del propio país o índice) y /de/tankstellen-karte/frankreich/. */
export function urlMapa(p: Pais, cc?: string): string {
  const base = `/${p.cc}/${TEXTOS_M[p.lang]!.slug}/`;
  return !cc || cc === CC(p) ? base : `${base}${slugTexto(nombrePais(cc, p.locale))}/`;
}
export const urlDatos = (cc: string) => `/data/gasolineras/${cc.toLowerCase()}.json`;

/** hreflang: el mapa de un país en todos los idiomas de la web. */
export const alternativasMapa = (cc: string) => PAISES_C.filter((p) => TEXTOS_M[p.lang]).map((p) => ({ lang: p.locale, href: absoluta(urlMapa(p, cc)) }));

/**
 * Para medias y listas solo cuenta el territorio continental: en Canarias, Ceuta, Melilla, Baleares, Córcega, la
 * Francia de ultramar, Madeira y Azores los impuestos son otros y las «más baratas» saldrían siempre de allí.
 */
const FUERA: Record<string, RegExp> = { ES: /^(07|35|38|51|52)/, FR: /^(20|97|98)/, PT: /^9/ };
export const soloContinente = (cc: string) => !!FUERA[cc];
const continente = (cc: string) => (f: Fila) => !FUERA[cc]?.test(f[5]);

const precioDe = (d: Estaciones, k: Comb) => {
  const i = d.combustibles.indexOf(k);
  return (f: Fila) => (i < 0 ? null : f[6][i]);
};

export function resumen(cc: string, k: Comb): { n: number; media: number; min: number } | null {
  const d = estaciones(cc);
  if (!d) return null;
  const v = d.e.filter(continente(cc)).map(precioDe(d, k)).filter((x): x is number => x !== null);
  if (!v.length) return null;
  return { n: v.length, media: v.reduce((a, b) => a + b, 0) / v.length, min: Math.min(...v) };
}

export function masBaratas(cc: string, k: Comb, n = 10): { f: Fila; precio: number }[] {
  const d = estaciones(cc)!;
  const p = precioDe(d, k);
  return d.e
    .filter((f) => p(f) !== null && continente(cc)(f))
    .map((f) => ({ f, precio: p(f)! }))
    .sort((a, b) => a.precio - b.precio)
    .slice(0, n);
}

/** Media en autopista y fuera de ella (solo si hay bastantes gasolineras de autopista para que sea significativo). */
export function autopista(cc: string, k: Comb): { a: number; r: number } | null {
  const d = estaciones(cc)!;
  const p = precioDe(d, k);
  const media = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const c = d.e.filter(continente(cc));
  const au = c.filter((f) => f[8] && p(f) !== null).map((f) => p(f)!);
  const resto = c.filter((f) => !f[8] && p(f) !== null).map((f) => p(f)!);
  return au.length >= 30 && resto.length ? { a: media(au), r: media(resto) } : null;
}

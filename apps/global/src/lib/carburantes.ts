// Carburantes en la web global: qué países tienen páginas, URLs, formato en la moneda de cada país y vecinos.
// Los datos (semanales, Comisión Europea) los comparte con la web española: web/src/lib/compartido/carburantes-ue.ts.

import fxJson from "../../../../data/global/fx.json";
import { PAISES, type Pais } from "./datos";
import { TEXTOS_C, enPais, type TextosCarburantes } from "./textos-carburantes";
import { PAISES_UE, nombrePais, ultimo, type ProductoUE } from "../../../web/src/lib/compartido/carburantes-ue";

const fx = fxJson as Record<string, number | string>;

export const slugTexto = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Países de la web global con datos de carburantes (Noruega no está en el boletín de la UE). */
export const PAISES_C = PAISES.filter((p) => PAISES_UE.includes(p.cc.toUpperCase()) && TEXTOS_C[p.lang]);

export const textosC = (p: Pais) => TEXTOS_C[p.lang] as TextosCarburantes;
export const CC = (p: Pais) => p.cc.toUpperCase();

export const urlPrecios = (p: Pais) => `/${p.cc}/${textosC(p).slugPrecios}/`;
/** España tiene su propia página de precios, con cada gasolinera (pages/es/), en lugar de la genérica semanal. */
export const preciosPropios = (p: Pais) => p.cc === "es";
export const urlCalefaccion = (p: Pais) => `/${p.cc}/${textosC(p).slugCalefaccion}/`;
export const urlEuropa = (p: Pais) => `/${p.cc}/${textosC(p).slugEuropa}/`;
export const urlDestino = (p: Pais, cc: string) => `/${p.cc}/${textosC(p).slugEuropa}/${slugTexto(nombrePais(cc, p.locale))}/`;

/** Destinos de cada país (todos los de la UE con dato, menos él mismo). */
export const destinos = (p: Pais) => PAISES_UE.filter((cc) => cc !== CC(p));

/** «in Deutschland», «au Portugal»… */
export const en = (p: Pais, cc: string) => enPais(p.lang, cc, nombrePais(cc, p.locale));

/** Precio por litro en la moneda del país (coronas en Suecia y Dinamarca). */
export function litro(p: Pais, eur: number, dec?: number): string {
  const tipo = p.moneda === "EUR" ? 1 : Number(fx[p.moneda]);
  const unidad = p.moneda === "EUR" ? "€/l" : "kr/l";
  const d = dec ?? (p.moneda === "EUR" ? 3 : 2);
  return `${new Intl.NumberFormat(p.locale, { minimumFractionDigits: d, maximumFractionDigits: d }).format(eur * tipo)} ${unidad}`;
}
export function dinero(p: Pais, eur: number): string {
  const tipo = p.moneda === "EUR" ? 1 : Number(fx[p.moneda]);
  return new Intl.NumberFormat(p.locale, { style: "currency", currency: p.moneda, maximumFractionDigits: eur * tipo >= 100 ? 0 : 2 }).format(eur * tipo);
}
export const pct = (p: Pais, x: number) => new Intl.NumberFormat(p.locale, { style: "percent", maximumFractionDigits: 0 }).format(x);
export const fechaC = (p: Pais, iso: string) => new Intl.DateTimeFormat(p.locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));
export const mesC = (p: Pais, iso: string) => new Intl.DateTimeFormat(p.locale, { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));

/** Países vecinos (los más útiles para comparar al cruzar la frontera). */
export const VECINOS: Record<string, string[]> = {
  DE: ["AT", "NL", "BE", "LU", "FR", "DK", "PL", "CZ"],
  AT: ["DE", "IT", "SI", "HU", "SK", "CZ"],
  FR: ["BE", "LU", "DE", "IT", "ES"],
  IT: ["FR", "AT", "SI", "HR"],
  NL: ["BE", "DE", "LU", "FR"],
  BE: ["NL", "FR", "LU", "DE"],
  PT: ["ES", "FR"],
  SE: ["DK", "FI", "DE"],
  DK: ["DE", "SE", "NL"],
  FI: ["SE", "EE"],
};

export const PRODUCTOS: ProductoUE[] = ["euro95", "diesel", "calefaccion", "glp"];
export const hay = (cc: string, k: ProductoUE) => ultimo(cc, k) !== null;

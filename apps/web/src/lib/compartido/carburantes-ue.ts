// Precios semanales de carburantes en Europa (Comisión Europea, Weekly Oil Bulletin), para la web española
// y la global. Datos en €/litro con y sin impuestos (data/carburantes-ue.json, lo genera scripts/carburantes.mjs).

import ue from "../../../../../data/carburantes-ue.json";

export type ProductoUE = "euro95" | "diesel" | "calefaccion" | "glp";
type Series = Partial<Record<ProductoUE, (number | null)[]>>;

const datos = ue as unknown as { actualizado: string; semanas: string[]; conImpuestos: Record<string, Series>; sinImpuestos: Record<string, Series> };

export const SEMANAS = datos.semanas;
export const ACTUALIZADO = datos.actualizado;
export const FUENTE_UE = { nombre: "European Commission, Weekly Oil Bulletin", url: "https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en" };

/** Países con dato de la última semana (sin «EU», que es la media). Reino Unido ya no publica. */
export const PAISES_UE = Object.keys(datos.conImpuestos).filter((cc) => cc !== "EU" && datos.conImpuestos[cc].euro95?.at(-1) != null);

/** «EL» es Grecia en la UE; Intl usa GR. */
const iso = (cc: string) => (cc === "EL" ? "GR" : cc === "UK" ? "GB" : cc);

export function nombrePais(cc: string, locale: string): string {
  if (cc === "EU") return new Intl.DisplayNames([locale], { type: "region" }).of("EU") ?? "EU";
  return new Intl.DisplayNames([locale], { type: "region" }).of(iso(cc)) ?? cc;
}

export const serie = (cc: string, p: ProductoUE, impuestos = true) => (impuestos ? datos.conImpuestos : datos.sinImpuestos)[cc]?.[p] ?? [];

/** Último valor conocido y el de la semana anterior. */
export function ultimo(cc: string, p: ProductoUE, impuestos = true) {
  const s = serie(cc, p, impuestos);
  let i = s.length - 1;
  while (i >= 0 && s[i] == null) i--;
  if (i < 0) return null;
  let j = i - 1;
  while (j >= 0 && s[j] == null) j--;
  return { valor: s[i]!, anterior: j >= 0 ? s[j]! : null, semana: SEMANAS[i], haceUnAno: s[i - 52] ?? null };
}

/** Parte del precio que son impuestos (IVA e impuestos especiales). */
export function partImpuestos(cc: string, p: ProductoUE): number | null {
  const con = ultimo(cc, p);
  const sin = ultimo(cc, p, false);
  return con && sin ? 1 - sin.valor / con.valor : null;
}

/** Ranking de la última semana, del más barato al más caro. */
export function ranking(p: ProductoUE) {
  return PAISES_UE.map((cc) => ({ cc, u: ultimo(cc, p) }))
    .filter((x): x is { cc: string; u: NonNullable<ReturnType<typeof ultimo>> } => x.u !== null)
    .sort((a, b) => a.u.valor - b.u.valor);
}

/** Las últimas `n` semanas de una serie, con sus fechas. */
export function ultimas(cc: string, p: ProductoUE, n: number, impuestos = true) {
  const s = serie(cc, p, impuestos);
  return { fechas: SEMANAS.slice(-n), valores: s.slice(-n) };
}

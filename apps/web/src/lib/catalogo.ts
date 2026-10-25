// Cálculos del catálogo en el build para las páginas de cada comercializadora y de cada tarifa:
// lo que pagaría un hogar en tres situaciones típicas, con los mismos datos y motor que el ranking.

import { compararTarifas, generarLecturas, type Tarifa } from "@lst/tarifa";
import { tarifas, regulados, festivos, dias, ajustesMercado } from "./datos";
import { hoyMadrid, sumarDias } from "./formato";
import { aFilas, marca, nombrePlan, slugMarca, slugTarifa, type Fila } from "./ranking";

export interface Escenario {
  id: "bajo" | "medio" | "alto";
  nombre: string;
  anual: number;
  p1: number;
  p2: number;
}

export const ESCENARIOS: Escenario[] = [
  { id: "bajo", nombre: "Piso pequeño o una persona", anual: 1500, p1: 3.45, p2: 3.45 },
  { id: "medio", nombre: "Hogar medio", anual: 3000, p1: 4.6, p2: 4.6 },
  { id: "alto", nombre: "Casa grande o con climatización eléctrica", anual: 5000, p1: 5.75, p2: 5.75 },
];

const hoy = hoyMadrid();
const ultimoPvpc = [...dias].reverse().find((d) => d.fecha <= hoy)?.fecha ?? hoy;
const desde = sumarDias(ultimoPvpc, -364);
const fest = new Set(festivos);
const pvpc = Object.fromEntries(dias.filter((d) => d.fecha >= desde && d.fecha <= ultimoPvpc).map((d) => [d.fecha, d.precios as number[]]));
const mercado = {
  spot: Object.fromEntries(dias.filter((d) => d.fecha >= desde && d.fecha <= ultimoPvpc && d.spot).map((d) => [d.fecha, d.spot!])),
  ajustes: ajustesMercado,
};

const cache = new Map<string, Fila[]>();

/** Todas las tarifas calculadas para un escenario, ordenadas como el ranking (fiables primero, por precio). */
export function filasEscenario(e: Escenario): Fila[] {
  const hit = cache.get(e.id);
  if (hit) return hit;
  const lecturas = generarLecturas({ desde, hasta: ultimoPvpc, anualKwh: e.anual, tipo: "estandar", festivos: fest });
  const filas = aFilas(compararTarifas(lecturas, tarifas, { p1: e.p1, p2: e.p2 }, { regulados, festivos: fest, pvpc, mercado }, hoy), null).map((f, i) => ({ ...f, pos: i + 1 }));
  cache.set(e.id, filas);
  return filas;
}

export const PERIODO_PRECIOS = { desde, hasta: ultimoPvpc };

// ---------- Direcciones ----------
// Las funciones viven en ranking.ts (también las usa el navegador); aquí se comprueba que no se repite ninguna.
export { slug, slugMarca, slugTarifa, urlTarifa, urlMarca } from "./ranking";
{
  const vistos = new Map<string, string>();
  for (const t of tarifas) {
    if (t.tipo === "pvpc") continue;
    const s = slugTarifa(t);
    if (vistos.has(s)) throw new Error(`Dos tarifas con la misma dirección /tarifas/${s}/: ${vistos.get(s)} y ${t.id}`);
    vistos.set(s, t.id);
  }
}

/** Comercializadoras del catálogo (sin la PVPC), con sus tarifas. */
export function marcas(): { marca: string; slug: string; razon: string; tarifas: Tarifa[] }[] {
  const mapa = new Map<string, Tarifa[]>();
  for (const t of tarifas) {
    if (t.tipo === "pvpc") continue;
    const m = marca(t.comercializadora);
    mapa.set(m, [...(mapa.get(m) ?? []), t]);
  }
  return [...mapa.entries()]
    .map(([m, ts]) => ({ marca: m, slug: slugMarca(m), razon: ts[0].comercializadora, tarifas: ts }))
    .sort((a, b) => a.marca.localeCompare(b.marca, "es"));
}

/** Fila de una tarifa en un escenario. */
export const filaDe = (t: Tarifa, e: Escenario) => filasEscenario(e).find((f) => f.tarifa.id === t.id)!;

/** La más barata con precio completo y comprobado (la referencia del ranking). */
export const referencia = (e: Escenario) => filasEscenario(e).find((f) => !f.incompleta && !(f.porRevisar && f.tarifa.tipo !== "pvpc"))!;
export const filaPvpc = (e: Escenario) => filasEscenario(e).find((f) => f.tarifa.tipo === "pvpc");

/** Otros nombres con los que se conoce a una comercializadora (marca comercial o grupo). */
export const ALIAS: Record<string, string> = {
  Gesternova: "Contigo Energía",
  niba: "marca de Iberdrola",
  "Guissona (bonÀrea)": "bonÀrea Energia",
};

export const tipoTexto = (t: Tarifa) => (t.tipo === "pvpc" ? "regulada (PVPC)" : t.tipo === "indexada" ? "indexada al mercado" : t.tipo === "fijo" ? "de precio único" : "de tres periodos");
export const dominioWeb = (t: Tarifa) => (t.url_contratar || t.url_fuente || "").replace(/^https?:\/\/(www\.)?/, "").split("/")[0];

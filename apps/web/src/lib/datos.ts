// Acceso a /data en tiempo de build (solo servidor).

import tarifasJson from "../../../../data/tarifas.json";
import reguladosJson from "../../../../data/regulados.json";
import festivosJson from "../../../../data/festivos.json";
import aparatosJson from "../../../../data/aparatos.json";
import provinciasJson from "../../../../data/provincias.json";
import type { Regulados, Tarifa } from "@lst/tarifa";

export interface DiaPrecios {
  fecha: string;
  fuente: string;
  fuente_url: string;
  descargado: string;
  /** €/kWh por hora de reloj; null en la hora que no existe el día del cambio de marzo */
  precios: (number | null)[];
}

export interface Aparato {
  slug: string;
  nombre: string;
  grupo: string;
  tipo: "potencia" | "ciclo" | "continuo";
  potencia_w?: number;
  horas_dia?: number;
  dias_mes?: number;
  kwh_ciclo?: number;
  ciclos_semana?: number;
  kwh_anual?: number;
  rango: [number, number];
  ventana_h: number;
  desplazable: boolean;
  nota: string;
  truco: string;
  fuente: { nombre: string; url: string };
}

export const tarifas = tarifasJson.tarifas as Tarifa[];
export const regulados = reguladosJson as unknown as Regulados;
export const festivos = festivosJson.fechas;
export const aparatos = aparatosJson.aparatos as Aparato[];
export const provincias = provinciasJson.provincias as Record<string, { nombre: string; lat: number; lon: number }>;

const ficheros = import.meta.glob<DiaPrecios>("../../../../data/precios/*.json", { eager: true, import: "default" });

/** Todos los días con precios publicados, ordenados por fecha. */
export const dias: DiaPrecios[] = Object.values(ficheros).sort((a, b) => a.fecha.localeCompare(b.fecha));
const porFecha = new Map(dias.map((d) => [d.fecha, d]));

export function preciosDe(fecha: string): DiaPrecios | null {
  return porFecha.get(fecha) ?? null;
}

/** Precios sin huecos (para cálculos): la hora inexistente de marzo se descarta. */
export function soloNumeros(d: DiaPrecios): number[] {
  return d.precios.filter((p): p is number => p !== null);
}

const FEMENINOS = new Set(["bomba-de-calor", "estufa-infrarrojos", "lavadora", "secadora", "placa-induccion", "vitroceramica", "freidora-de-aire", "nevera", "consola", "plancha"]);
/** "un" o "una" según el aparato. */
export const articulo = (a: Aparato) => (FEMENINOS.has(a.slug) ? "una" : "un");

/** Consumo mensual de un aparato con sus valores típicos (kWh). */
export function kwhMesAparato(a: Aparato): number {
  if (a.tipo === "potencia") return ((a.potencia_w ?? 0) / 1000) * (a.horas_dia ?? 0) * (a.dias_mes ?? 30);
  if (a.tipo === "ciclo") return (a.kwh_ciclo ?? 0) * (a.ciclos_semana ?? 0) * (52 / 12);
  return (a.kwh_anual ?? 0) / 12;
}
/** kWh de un uso típico (un ciclo, un día de uso, o un día para los continuos). */
export function kwhUsoAparato(a: Aparato): number {
  if (a.tipo === "potencia") return ((a.potencia_w ?? 0) / 1000) * (a.horas_dia ?? 0);
  if (a.tipo === "ciclo") return a.kwh_ciclo ?? 0;
  return (a.kwh_anual ?? 0) / 365;
}

/** Factor para pasar de €/kWh sin impuestos a lo que pagas: IEE + IVA vigentes. */
export function factorImpuestos(fecha: string): number {
  const iva = regulados.iva.find((v) => v.vigente_desde <= fecha && (!v.vigente_hasta || fecha <= v.vigente_hasta))?.valor ?? 0.21;
  const iee = regulados.iee[regulados.iee.length - 1].valor;
  return (1 + iee) * (1 + iva);
}

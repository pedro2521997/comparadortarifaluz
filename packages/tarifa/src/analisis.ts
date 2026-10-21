// Extras que salen del mismo fichero de consumos.

import { periodoEnergia, type PeriodoEnergia } from "./periodos";
import type { Lectura } from "./factura";

export interface Reparto {
  kwh: Record<PeriodoEnergia, number>;
  porcentaje: Record<PeriodoEnergia, number>;
  total: number;
}

export function repartoPorPeriodos(lecturas: Lectura[], festivos: ReadonlySet<string>): Reparto {
  const kwh: Record<PeriodoEnergia, number> = { 1: 0, 2: 0, 3: 0 };
  for (const l of lecturas) kwh[periodoEnergia(l.fecha, l.hora, festivos)] += l.kwh;
  const total = kwh[1] + kwh[2] + kwh[3];
  const pct = (n: number) => (total > 0 ? n / total : 0);
  return { kwh, porcentaje: { 1: pct(kwh[1]), 2: pct(kwh[2]), 3: pct(kwh[3]) }, total };
}

export interface Picos {
  /** Mayor consumo en una hora (kWh en una hora = potencia media en kW). */
  maximo: { kw: number; fecha: string; hora: number };
  /** Percentil 99 de los consumos horarios, menos sensible a un pico aislado. */
  p99: number;
  /** Potencia que recomendamos revisar (redondeada hacia arriba a 0,1 kW con un 30 % de margen). */
  sugerida: number;
}

/**
 * Picos de consumo. Ojo: una lectura horaria es la MEDIA de la hora; los picos de unos segundos
 * (horno + vitro + lavadora a la vez) pueden ser mayores. Por eso se deja margen.
 */
export function picosDeConsumo(lecturas: Lectura[]): Picos {
  let maximo = { kw: 0, fecha: lecturas[0]?.fecha ?? "", hora: 0 };
  for (const l of lecturas) if (l.kwh > maximo.kw) maximo = { kw: l.kwh, fecha: l.fecha, hora: l.hora };
  const ordenados = lecturas.map((l) => l.kwh).sort((a, b) => a - b);
  const p99 = ordenados[Math.floor(ordenados.length * 0.99)] ?? 0;
  const sugerida = Math.max(2.3, Math.ceil(maximo.kw * 1.3 * 10) / 10);
  return { maximo, p99, sugerida };
}

/** Mueve un `fraccion` del consumo de cada hora punta a la primera hora valle del mismo día (o de madrugada). */
export function desplazarPuntaAValle(lecturas: Lectura[], festivos: ReadonlySet<string>, fraccion = 0.1): Lectura[] {
  const copia = lecturas.map((l) => ({ ...l }));
  const porDia = new Map<string, Lectura[]>();
  for (const l of copia) {
    const lista = porDia.get(l.fecha) ?? [];
    lista.push(l);
    porDia.set(l.fecha, lista);
  }
  for (const lista of porDia.values()) {
    let movido = 0;
    for (const l of lista) {
      if (periodoEnergia(l.fecha, l.hora, festivos) === 1) {
        const delta = l.kwh * fraccion;
        l.kwh -= delta;
        movido += delta;
      }
    }
    if (movido === 0) continue;
    const valle = lista.filter((l) => periodoEnergia(l.fecha, l.hora, festivos) === 3);
    if (valle.length === 0) continue;
    const cada = movido / valle.length;
    for (const l of valle) l.kwh += cada;
  }
  return copia;
}

/** Perfil medio por hora del día (kWh) — útil para la calculadora solar. */
export function perfilHorario(lecturas: Lectura[]): number[] {
  const suma = new Array(24).fill(0);
  const n = new Array(24).fill(0);
  for (const l of lecturas) {
    suma[l.hora] += l.kwh;
    n[l.hora]++;
  }
  return suma.map((s, h) => (n[h] ? s / n[h] : 0));
}

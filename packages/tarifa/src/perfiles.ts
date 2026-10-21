// Perfiles de consumo para comparar sin fichero: reparten un consumo anual (o el de la factura por
// periodos) entre las horas de un periodo real, con forma diaria y estacional de un hogar tipo.

import { esFinDeSemanaOFestivo, periodoEnergia, sumarDias, diasEntre, type PeriodoEnergia } from "./periodos";
import type { Lectura } from "./factura";

export type TipoPerfil = "estandar" | "teletrabajo" | "noche" | "coche";

export const PERFILES: Record<TipoPerfil, { nombre: string; descripcion: string }> = {
  estandar: { nombre: "Hogar tipo", descripcion: "Fuera de casa de día; picos al mediodía y por la noche." },
  teletrabajo: { nombre: "En casa de día", descripcion: "Teletrabajo, jubilados: más consumo de 9 a 18 h." },
  noche: { nombre: "Consumo programado de noche", descripcion: "Termo, lavadora y lavavajillas en horas valle." },
  coche: { nombre: "Con coche eléctrico", descripcion: "Hogar tipo más la recarga del coche de madrugada." },
};

// kWh relativos por hora (laborable y fin de semana). Forma inspirada en los perfiles iniciales de REE.
const LABORABLE = [0.18, 0.15, 0.14, 0.13, 0.13, 0.14, 0.2, 0.42, 0.38, 0.25, 0.22, 0.24, 0.3, 0.45, 0.52, 0.35, 0.26, 0.28, 0.36, 0.48, 0.66, 0.72, 0.55, 0.32];
const FINDE = [0.2, 0.16, 0.14, 0.13, 0.13, 0.13, 0.15, 0.2, 0.3, 0.42, 0.45, 0.44, 0.48, 0.55, 0.56, 0.4, 0.34, 0.36, 0.42, 0.52, 0.64, 0.68, 0.52, 0.34];
const ESTACION = [1.3, 1.25, 1.1, 0.95, 0.9, 1.0, 1.2, 1.2, 1.0, 0.95, 1.1, 1.3];

/** Forma diaria (kWh relativos por hora) de un perfil tipo. */
export function forma(tipo: TipoPerfil, finde: boolean): number[] {
  const base = [...(finde ? FINDE : LABORABLE)];
  if (tipo === "teletrabajo" && !finde) for (let h = 9; h < 18; h++) base[h] += 0.22;
  if (tipo === "noche") {
    // Se pasa una parte de la punta y el llano a la madrugada.
    let movido = 0;
    for (const h of [10, 11, 12, 13, 18, 19, 20, 21]) {
      const d = base[h] * 0.35;
      base[h] -= d;
      movido += d;
    }
    for (let h = 0; h < 8; h++) base[h] += movido / 8;
  }
  if (tipo === "coche") for (let h = 1; h < 6; h++) base[h] += finde ? 0.5 : 0.9;
  return base;
}

export interface OpcionesPerfil {
  desde: string;
  hasta: string;
  /** kWh al año; se prorratea al número de días del periodo */
  anualKwh: number;
  tipo: TipoPerfil;
  festivos: ReadonlySet<string>;
  /** Reparto anual por periodos (kWh) de tu factura: si se indica, manda sobre la forma del perfil. */
  porPeriodo?: Record<PeriodoEnergia, number> | null;
}

/** Último domingo de marzo: día de 23 horas (no existe la hora de 2 a 3). */
function esDiaCambioMarzo(fecha: string): boolean {
  const [y, m, d] = fecha.split("-").map(Number);
  return m === 3 && d >= 25 && new Date(Date.UTC(y, m - 1, d)).getUTCDay() === 0;
}

/** Genera lecturas horarias sintéticas entre dos fechas (ambas incluidas). */
export function generarLecturas(o: OpcionesPerfil): Lectura[] {
  const dias = diasEntre(o.desde, o.hasta);
  const lecturas: Lectura[] = [];
  for (let i = 0; i < dias; i++) {
    const fecha = sumarDias(o.desde, i);
    const finde = esFinDeSemanaOFestivo(fecha, o.festivos);
    const est = ESTACION[Number(fecha.slice(5, 7)) - 1];
    const corto = esDiaCambioMarzo(fecha);
    forma(o.tipo, finde).forEach((v, hora) => {
      if (!(corto && hora === 2)) lecturas.push({ fecha, hora, kwh: v * est }); // de 2 a 3 no existe ese día
    });
  }
  const objetivo = (o.anualKwh * dias) / 365;
  const suma = lecturas.reduce((a, l) => a + l.kwh, 0);
  for (const l of lecturas) l.kwh *= objetivo / suma;

  if (o.porPeriodo) {
    const totalFactura = o.porPeriodo[1] + o.porPeriodo[2] + o.porPeriodo[3];
    if (totalFactura > 0) {
      const actual: Record<PeriodoEnergia, number> = { 1: 0, 2: 0, 3: 0 };
      for (const l of lecturas) actual[periodoEnergia(l.fecha, l.hora, o.festivos)] += l.kwh;
      const factor = ([1, 2, 3] as PeriodoEnergia[]).reduce(
        (acc, p) => ({ ...acc, [p]: actual[p] > 0 ? (objetivo * (o.porPeriodo![p] / totalFactura)) / actual[p] : 0 }),
        {} as Record<PeriodoEnergia, number>,
      );
      for (const l of lecturas) l.kwh *= factor[periodoEnergia(l.fecha, l.hora, o.festivos)];
    }
  }
  for (const l of lecturas) l.kwh = Math.round(l.kwh * 1e6) / 1e6;
  return lecturas;
}

/** Escala el consumo (cambio de hábitos: +10 % → 1.1). */
export function escalarConsumo(lecturas: Lectura[], factor: number): Lectura[] {
  return lecturas.map((l) => ({ ...l, kwh: l.kwh * factor }));
}

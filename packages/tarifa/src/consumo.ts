// Análisis del fichero de consumos y facturas por ciclo de facturación.

import { esFinDeSemanaOFestivo, periodoEnergia, diaSemana, sumarDias, type PeriodoEnergia } from "./periodos";
import { calcularFactura, type Contexto, type Factura, type Lectura, type Potencias, type Tarifa } from "./factura";

export interface ResumenConsumo {
  kwh: number;
  dias: number;
  desde: string;
  hasta: string;
  mediaDia: number;
  /** kWh al año extrapolados */
  anual: number;
  porPeriodo: Record<PeriodoEnergia, number>;
  porMes: { mes: string; kwh: number; dias: number }[];
  /** kWh medios por hora del día (0–23) */
  perfilLaborable: number[];
  perfilFinde: number[];
  /** kWh medios por día de la semana (0 = lunes … 6 = domingo) */
  porDiaSemana: number[];
  /** Consumo base: media de las horas más bajas de cada noche (kW medio continuo) */
  baseKw: number;
  /** kWh al año que supone el consumo base */
  baseAnual: number;
  maxHora: { fecha: string; hora: number; kwh: number };
  topDias: { fecha: string; kwh: number }[];
  /** kWh medios por mes del año (0–11) y hora (0–23); null si no hay datos de ese mes */
  calor: (number | null)[][];
}

const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function analizarConsumo(lecturas: Lectura[], festivos: ReadonlySet<string>): ResumenConsumo {
  const porDia = new Map<string, number>();
  const porMes = new Map<string, { kwh: number; dias: Set<string> }>();
  const porPeriodo: Record<PeriodoEnergia, number> = { 1: 0, 2: 0, 3: 0 };
  const lab: number[][] = Array.from({ length: 24 }, () => []);
  const fin: number[][] = Array.from({ length: 24 }, () => []);
  const calorSum = Array.from({ length: 12 }, () => new Array(24).fill(0));
  const calorN = Array.from({ length: 12 }, () => new Array(24).fill(0));
  const noches = new Map<string, number[]>();
  let maxHora = { fecha: lecturas[0]?.fecha ?? "", hora: 0, kwh: 0 };
  let kwh = 0;

  for (const l of lecturas) {
    kwh += l.kwh;
    porDia.set(l.fecha, (porDia.get(l.fecha) ?? 0) + l.kwh);
    const mes = l.fecha.slice(0, 7);
    const m = porMes.get(mes) ?? { kwh: 0, dias: new Set<string>() };
    m.kwh += l.kwh;
    m.dias.add(l.fecha);
    porMes.set(mes, m);
    porPeriodo[periodoEnergia(l.fecha, l.hora, festivos)] += l.kwh;
    (esFinDeSemanaOFestivo(l.fecha, festivos) ? fin : lab)[l.hora].push(l.kwh);
    const mi = Number(l.fecha.slice(5, 7)) - 1;
    calorSum[mi][l.hora] += l.kwh;
    calorN[mi][l.hora]++;
    if (l.hora >= 1 && l.hora <= 5) noches.set(l.fecha, [...(noches.get(l.fecha) ?? []), l.kwh]);
    if (l.kwh > maxHora.kwh) maxHora = { fecha: l.fecha, hora: l.hora, kwh: l.kwh };
  }

  const fechas = [...porDia.keys()].sort();
  const dias = fechas.length;
  const sem: number[][] = Array.from({ length: 7 }, () => []);
  for (const [f, k] of porDia) sem[(diaSemana(f) + 6) % 7].push(k);
  // Consumo base: el mínimo de cada madrugada (nevera, router, aparatos en espera), mediana de todas.
  const minimos = [...noches.values()].map((v) => Math.min(...v)).sort((a, b) => a - b);
  const baseKw = minimos.length ? minimos[Math.floor(minimos.length / 2)] : 0;

  return {
    kwh,
    dias,
    desde: fechas[0],
    hasta: fechas[dias - 1],
    mediaDia: dias ? kwh / dias : 0,
    anual: dias ? (kwh / dias) * 365 : 0,
    porPeriodo,
    porMes: [...porMes.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([mes, v]) => ({ mes, kwh: v.kwh, dias: v.dias.size })),
    perfilLaborable: lab.map(media),
    perfilFinde: fin.map(media),
    porDiaSemana: sem.map(media),
    baseKw,
    baseAnual: baseKw * 8760,
    maxHora,
    topDias: [...porDia.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([fecha, k]) => ({ fecha, kwh: k })),
    calor: calorSum.map((fila, m) => fila.map((s, h) => (calorN[m][h] ? s / calorN[m][h] : null))),
  };
}

export interface FacturaCiclo extends Factura {
  /** Fechas del ciclo de facturación (ambas incluidas) */
  ciclo: { desde: string; hasta: string };
  completo: boolean;
}

/**
 * Divide el consumo en ciclos de facturación que empiezan el día `diaInicio` de cada mes
 * y calcula la factura de cada uno, como haría la comercializadora.
 */
export function facturasPorCiclo(
  lecturas: Lectura[],
  tarifa: Tarifa,
  potencias: Potencias,
  ctx: Contexto,
  diaInicio = 1,
): FacturaCiclo[] {
  if (!lecturas.length) return [];
  const fechas = [...new Set(lecturas.map((l) => l.fecha))].sort();
  const primera = fechas[0];
  const ultima = fechas[fechas.length - 1];
  const inicioCiclo = (f: string) => {
    const [y, m, d] = f.split("-").map(Number);
    const ini = d >= diaInicio ? new Date(Date.UTC(y, m - 1, diaInicio)) : new Date(Date.UTC(y, m - 2, diaInicio));
    return ini.toISOString().slice(0, 10);
  };
  const ciclos = new Map<string, Lectura[]>();
  for (const l of lecturas) {
    const c = inicioCiclo(l.fecha);
    const lista = ciclos.get(c);
    if (lista) lista.push(l);
    else ciclos.set(c, [l]);
  }
  return [...ciclos.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([ini, ls]) => {
    const [y, m] = ini.split("-").map(Number);
    const fin = sumarDias(new Date(Date.UTC(y, m, diaInicio)).toISOString().slice(0, 10), -1);
    const f = calcularFactura(ls, tarifa, potencias, ctx);
    return { ...f, ciclo: { desde: ini, hasta: fin }, completo: ini >= primera && fin <= ultima };
  });
}

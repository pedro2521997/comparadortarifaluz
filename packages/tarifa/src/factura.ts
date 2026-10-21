// Motor de cálculo de una factura 2.0TD (doméstico, hasta 15 kW).
// Todos los precios de las tarifas van SIN impuestos.

import { periodoEnergia, type PeriodoEnergia, sumarDias, diasEntre } from "./periodos";
import { vigenteEn, type Regulados } from "./regulados";

export interface Lectura {
  /** Fecha local YYYY-MM-DD */
  fecha: string;
  /** Hora de reloj en que empieza la lectura (0–23). El día del cambio de octubre puede repetirse una hora. */
  hora: number;
  kwh: number;
}

export interface Tarifa {
  id: string;
  comercializadora: string;
  nombre: string;
  tipo: "fijo" | "periodos" | "pvpc";
  /** €/kW·día */
  potencia: { p1: number; p2: number } | null;
  /** €/kWh */
  energia: { p1: number; p2: number; p3: number } | null;
  cuota_fija_mes: number;
  permanencia_meses: number;
  servicios_obligatorios: string[];
  url_fuente: string;
  fecha_comprobacion: string | null;
  comision: boolean;
  url_contratar: string;
  notas?: string;
}

export interface Potencias {
  p1: number;
  p2: number;
}

/** Precios PVPC (€/kWh, con peajes y cargos) por fecha: array indexado por hora de reloj 0–23. */
export type PreciosPorHora = Record<string, number[]>;

export interface Contexto {
  regulados: Regulados;
  festivos: ReadonlySet<string>;
  /** Necesario solo para tarifas PVPC. */
  pvpc?: PreciosPorHora;
}

export interface Factura {
  tarifaId: string;
  desde: string;
  hasta: string;
  dias: number;
  kwh: number;
  kwhPorPeriodo: Record<PeriodoEnergia, number>;
  potencia: number;
  energia: number;
  cuotaFija: number;
  bonoSocial: number;
  iee: number;
  alquiler: number;
  baseIva: number;
  iva: number;
  total: number;
  /** Horas sin precio PVPC que se han valorado con la media del periodo. */
  horasSinPrecio: number;
  avisos: string[];
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function agruparPorDia(lecturas: Lectura[]): Map<string, Lectura[]> {
  const dias = new Map<string, Lectura[]>();
  for (const l of lecturas) {
    const lista = dias.get(l.fecha);
    if (lista) lista.push(l);
    else dias.set(l.fecha, [l]);
  }
  return dias;
}

export function rango(lecturas: Lectura[]): { desde: string; hasta: string } {
  let desde = lecturas[0].fecha;
  let hasta = lecturas[0].fecha;
  for (const l of lecturas) {
    if (l.fecha < desde) desde = l.fecha;
    if (l.fecha > hasta) hasta = l.fecha;
  }
  return { desde, hasta };
}

/**
 * Calcula la factura de `lecturas` con `tarifa`.
 * Los regulados (IVA, IEE, bono social, alquiler) se aplican día a día con el valor vigente en cada fecha.
 */
export function calcularFactura(lecturas: Lectura[], tarifa: Tarifa, potencias: Potencias, ctx: Contexto): Factura {
  if (lecturas.length === 0) throw new Error("No hay lecturas de consumo");
  const { desde, hasta } = rango(lecturas);
  const dias = diasEntre(desde, hasta);
  const porDia = agruparPorDia(lecturas);
  const avisos = new Set<string>();

  // Media PVPC disponible, para rellenar huecos de forma explícita.
  let mediaPvpc = 0;
  if (tarifa.tipo === "pvpc") {
    if (!ctx.pvpc) throw new Error("Faltan los precios PVPC para calcular esta tarifa");
    const todos = Object.values(ctx.pvpc).flat().filter((n) => Number.isFinite(n));
    mediaPvpc = todos.length ? todos.reduce((a, b) => a + b, 0) / todos.length : 0;
  }

  const kwhPorPeriodo: Record<PeriodoEnergia, number> = { 1: 0, 2: 0, 3: 0 };
  let kwh = 0, potencia = 0, energia = 0, cuotaFija = 0, bonoSocial = 0, iee = 0, alquiler = 0, iva = 0;
  let horasSinPrecio = 0;

  for (let i = 0; i < dias; i++) {
    const fecha = sumarDias(desde, i);
    const lecturasDia = porDia.get(fecha) ?? [];

    let energiaDia = 0;
    let kwhDia = 0;
    for (const l of lecturasDia) {
      const p = periodoEnergia(l.fecha, l.hora, ctx.festivos);
      kwhPorPeriodo[p] += l.kwh;
      kwhDia += l.kwh;
      if (tarifa.tipo === "pvpc") {
        const precio = ctx.pvpc![l.fecha]?.[l.hora];
        if (precio === undefined || !Number.isFinite(precio)) {
          horasSinPrecio++;
          energiaDia += l.kwh * mediaPvpc;
        } else {
          energiaDia += l.kwh * precio;
        }
      } else {
        const e = tarifa.energia!;
        energiaDia += l.kwh * (p === 1 ? e.p1 : p === 2 ? e.p2 : e.p3);
      }
    }
    kwh += kwhDia;

    const precioPot = tarifa.tipo === "pvpc"
      ? vigenteEn(ctx.regulados.pvpc_potencia_eur_kw_dia, fecha)
      : { valor: tarifa.potencia!, exacto: true };
    if (!precioPot.exacto) avisos.add("Hay días sin precio de potencia PVPC vigente; se ha usado el más cercano.");
    const potenciaDia = potencias.p1 * precioPot.valor.p1 + potencias.p2 * precioPot.valor.p2;
    const cuotaDia = (tarifa.cuota_fija_mes * 12) / 365;

    const bono = vigenteEn(ctx.regulados.bono_social_eur_dia, fecha);
    const ieeV = vigenteEn(ctx.regulados.iee, fecha);
    const alq = vigenteEn(ctx.regulados.alquiler_contador_eur_dia, fecha);
    const ivaV = vigenteEn(ctx.regulados.iva, fecha);
    if (!bono.exacto || !ieeV.exacto || !alq.exacto || !ivaV.exacto) {
      avisos.add("Parte del periodo queda fuera de las fechas de impuestos que tenemos; se han usado los valores más cercanos.");
    }

    const ieeDia = Math.max(
      ieeV.valor.valor * (potenciaDia + energiaDia + bono.valor.valor),
      (kwhDia / 1000) * ieeV.valor.minimo_eur_mwh,
    );
    const baseDia = potenciaDia + energiaDia + cuotaDia + bono.valor.valor + ieeDia + alq.valor.valor;

    potencia += potenciaDia;
    energia += energiaDia;
    cuotaFija += cuotaDia;
    bonoSocial += bono.valor.valor;
    iee += ieeDia;
    alquiler += alq.valor.valor;
    iva += baseDia * ivaV.valor.valor;
  }

  if (horasSinPrecio > 0) {
    avisos.add(`${horasSinPrecio} horas sin precio PVPC publicado se han valorado con el precio medio.`);
  }
  const huecos = dias * 24 - lecturas.length;
  if (huecos > 24) avisos.add(`Al fichero le faltan unas ${huecos} horas de consumo: el total puede quedarse corto.`);

  const baseIva = potencia + energia + cuotaFija + bonoSocial + iee + alquiler;
  return {
    tarifaId: tarifa.id,
    desde,
    hasta,
    dias,
    kwh,
    kwhPorPeriodo,
    potencia: r2(potencia),
    energia: r2(energia),
    cuotaFija: r2(cuotaFija),
    bonoSocial: r2(bonoSocial),
    iee: r2(iee),
    alquiler: r2(alquiler),
    baseIva: r2(baseIva),
    iva: r2(iva),
    total: r2(baseIva + iva),
    horasSinPrecio,
    avisos: [...avisos],
  };
}

/** Días desde la última comprobación; null si nunca se comprobó. */
export function diasSinComprobar(tarifa: Tarifa, hoy: string): number | null {
  if (!tarifa.fecha_comprobacion) return null;
  return diasEntre(tarifa.fecha_comprobacion, hoy) - 1;
}

/** Una tarifa sin comprobar o con más de 45 días está "por revisar". */
export function porRevisar(tarifa: Tarifa, hoy: string): boolean {
  const d = diasSinComprobar(tarifa, hoy);
  return d === null || d > 45;
}

export interface Comparacion {
  tarifa: Tarifa;
  factura: Factura;
  porRevisar: boolean;
}

/**
 * Calcula todas las tarifas y las ordena SOLO por precio.
 * Las tarifas "por revisar" van detrás de las comprobadas para que nunca aparezcan las primeras,
 * pero la comisión nunca influye en el orden.
 */
export function compararTarifas(
  lecturas: Lectura[],
  tarifas: Tarifa[],
  potencias: Potencias,
  ctx: Contexto,
  hoy: string,
): Comparacion[] {
  const resultados: Comparacion[] = [];
  for (const tarifa of tarifas) {
    if (tarifa.tipo === "pvpc" && !ctx.pvpc) continue;
    resultados.push({ tarifa, factura: calcularFactura(lecturas, tarifa, potencias, ctx), porRevisar: porRevisar(tarifa, hoy) });
  }
  return resultados.sort((a, b) => Number(a.porRevisar) - Number(b.porRevisar) || a.factura.total - b.factura.total);
}

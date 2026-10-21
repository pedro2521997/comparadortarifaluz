// Tarifas indexadas: el precio de la energía de cada hora sale del mercado mayorista.
//
//   precio_h = [ (OMIE_h + ajustes_mes) × (1 + pérdidas_p × factor_pérdidas) + FNEE + extra ] × factor_TM
//              + peajes_y_cargos_p + margen
//
// - OMIE_h: precio del mercado diario (media de los cuartos de hora) — REData, indicador 600.
// - ajustes_mes: precio final de la demanda − mercado diario (servicios de ajuste, capacidad, intradiario…),
//   media nacional mensual de REData. Si falta el mes (el mes en curso), se usa la media de los conocidos.
// - pérdidas_p: coeficientes 2.0TD de la Circular 3/2020 de la CNMC.
// - factor_TM: tasa municipal (1,5 %) tal y como la aplica cada comercializadora.
// Es una aproximación: las comercializadoras liquidan con datos horarios de ESIOS que no son públicos sin token.

import type { PeriodoEnergia } from "./periodos";
import { vigenteEn, type Regulados } from "./regulados";

export interface ParamsIndexada {
  /** Multiplicador sobre el coeficiente de pérdidas regulado (Lucera: 1,067) */
  factor_perdidas: number;
  /** Se suma el FNEE regulado al coste de la energía */
  fnee: boolean;
  /** Otros costes por kWh antes de la tasa municipal (garantías de origen…) */
  extra_kwh: number;
  /** Tasa municipal: 1 + TM/(1−TM) = 1,01523 · (1+TM)/(1−TM) = 1,03046 · 1,015 */
  factor_tm: number;
  /** Margen de la comercializadora por kWh (después de impuestos municipales) */
  margen_kwh: number;
  /** "oficial": fórmula publicada por la comercializadora; "terceros": publicada por un comparador; "aproximada": sin fórmula publicada */
  formula: "oficial" | "terceros" | "aproximada";
  /** La fórmula tal y como la publica la comercializadora (para mostrarla) */
  descripcion: string;
  url_formula?: string;
}

/** Datos de mercado por fecha: OMIE horario en €/kWh (hora de reloj 0–23) y ajustes mensuales en €/kWh. */
export interface Mercado {
  spot: Record<string, (number | null)[] | null>;
  ajustes: Record<string, number>;
}

export interface MercadoPreparado extends Mercado {
  mediaSpot: number;
  mediaAjustes: number;
}

export function prepararMercado(m: Mercado): MercadoPreparado {
  const spots = Object.values(m.spot).flatMap((d) => d ?? []).filter((x): x is number => x !== null && Number.isFinite(x));
  const ajustes = Object.values(m.ajustes).filter((x) => Number.isFinite(x));
  return {
    ...m,
    mediaSpot: spots.length ? spots.reduce((a, b) => a + b, 0) / spots.length : 0,
    mediaAjustes: ajustes.length ? ajustes.reduce((a, b) => a + b, 0) / ajustes.length : 0,
  };
}

export interface PrecioHora {
  precio: number;
  /** No había OMIE para esa hora y se ha usado la media */
  sinSpot: boolean;
  /** No había ajustes para ese mes y se ha usado la media */
  sinAjuste: boolean;
}

/** Precio de la energía (€/kWh, sin impuestos) de una hora con una tarifa indexada. */
export function precioIndexado(
  fecha: string,
  hora: number,
  periodo: PeriodoEnergia,
  p: ParamsIndexada,
  m: MercadoPreparado,
  regulados: Regulados,
): PrecioHora {
  const spotDia = m.spot[fecha];
  const s = spotDia?.[hora];
  const sinSpot = s === null || s === undefined || !Number.isFinite(s);
  const spot = sinSpot ? m.mediaSpot : (s as number);
  const aj = m.ajustes[fecha.slice(0, 7)];
  const sinAjuste = aj === undefined;
  const ajuste = sinAjuste ? m.mediaAjustes : aj;

  const perd = regulados.perdidas_2_0td ? vigenteEn(regulados.perdidas_2_0td, fecha).valor : { p1: 0.167, p2: 0.163, p3: 0.18 };
  const kPerd = (periodo === 1 ? perd.p1 : periodo === 2 ? perd.p2 : perd.p3) * p.factor_perdidas;
  const fnee = p.fnee && regulados.fnee_eur_kwh ? vigenteEn(regulados.fnee_eur_kwh, fecha).valor.valor : 0;
  const atr = regulados.peajes_cargos_energia_eur_kwh ? vigenteEn(regulados.peajes_cargos_energia_eur_kwh, fecha).valor : { p1: 0, p2: 0, p3: 0 };
  const peajes = periodo === 1 ? atr.p1 : periodo === 2 ? atr.p2 : atr.p3;

  const precio = ((spot + ajuste) * (1 + kPerd) + fnee + p.extra_kwh) * p.factor_tm + peajes + p.margen_kwh;
  return { precio, sinSpot, sinAjuste };
}

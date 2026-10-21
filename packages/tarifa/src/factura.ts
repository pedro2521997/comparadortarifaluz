// Motor de cálculo de una factura 2.0TD (doméstico, hasta 15 kW).
// Todos los precios de las tarifas van SIN impuestos.

import { periodoEnergia, type PeriodoEnergia, sumarDias, diasEntre } from "./periodos";
import { vigenteEn, type Regulados } from "./regulados";
import { precioIndexado, prepararMercado, type Mercado, type ParamsIndexada } from "./indexada";

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
  tipo: "fijo" | "periodos" | "pvpc" | "indexada";
  /** €/kW·día */
  potencia: { p1: number; p2: number } | null;
  /** €/kWh */
  energia: { p1: number; p2: number; p3: number } | null;
  cuota_fija_mes: number;
  /** Servicio obligatorio (mantenimiento, asistencia…) en €/mes sin IVA. Lleva IVA pero no impuesto eléctrico. */
  servicio_mes?: number;
  permanencia_meses: number;
  servicios_obligatorios: string[];
  url_fuente: string;
  fecha_comprobacion: string | null;
  comision: boolean;
  url_contratar: string;
  notas?: string;
  /** "cnmc" (importada del comparador oficial), "manual" (web de la comercializadora) o "regulada" */
  origen?: string;
  info?: InfoTarifa;
  /** Solo tarifas indexadas: cómo se calcula el precio de cada hora a partir del mercado */
  indexada?: ParamsIndexada;
}

/** Datos adicionales de una tarifa: condiciones, promociones y particularidades del cálculo. */
export interface InfoTarifa {
  cnmc_id?: number;
  /** La comercializadora no factura aparte la financiación del bono social. */
  incluye_bono_social?: boolean;
  /** Periodos elegidos por el cliente (p. ej. "10 horas"): el cálculo con periodos 2.0TD es aproximado. */
  horario_propio?: boolean;
  verde?: boolean;
  servicios_adicionales?: boolean;
  penalizacion?: string | null;
  validez?: string | null;
  limitaciones?: string | null;
  potencia_max_kw?: number | null;
  consumo_max_kwh?: number | null;
  revision?: string | null;
  condiciones_revision?: string | null;
  contratacion?: { internet: boolean; telefono: boolean; oficina: boolean };
  url_contrato?: string | null;
  /** Exige un servicio cuyo precio no se publica: el total está incompleto. */
  servicio_sin_precio?: boolean;
  /** Ahorro del primer año según la CNMC (€ con impuestos, perfil de la CNMC). */
  promo_primer_anio_eur?: number;
  /** Descuento sobre la energía durante los primeros meses. */
  descuento_energia?: { pct: number; meses: number } | null;
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
  /** Necesario solo para tarifas indexadas: OMIE horario y ajustes mensuales. */
  mercado?: Mercado;
  /** Zona fiscal: en Canarias se paga IGIC y en Ceuta y Melilla, IPSI, en lugar del IVA. */
  zona?: Zona;
  /** Descuento del bono social (solo se aplica a la PVPC). */
  bonoSocial?: { descuento: number; limiteAnualKwh: number } | null;
  /** Aplicar las promociones del primer año (descuentos temporales). Por defecto, no: se compara el precio estable. */
  promociones?: boolean;
}

export type Zona = "peninsula" | "canarias" | "ceuta_melilla";

/**
 * Impuesto indirecto según la zona [verificar en cada momento]:
 * IGIC 0 % para suministros domésticos de hasta 10 kW (3 % por encima); IPSI 1 % en Ceuta y Melilla.
 */
export function impuestoZona(zona: Zona | undefined, ivaPeninsula: number, potencias: Potencias): number {
  if (zona === "canarias") return Math.max(potencias.p1, potencias.p2) <= 10 ? 0 : 0.03;
  if (zona === "ceuta_melilla") return 0.01;
  return ivaPeninsula;
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
  /** Servicios obligatorios (sin IVA) */
  servicios: number;
  bonoSocial: number;
  iee: number;
  alquiler: number;
  baseIva: number;
  iva: number;
  /** Promociones del primer año descontadas (€, impuestos incluidos); 0 si no se aplican. */
  promociones: number;
  /** Descuento del bono social aplicado (sin impuestos) */
  descuentoBonoSocial: number;
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

  const mercado = tarifa.tipo === "indexada" ? (ctx.mercado ? prepararMercado(ctx.mercado) : null) : null;
  if (tarifa.tipo === "indexada" && (!mercado || !tarifa.indexada)) throw new Error("Faltan los precios de mercado para calcular esta tarifa indexada");
  let horasSinAjuste = 0;

  const kwhPorPeriodo: Record<PeriodoEnergia, number> = { 1: 0, 2: 0, 3: 0 };
  let servicios = 0;
  let kwh = 0, potencia = 0, energia = 0, cuotaFija = 0, bonoSocial = 0, iee = 0, alquiler = 0, iva = 0;
  let horasSinPrecio = 0;
  const descuento = ctx.promociones ? tarifa.info?.descuento_energia ?? null : null;
  const diasDescuento = descuento ? descuento.meses * 30.44 : 0;
  const cobraBono = !tarifa.info?.incluye_bono_social;
  const bonoSocial_ = tarifa.tipo === "pvpc" && ctx.bonoSocial ? ctx.bonoSocial : null;
  let descuentoBonoSocial = 0;

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
      } else if (tarifa.tipo === "indexada") {
        const h = precioIndexado(l.fecha, l.hora, p, tarifa.indexada!, mercado!, ctx.regulados);
        if (h.sinSpot) horasSinPrecio++;
        if (h.sinAjuste) horasSinAjuste++;
        energiaDia += l.kwh * h.precio;
      } else {
        const e = tarifa.energia!;
        energiaDia += l.kwh * (p === 1 ? e.p1 : p === 2 ? e.p2 : e.p3);
      }
    }
    kwh += kwhDia;
    if (descuento && i < diasDescuento) energiaDia *= 1 - descuento.pct;

    const precioPot = tarifa.tipo === "pvpc"
      ? vigenteEn(ctx.regulados.pvpc_potencia_eur_kw_dia, fecha)
      : { valor: tarifa.potencia!, exacto: true };
    if (!precioPot.exacto) avisos.add("Hay días sin precio de potencia PVPC vigente; se ha usado el más cercano.");
    const potenciaDia = potencias.p1 * precioPot.valor.p1 + potencias.p2 * precioPot.valor.p2;
    let descuentoDia = 0;
    const cuotaDia = (tarifa.cuota_fija_mes * 12) / 365;
    const servicioDia = ((tarifa.servicio_mes ?? 0) * 12) / 365;

    const bono = vigenteEn(ctx.regulados.bono_social_eur_dia, fecha);
    const ieeV = vigenteEn(ctx.regulados.iee, fecha);
    const alq = vigenteEn(ctx.regulados.alquiler_contador_eur_dia, fecha);
    const ivaV = vigenteEn(ctx.regulados.iva, fecha);
    if (!bono.exacto || !ieeV.exacto || !alq.exacto || !ivaV.exacto) {
      avisos.add("Parte del periodo queda fuera de las fechas de impuestos que tenemos; se han usado los valores más cercanos.");
    }

    const bonoDia = cobraBono ? bono.valor.valor : 0;
    // Bono social: descuento sobre la potencia y la energía de los kWh dentro del límite (prorrateado por día).
    if (bonoSocial_ && kwhDia > 0) {
      const dentro = Math.min(1, bonoSocial_.limiteAnualKwh / 365 / kwhDia);
      const d = bonoSocial_.descuento * (potenciaDia + energiaDia * dentro);
      descuentoBonoSocial += d;
      descuentoDia = d;
    }
    const ieeDia = Math.max(
      ieeV.valor.valor * (potenciaDia + energiaDia - descuentoDia + bonoDia),
      (kwhDia / 1000) * ieeV.valor.minimo_eur_mwh,
    );
    const baseDia = potenciaDia + energiaDia - descuentoDia + cuotaDia + bonoDia + ieeDia + alq.valor.valor + servicioDia;

    potencia += potenciaDia;
    energia += energiaDia;
    cuotaFija += cuotaDia;
    servicios += servicioDia;
    bonoSocial += bonoDia;
    iee += ieeDia;
    alquiler += alq.valor.valor;
    iva += baseDia * impuestoZona(ctx.zona, ivaV.valor.valor, potencias);
  }

  if (horasSinPrecio > 0) {
    avisos.add(`${horasSinPrecio} horas sin precio ${tarifa.tipo === "indexada" ? "de mercado" : "PVPC"} publicado se han valorado con el precio medio.`);
  }
  if (horasSinAjuste > 0) avisos.add("Para el mes en curso aún no hay costes de ajuste publicados: se ha usado la media de los meses anteriores.");
  if (tarifa.tipo === "indexada" && tarifa.indexada?.formula !== "oficial") {
    avisos.add(tarifa.indexada?.formula === "terceros" ? "Fórmula publicada por un comparador, no por la comercializadora: cálculo aproximado." : "La comercializadora no publica la fórmula completa: calculado como coste de mercado más su cuota.");
  }
  const huecos = dias * 24 - lecturas.length;
  if (huecos > 24) avisos.add(`Al fichero le faltan unas ${huecos} horas de consumo: el total puede quedarse corto.`);

  const baseIva = potencia + energia - descuentoBonoSocial + cuotaFija + bonoSocial + iee + alquiler + servicios;
  if (descuentoBonoSocial) avisos.add(`Incluye ${r2(descuentoBonoSocial)} € de descuento del bono social (${Math.round(bonoSocial_!.descuento * 1000) / 10} % hasta ${bonoSocial_!.limiteAnualKwh} kWh al año).`);
  if (ctx.zona === "canarias") avisos.add("Canarias: IGIC en lugar de IVA.");
  if (ctx.zona === "ceuta_melilla") avisos.add("Ceuta y Melilla: IPSI en lugar de IVA. Los horarios de los periodos son distintos y aquí usamos los peninsulares.");
  if (tarifa.info?.servicio_sin_precio) avisos.add("Exige contratar un servicio cuyo precio no se publica: el total real será mayor.");
  // Promoción global del primer año que da la CNMC: se reparte por días (máximo un año).
  const promociones = ctx.promociones && tarifa.info?.promo_primer_anio_eur ? (tarifa.info.promo_primer_anio_eur * Math.min(dias, 365)) / 365 : 0;
  if (descuento) avisos.add(`Incluye el ${Math.round(descuento.pct * 100)} % de descuento en la energía durante ${descuento.meses} meses.`);
  if (promociones) avisos.add(`Incluye ${r2(promociones)} € de promoción del primer año.`);
  if (tarifa.info?.horario_propio) avisos.add("Esta tarifa tiene horas baratas elegidas por el cliente: el cálculo con los periodos 2.0TD es aproximado.");
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
    servicios: r2(servicios),
    bonoSocial: r2(bonoSocial),
    iee: r2(iee),
    alquiler: r2(alquiler),
    baseIva: r2(baseIva),
    iva: r2(iva),
    promociones: r2(promociones),
    descuentoBonoSocial: r2(descuentoBonoSocial),
    total: r2(baseIva + iva - promociones),
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
  /** El total no incluye algún coste obligatorio sin precio publicado. */
  incompleta: boolean;
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
    if (tarifa.tipo === "indexada" && !ctx.mercado) continue;
    resultados.push({
      tarifa,
      factura: calcularFactura(lecturas, tarifa, potencias, ctx),
      porRevisar: porRevisar(tarifa, hoy),
      incompleta: Boolean(tarifa.info?.servicio_sin_precio),
    });
  }
  const detras = (c: Comparacion) => Number(c.porRevisar || c.incompleta);
  return resultados.sort((a, b) => detras(a) - detras(b) || a.factura.total - b.factura.total);
}

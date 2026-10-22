// Cálculo de autoconsumo solar hora a hora (matrices mes × hora de un día medio).
// Producción: PVGIS (Comisión Europea) a través de /api/pvgis; si falla, una aproximación por latitud.

export type Matriz = number[][]; // [mes 0–11][hora 0–23] kWh en esa hora de un día medio

export const DIAS_MES = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export interface Ubicacion {
  lat: number;
  lon: number;
  canarias: boolean;
}

/** Desfase horario local respecto a UTC (aprox.: horario de verano de abril a octubre). */
function desfase(mes: number, canarias: boolean): number {
  const verano = mes >= 3 && mes <= 9;
  return (canarias ? 0 : 1) + (verano ? 1 : 0);
}

/** Producción de 1 kWp por mes y hora local a partir de la serie horaria de PVGIS (W, hora UTC). */
export function matrizDesdePvgis(horario: { time: string; P: number }[], canarias: boolean): Matriz {
  const suma: Matriz = Array.from({ length: 12 }, () => new Array(24).fill(0));
  const n: Matriz = Array.from({ length: 12 }, () => new Array(24).fill(0));
  for (const r of horario) {
    const mes = Number(r.time.slice(4, 6)) - 1;
    const horaUtc = Number(r.time.slice(9, 11));
    const h = (horaUtc + desfase(mes, canarias)) % 24;
    suma[mes][h] += r.P / 1000;
    n[mes][h]++;
  }
  return suma.map((fila, m) => fila.map((s, h) => (n[m][h] ? s / n[m][h] : 0)));
}

export async function produccionPvgis(u: Ubicacion, inclinacion: number, azimut: number): Promise<Matriz> {
  const q = new URLSearchParams({
    lat: u.lat.toFixed(2),
    lon: u.lon.toFixed(2),
    peakpower: "1",
    loss: "14",
    angle: String(inclinacion),
    aspect: String(azimut),
    startyear: "2023",
    endyear: "2023",
    pvcalculation: "1",
    outputformat: "json",
  });
  const r = await fetch(`/api/pvgis?${q}`);
  if (!r.ok) throw new Error(`PVGIS ${r.status}`);
  const j = await r.json();
  const horario = j.outputs?.hourly;
  if (!Array.isArray(horario) || horario.length < 8000) throw new Error("PVGIS sin datos horarios");
  return matrizDesdePvgis(horario, u.canarias);
}

/** Aproximación sin PVGIS: rendimiento anual por latitud y una campana solar por mes. */
export function produccionAproximada(u: Ubicacion, azimut: number): Matriz {
  const anual = Math.min(1750, Math.max(1250, 1350 + (43.5 - u.lat) * 30)) * (1 - Math.min(Math.abs(azimut), 90) / 90 * 0.18);
  const reparto = [0.052, 0.062, 0.083, 0.093, 0.106, 0.112, 0.118, 0.111, 0.091, 0.073, 0.054, 0.045];
  const horasSol = [9.5, 10.5, 12, 13, 14, 14.8, 14.5, 13.5, 12.3, 11, 9.8, 9.2];
  return reparto.map((peso, m) => {
    const mediodia = 12 + desfase(m, u.canarias) + (u.canarias ? 1 : 0.25);
    const ancho = horasSol[m] / 2;
    const campana = Array.from({ length: 24 }, (_, h) => {
      const x = (h + 0.5 - mediodia) / ancho;
      return Math.abs(x) < 1 ? Math.cos((x * Math.PI) / 2) ** 2 : 0;
    });
    const total = campana.reduce((a, b) => a + b, 0);
    const diario = (anual * peso) / DIAS_MES[m];
    return campana.map((c) => (c / total) * diario);
  });
}

/** Perfil tipo de un hogar (kWh/h) escalado a un consumo anual. */
export function consumoTipo(anualKwh: number, teletrabajo: boolean): Matriz {
  const base = [0.18, 0.15, 0.14, 0.13, 0.13, 0.14, 0.2, 0.42, 0.38, 0.25, 0.22, 0.24, 0.3, 0.45, 0.52, 0.35, 0.26, 0.28, 0.36, 0.48, 0.66, 0.72, 0.55, 0.32];
  const dia = base.map((v, h) => (teletrabajo && h >= 9 && h < 18 ? v + 0.18 : v));
  const estacion = [1.3, 1.25, 1.1, 0.95, 0.9, 1.0, 1.2, 1.2, 1.0, 0.95, 1.1, 1.3];
  const bruto = estacion.map((e) => dia.map((v) => v * e));
  const anualBruto = bruto.reduce((a, fila, m) => a + fila.reduce((x, y) => x + y, 0) * DIAS_MES[m], 0);
  const k = anualKwh / anualBruto;
  return bruto.map((fila) => fila.map((v) => v * k));
}

export interface Simulacion {
  kwp: number;
  produccion: number;
  consumo: number;
  autoconsumo: number;
  excedentes: number;
  /** € al año (impuestos incluidos) */
  ahorroEnergia: number;
  compensacion: number;
  ahorro: number;
  /** kWh al año que salen de la batería (0 sin batería) */
  desdeBateria: number;
  porMes: { produccion: number; consumo: number; autoconsumo: number }[];
}

export interface Precios {
  /** € por kWh comprado, sin impuestos */
  energia: number;
  /** € por kWh de excedente compensado, sin impuestos */
  excedente: number;
  /** IEE + IVA */
  impuestos: number;
}

/** Rendimiento de cada sentido de la batería (carga y descarga): ida y vuelta ≈ 90 %. */
const RENDIMIENTO_BATERIA = 0.95;

/**
 * Cruza hora a hora producción y consumo. Excedentes con compensación simplificada:
 * nunca descuentan más que el término de energía de cada mes [verificar normativa vigente].
 * Con `bateria` (kWh útiles), los excedentes cargan la batería y esta cubre el consumo de las horas sin sol.
 */
export function simular(prod1kWp: Matriz, consumo: Matriz, kwp: number, p: Precios, factorProduccion = 1, bateria = 0): Simulacion {
  let produccion = 0, cons = 0, auto = 0, exc = 0, ahorroEnergia = 0, compensacion = 0, desdeBateria = 0;
  const porMes: Simulacion["porMes"] = [];
  for (let m = 0; m < 12; m++) {
    let pm = 0, cm = 0, am = 0, em = 0, bm = 0;
    // Día medio del mes; con batería se repite dos veces para empezar con la carga que deja la noche anterior.
    let soc = 0;
    for (let vuelta = bateria > 0 ? 0 : 1; vuelta < 2; vuelta++) {
      pm = cm = am = em = bm = 0;
      for (let h = 0; h < 24; h++) {
        const pr = prod1kWp[m][h] * kwp * factorProduccion;
        const c = consumo[m][h];
        const directo = Math.min(pr, c);
        const carga = Math.min(pr - directo, (bateria - soc) / RENDIMIENTO_BATERIA);
        soc += carga * RENDIMIENTO_BATERIA;
        const descarga = Math.min(c - directo, soc * RENDIMIENTO_BATERIA);
        soc -= descarga / RENDIMIENTO_BATERIA;
        pm += pr;
        cm += c;
        am += directo + descarga;
        em += pr - directo - carga;
        bm += descarga;
      }
    }
    const d = DIAS_MES[m];
    pm *= d; cm *= d; am *= d; em *= d; bm *= d;
    desdeBateria += bm;
    const ahorroMes = am * p.energia;
    const terminoEnergiaRestante = (cm - am) * p.energia;
    const compMes = Math.min(em * p.excedente, terminoEnergiaRestante);
    produccion += pm; cons += cm; auto += am; exc += em;
    ahorroEnergia += ahorroMes;
    compensacion += compMes;
    porMes.push({ produccion: pm, consumo: cm, autoconsumo: am });
  }
  return {
    kwp,
    produccion,
    consumo: cons,
    autoconsumo: auto,
    excedentes: exc,
    ahorroEnergia: ahorroEnergia * p.impuestos,
    compensacion: compensacion * p.impuestos,
    ahorro: (ahorroEnergia + compensacion) * p.impuestos,
    desdeBateria,
    porMes,
  };
}

export interface Escenario {
  ahorroAnual: number;
  inversion: number;
  amortizacion: number | null;
  neto25: number;
}

/** Ahorro acumulado año a año con degradación de paneles, menos la inversión y un cambio de inversor. */
export function escenario(ahorroAnual: number, inversion: number, degradacion: number, cambioInversor: number): Escenario {
  let acumulado = -inversion;
  let amortizacion: number | null = null;
  for (let y = 1; y <= 25; y++) {
    acumulado += ahorroAnual * (1 - degradacion) ** (y - 1);
    if (y === 13) acumulado -= cambioInversor;
    if (amortizacion === null && acumulado >= 0) amortizacion = y;
  }
  return { ahorroAnual, inversion, amortizacion, neto25: acumulado };
}

/** Tamaño recomendado: la producción cubre ~85 % del consumo anual, dentro del tejado. */
export function tamanoRecomendado(prod1kWp: Matriz, anualKwh: number, maxKwp: number): number {
  const anual1 = prod1kWp.reduce((a, fila, m) => a + fila.reduce((x, y) => x + y, 0) * DIAS_MES[m], 0);
  const ideal = (anualKwh * 0.85) / anual1;
  return Math.max(1, Math.min(maxKwp, Math.round(ideal * 2) / 2));
}

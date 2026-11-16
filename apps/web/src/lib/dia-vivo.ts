// Contenido propio de las páginas «en vivo» (hoy, mañana y ayer), distinto del de la página fija de cada
// fecha (/precio-luz/AAAA-MM-DD/). Cada día, /precio-luz-hoy/ y la página de su fecha tienen el mismo
// precio; si además repiten los mismos textos, Google las ve como duplicadas y deja una sin indexar.
// Por eso aquí todo es relativo y práctico: comparar con los días de al lado, qué hacer con ese precio
// (planificar hoy, programar mañana, revisar lo gastado ayer) y preguntas propias de cada página.
// La página de cada fecha se queda con el análisis de archivo (lib/analisis-dia.ts, lib/contexto-dia.ts).

import { analisisDia, type CosteAparato } from "./analisis-dia";
import { factorImpuestos, preciosDe } from "./datos";
import { mediaHogar, resumen } from "./grafico";
import { TRAMOS, type InfoDia } from "./dia";
import type { Pregunta } from "./faq";
import { ekwh, eur2, fechaCorta, franja, hh, num, sumarDias } from "./formato";
import { forma, esFinDeSemanaOFestivo } from "@lst/tarifa";
import festivosJson from "../../../../data/festivos.json";

export type Modo = "hoy" | "mañana" | "ayer";

const FESTIVOS = new Set(festivosJson.fechas);
/** Consumo de un hogar medio (≈ 3.500 kWh al año). */
export const KWH_DIA_HOGAR = 9.6;

const mediaDe = (xs: (number | null)[]) => {
  const v = xs.filter((p): p is number => p !== null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

// ——— Comparar días por tramos ———

export interface Columna {
  fecha: string;
  titulo: string;
  media: number;
  tramos: (number | null)[];
}

function columna(fecha: string, titulo: string): Columna | null {
  const d = preciosDe(fecha);
  if (!d) return null;
  return { fecha, titulo, media: resumen(d.precios).media, tramos: TRAMOS.map((t) => mediaDe(d.precios.slice(t.desde, t.hasta))) };
}

export interface Comparacion {
  columnas: Columna[];
  /** Frase que resume el cambio entre las dos últimas columnas. */
  frase: string | null;
}

/** Columnas en orden cronológico; la frase compara la columna `base` con la `objetivo` (por título). */
export function compararDias(cols: [fecha: string, titulo: string][], base: string, objetivo: string, sujeto: string): Comparacion {
  const columnas = cols.map(([f, t]) => columna(f, t)).filter((c): c is Columna => c !== null);
  const a = preciosDe(base)?.precios;
  const b = preciosDe(objetivo)?.precios;
  let frase: string | null = null;
  if (a && b) {
    const ma = resumen(a).media;
    const mb = resumen(b).media;
    const d = (mb - ma) / ma;
    let masBaratas = 0, n = 0;
    b.forEach((p, h) => {
      if (p === null || a[h] == null) return;
      n++;
      if (p < a[h]!) masBaratas++;
    });
    const ca = columna(base, "")!.tramos;
    const cb = columna(objetivo, "")!.tramos;
    const difs = TRAMOS.map((t, k) => ({ t, d: ca[k] !== null && cb[k] !== null ? cb[k]! - ca[k]! : 0 }));
    const mayor = difs.reduce((x, y) => (Math.abs(y.d) > Math.abs(x.d) ? y : x));
    const cambio = Math.abs(d) < 0.03 ? "cuesta casi lo mismo" : `${d > 0 ? "sube" : "baja"} un ${num(Math.abs(d) * 100)} %`;
    frase =
      `${sujeto} la luz ${cambio} de media (${ekwh(ma)} → ${ekwh(mb)}). ` +
      `${masBaratas} de las ${n} horas salen más baratas y ${n - masBaratas} más caras.` +
      (Math.abs(mayor.d) >= 0.005 ? ` El mayor cambio, en el tramo de ${mayor.t.nombre.toLowerCase()} (${mayor.d > 0 ? "+" : "−"}${ekwh(Math.abs(mayor.d))}).` : "");
  }
  return { columnas, frase };
}

// ——— Qué hacer con ese precio ———

export interface PlanAparato extends CosteAparato {
  ahorro: number;
}

/** Aparatos con su mejor franja, ordenados por la hora a la que conviene ponerlos (una agenda). */
export function planDia(i: InfoDia): PlanAparato[] {
  const a = analisisDia(i);
  if (!a) return [];
  return a.aparatos.map((c) => ({ ...c, ahorro: c.peor.coste - c.mejor.coste })).sort((x, y) => x.mejor.inicio - y.mejor.inicio);
}

/** Lo que paga un hogar medio por la energía de ese día (sin potencia), impuestos incluidos. */
export function costeHogarDia(fecha: string): number | null {
  const d = preciosDe(fecha);
  if (!d) return null;
  const pesos = forma("estandar", esFinDeSemanaOFestivo(fecha, FESTIVOS));
  return KWH_DIA_HOGAR * mediaHogar(d.precios, pesos) * factorImpuestos(fecha);
}

/** Hora más barata a partir de una hora dada (lo que queda de día). */
function masBarataDesde(precios: (number | null)[], desde: number) {
  let mejor: { h: number; p: number } | null = null;
  for (let h = desde; h < precios.length; h++) {
    const p = precios[h];
    if (p !== null && (!mejor || p < mejor.p)) mejor = { h, p };
  }
  return mejor;
}

// ——— Entradillas propias ———

export function entradillaVivo(i: InfoDia, modo: Modo): string {
  const hoy = sumarDias(i.fecha, modo === "hoy" ? 0 : modo === "mañana" ? -1 : 1);
  const b2 = i.b2 ? franja(i.b2.inicio, 2) : null;
  if (modo === "hoy") {
    return `¿Cuándo poner hoy la lavadora, el lavavajillas o cargar el coche? ${b2 ? `Lo mejor es ${b2}` : `La hora más barata es a las ${hh(i.r.min.h)}`}, y conviene evitar ${i.evitar ? franja(i.evitar.inicio, 2) : `las ${hh(i.r.max.h)}`}. La tabla marca la hora en curso para que sepas si ahora es buen momento.`;
  }
  if (modo === "mañana") {
    const c = compararDias([], hoy, i.fecha, "Mañana");
    return `${c.frase ? `${c.frase.split(". ")[0]}. ` : ""}Deja programados esta noche la lavadora o el coche: ${b2 ? `la mejor franja de mañana es ${b2}` : `la hora más barata es a las ${hh(i.r.min.h)}`}.`;
  }
  const coste = costeHogarDia(i.fecha);
  return `Ayer el PVPC salió a ${ekwh(i.r.media)} de media${coste ? `: un hogar medio pagó unos ${eur2(coste)} por la energía de ese día, impuestos incluidos` : ""}. Comprueba aquí lo que te costó cada aparato según la hora a la que lo pusiste.`;
}

// ——— Preguntas propias de cada página ———

const FIJAS: Record<Modo, Pregunta[]> = {
  hoy: [
    { p: "¿Cuándo se actualiza el precio de la luz de hoy?", r: "El precio de cada día lo publica Red Eléctrica la tarde anterior, hacia las 20:15, y no cambia durante el día. Esta página lo carga sola a medianoche y marca en la tabla la hora en curso." },
    { p: "¿El precio de la luz de hoy incluye impuestos?", r: "No. Son precios del PVPC 2.0TD con peajes y cargos, sin el impuesto eléctrico ni el IVA, que suman alrededor de un 27 % más. Tampoco incluye el término de potencia, que se paga igual a cualquier hora." },
  ],
  mañana: [],
  ayer: [
    { p: "¿Para qué sirve consultar el precio de la luz de ayer?", r: "Para comprobar lo que te costó lo que usaste: la lavadora de anoche, la carga del coche o la calefacción. También para ver si el precio va bajando o subiendo antes de planificar la semana." },
    { p: "¿Por qué mi factura no coincide con el precio de ayer?", r: "Porque la factura suma además el término de potencia, el impuesto eléctrico, el IVA y el alquiler del contador, y reparte tu consumo hora a hora. Si tienes un precio fijo del mercado libre, el precio de ayer del PVPC no te afecta." },
  ],
};

export function preguntasVivo(i: InfoDia, modo: Modo): Pregunta[] {
  const p = preciosDe(i.fecha)!.precios;
  const q: Pregunta[] = [];
  if (modo === "hoy") {
    const tarde = masBarataDesde(p, 14);
    const noche = masBarataDesde(p, 20);
    const ayer = preciosDe(sumarDias(i.fecha, -1));
    q.push({ p: "¿Cuánto cuesta la luz ahora mismo?", r: `Depende de la hora: hoy va de ${ekwh(i.r.min.p)} a las ${hh(i.r.min.h)} a ${ekwh(i.r.max.p)} a las ${hh(i.r.max.h)}. En la tabla de arriba está marcada la hora actual con su precio.` });
    if (tarde) q.push({ p: "¿Quedan horas baratas esta tarde o esta noche?", r: `A partir de las 14:00, la hora más barata es a las ${hh(tarde.h)} (${ekwh(tarde.p)})${noche && noche.h !== tarde.h ? `; a partir de las 20:00, a las ${hh(noche.h)} (${ekwh(noche.p)})` : ""}.` });
    if (ayer) {
      const m = resumen(ayer.precios).media;
      q.push({ p: "¿La luz está hoy más cara o más barata que ayer?", r: `Hoy la media es ${ekwh(i.r.media)}, frente a ${ekwh(m)} ayer: ${Math.abs(i.r.media - m) / m < 0.03 ? "prácticamente igual" : i.r.media > m ? "más cara" : "más barata"}.` });
    }
  } else if (modo === "mañana") {
    const hoy = preciosDe(sumarDias(i.fecha, -1));
    if (hoy) {
      const m = resumen(hoy.precios).media;
      q.push({ p: "¿Mañana sube o baja la luz?", r: `Mañana la media es ${ekwh(i.r.media)}, frente a ${ekwh(m)} hoy: ${Math.abs(i.r.media - m) / m < 0.03 ? "casi igual" : i.r.media > m ? `sube un ${num(((i.r.media - m) / m) * 100)} %` : `baja un ${num(((m - i.r.media) / m) * 100)} %`}.` });
    }
    if (i.b3) q.push({ p: "¿A qué hora programar mañana el coche eléctrico o el termo?", r: `La mejor franja de tres horas seguidas mañana es ${franja(i.b3.inicio, 3)}, a ${ekwh(i.b3.media)} de media sin impuestos.` });
  } else {
    const coste = costeHogarDia(i.fecha);
    const lav = planDia(i).find((c) => /lavadora/i.test(c.nombre));
    if (coste) q.push({ p: "¿Cuánto pagó de luz ayer un hogar medio?", r: `Unos ${eur2(coste)} por la energía (${num(KWH_DIA_HOGAR, 1)} kWh repartidos como gasta un hogar tipo, impuestos incluidos), sin contar el término de potencia.` });
    if (lav) q.push({ p: "¿Cuánto me costó ayer poner la lavadora?", r: `Entre ${eur2(lav.mejor.coste)} si la pusiste ${franja(lav.mejor.inicio, lav.horas)} y ${eur2(lav.peor.coste)} ${franja(lav.peor.inicio, lav.horas)}, con PVPC e impuestos incluidos.` });
  }
  return [...q, ...FIJAS[modo]];
}

/** Rótulo de fecha corto para las columnas: «Ayer (15/11)». */
export const rotulo = (nombre: string, fecha: string) => `${nombre} (${fechaCorta(fecha).slice(0, 5)})`;

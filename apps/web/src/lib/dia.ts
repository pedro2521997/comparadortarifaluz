// Textos de las páginas de precio de un día (hoy, mañana, ayer y archivo), generados en el build con el
// dato de ese día: título y descripción con la fecha completa (lo que busca la gente: «precio luz 26
// octubre 2026»), un resumen en texto, el precio por tramos y preguntas frecuentes únicas para cada día.

import { dias, preciosDe } from "./datos";
import { mejorFranja, resumen } from "./grafico";
import { ekwh, fechaLarga, fechaMedia, franja, hh, hoyMadrid, num, sumarDias } from "./formato";
import type { Pregunta } from "./faq";

export type Etiqueta = "hoy" | "mañana" | "ayer" | null;

/** Hoy, mañana o ayer respecto al día del build (null si es otro día). */
export function etiquetaDe(fecha: string, hoy = hoyMadrid()): Etiqueta {
  return fecha === hoy ? "hoy" : fecha === sumarDias(hoy, 1) ? "mañana" : fecha === sumarDias(hoy, -1) ? "ayer" : null;
}

/** El primer texto que cabe en `max` caracteres (el último si ninguno cabe, recortado). */
export function primeroQueQuepa(opciones: string[], max: number): string {
  return opciones.find((o) => o.length <= max) ?? opciones.at(-1)!.slice(0, max);
}

const media = (xs: (number | null)[]) => {
  const v = xs.filter((p): p is number => p !== null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

/** Media de los `n` días anteriores con datos. */
function mediaDiasAnteriores(fecha: string, n: number): number | null {
  const previos = dias.filter((d) => d.fecha < fecha).slice(-n);
  if (previos.length < Math.min(n, 3)) return null;
  return previos.reduce((a, d) => a + resumen(d.precios).media, 0) / previos.length;
}

const cambio = (a: number, b: number) => {
  const d = (a - b) / b;
  if (Math.abs(d) < 0.03) return "casi igual que";
  return `un ${num(Math.abs(d) * 100)} % más ${d > 0 ? "cara" : "barata"} que`;
};

export const TRAMOS = [
  { nombre: "Madrugada", desde: 0, hasta: 8 },
  { nombre: "Mañana", desde: 8, hasta: 14 },
  { nombre: "Tarde", desde: 14, hasta: 20 },
  { nombre: "Noche", desde: 20, hasta: 24 },
];

export interface InfoDia {
  fecha: string;
  etiqueta: Etiqueta;
  /** "26 de octubre de 2026" */
  fechaM: string;
  r: ReturnType<typeof resumen>;
  b2: ReturnType<typeof mejorFranja>;
  b3: ReturnType<typeof mejorFranja>;
  evitar: ReturnType<typeof mejorFranja>;
  tramos: { nombre: string; desde: number; hasta: number; media: number | null }[];
  vsAnterior: string | null;
  vsSemana: string | null;
}

export function infoDia(fecha: string, hoy = hoyMadrid()): InfoDia | null {
  const dia = preciosDe(fecha);
  if (!dia) return null;
  const p = dia.precios;
  const r = resumen(p);
  const anterior = preciosDe(sumarDias(fecha, -1));
  const semana = mediaDiasAnteriores(fecha, 7);
  return {
    fecha,
    etiqueta: etiquetaDe(fecha, hoy),
    fechaM: fechaMedia(fecha),
    r,
    b2: mejorFranja(p, 2),
    b3: mejorFranja(p, 3),
    evitar: mejorFranja(p, 2, true),
    tramos: TRAMOS.map((t) => ({ ...t, media: media(p.slice(t.desde, t.hasta)) })),
    vsAnterior: anterior ? `${cambio(r.media, resumen(anterior.precios).media)} el día anterior` : null,
    vsSemana: semana ? `${cambio(r.media, semana)} la media de los 7 días anteriores` : null,
  };
}

/** Título con la fecha completa y la hora más barata (≤ 70 caracteres). */
export function tituloDia(i: InfoDia, pagina: "hoy" | "mañana" | "ayer" | "archivo"): string {
  const pre = pagina === "archivo" ? "Precio de la luz" : `Precio de la luz ${pagina}`;
  return primeroQueQuepa(
    [
      `${pre} ${i.fechaM}: más barata a las ${hh(i.r.min.h)}`,
      `${pre} ${i.fechaM}: mín. a las ${hh(i.r.min.h)}`,
      `${pre} ${i.fechaM} por horas`,
      `${pre} ${i.fechaM}`,
    ],
    70,
  );
}

/** Meta descripción (≤ 160 caracteres). */
export function descripcionDia(i: InfoDia, pagina: "hoy" | "mañana" | "ayer" | "archivo"): string {
  const cuando = pagina === "archivo" ? `del ${i.fechaM}` : `${pagina}, ${i.fechaM},`;
  const base = `Precio de la luz ${cuando} por horas: media ${ekwh(i.r.media)}, lo más barato ${franja(i.r.min.h, 1)} (${ekwh(i.r.min.p)}) y lo más caro a las ${hh(i.r.max.h)}.`;
  return primeroQueQuepa([`${base} Mejores horas para la lavadora.`, base, base.replace(" por horas", "")], 160);
}

/** Frase corta para la entradilla: lo que la gente quiere saber nada más entrar. */
export function entradillaDia(i: InfoDia): string {
  const cuando = i.etiqueta ? `${i.etiqueta[0].toUpperCase()}${i.etiqueta.slice(1)}, ${fechaLarga(i.fecha)},` : `El ${fechaLarga(i.fecha)}`;
  const verbo = i.etiqueta === "ayer" || (!i.etiqueta && i.fecha < hoyMadrid()) ? "costó" : "cuesta";
  return `${cuando} la luz PVPC ${verbo} de media ${ekwh(i.r.media)}${i.vsAnterior ? `, ${i.vsAnterior}` : ""}. Lo más barato es ${franja(i.r.min.h, 1)} (${ekwh(i.r.min.p)}) y lo más caro ${franja(i.r.max.h, 1)} (${ekwh(i.r.max.p)}).`;
}

/** Preguntas frecuentes de ese día (visibles en la página y en el JSON-LD). */
export function preguntasDia(i: InfoDia): Pregunta[] {
  const f = i.fechaM;
  const q: Pregunta[] = [
    { p: `¿A qué hora es más barata la luz el ${f}?`, r: `La hora más barata del PVPC el ${f} es ${franja(i.r.min.h, 1)}, a ${ekwh(i.r.min.p)} sin impuestos.${i.b2 ? ` Si necesitas dos horas seguidas, lo mejor es ${franja(i.b2.inicio, 2)} (media ${ekwh(i.b2.media)}).` : ""}` },
    { p: `¿Cuál es la hora más cara de la luz el ${f}?`, r: `La más cara es ${franja(i.r.max.h, 1)}, a ${ekwh(i.r.max.p)}.${i.evitar ? ` Conviene evitar los aparatos que más gastan ${franja(i.evitar.inicio, 2)}.` : ""}` },
    { p: `¿Cuánto cuesta la luz de media el ${f}?`, r: `La media del día es ${ekwh(i.r.media)} (PVPC 2.0TD con peajes y cargos, sin impuestos)${i.vsSemana ? `: ${i.vsSemana}` : ""}.` },
  ];
  if (i.b2 && i.b3) q.push({ p: `¿Cuándo poner la lavadora el ${f}?`, r: `Con la tarifa PVPC, la lavadora o el lavavajillas salen más baratos ${franja(i.b2.inicio, 2)}. Para el coche eléctrico o el termo, ${franja(i.b3.inicio, 3)}. Si tienes precio fijo, la hora no cambia lo que pagas.` });
  return q;
}

export function esquemaDia(i: InfoDia, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `Precio de la luz PVPC por horas, ${fechaLarga(i.fecha)}`,
    description: `Precio horario del PVPC 2.0TD del ${fechaLarga(i.fecha)}: media ${ekwh(i.r.media)}, mínimo ${ekwh(i.r.min.p)} a las ${hh(i.r.min.h)}, máximo ${ekwh(i.r.max.p)} a las ${hh(i.r.max.h)}.`,
    url,
    temporalCoverage: i.fecha,
    dateModified: i.fecha,
    inLanguage: "es-ES",
    spatialCoverage: "España peninsular",
    creator: { "@type": "Organization", name: "Red Eléctrica", url: "https://www.ree.es/" },
    license: "https://www.ree.es/es/apidatos",
    isAccessibleForFree: true,
  };
}

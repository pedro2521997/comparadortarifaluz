// Análisis de un día para su página de precio: por qué cuesta lo que cuesta (mercado mayorista frente a
// peajes, festivo o laborable), qué puesto ocupa entre los últimos 30 días, cómo queda frente al mismo día
// de la semana anterior y cuánto cuesta ese día usar cada aparato en su mejor y su peor franja.
// Todo sale de los datos de ese día: el texto es distinto en cada fecha.

import { aparatos, dias, factorImpuestos, kwhUsoAparato, preciosDe } from "./datos";
import { mejorFranja, resumen } from "./grafico";
import { ekwh, fechaCorta, franja, hh, num, sumarDias } from "./formato";
import { esFinDeSemanaOFestivo } from "@lst/tarifa";
import festivosJson from "../../../../data/festivos.json";
import type { InfoDia } from "./dia";

const DIAS_SEMANA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const diaSemana = (fecha: string) => DIAS_SEMANA[new Date(`${fecha}T12:00:00Z`).getUTCDay()];

/** Aparatos que se pueden mover de hora, en el orden en que la gente los busca. */
const APARATOS = ["lavadora", "lavavajillas", "secadora", "horno", "termo-electrico", "cargador-coche-electrico"];

export interface CosteAparato {
  nombre: string;
  kwh: number;
  horas: number;
  mejor: { inicio: number; coste: number };
  peor: { inicio: number; coste: number };
}

export interface Analisis {
  porque: string[];
  aparatos: CosteAparato[];
}

const ordinal = (n: number) => (n === 1 ? "" : `${n}.º `);

export function analisisDia(i: InfoDia): Analisis | null {
  const dia = preciosDe(i.fecha);
  if (!dia) return null;
  const p = dia.precios;
  const porque: string[] = [];

  // 1. El mercado diario de ese día frente a su media de los 30 días anteriores. No se resta del PVPC:
  // desde 2024 parte de la energía del PVPC se compra a plazo, así que no es «mercado + peajes».
  const spot = dia.spot?.filter((s): s is number => s !== null) ?? [];
  const mediaSpotDe = (s: (number | null)[] | null | undefined) => {
    const v = (s ?? []).filter((x): x is number => x !== null);
    return v.length >= 20 ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };
  if (spot.length >= 20) {
    const mediaSpot = mediaSpotDe(dia.spot)!;
    const previos = dias
      .filter((d) => d.fecha < i.fecha && d.fecha >= sumarDias(i.fecha, -30))
      .map((d) => mediaSpotDe(d.spot))
      .filter((x): x is number => x !== null);
    const ref = previos.length >= 15 ? previos.reduce((a, b) => a + b, 0) / previos.length : null;
    const d = ref ? (mediaSpot - ref) / ref : 0;
    const comp =
      ref === null
        ? ""
        : Math.abs(d) < 0.05
          ? `, en línea con su media de los 30 días anteriores (${ekwh(ref)})`
          : `, un ${num(Math.abs(d) * 100)} % ${d > 0 ? "más caro" : "más barato"} que su media de los 30 días anteriores (${ekwh(ref)})`;
    porque.push(
      `El mercado mayorista (OMIE) cerró este día a ${ekwh(mediaSpot)} de media${comp}. Es lo que más mueve el PVPC de un día a otro. El PVPC suma además peajes y cargos, y compra una parte de la energía a plazo, así que sigue al mercado diario pero suaviza sus subidas y bajadas.`,
    );
    const spotMin = Math.min(...spot);
    const hSpotMin = dia.spot!.indexOf(spotMin);
    if (spotMin <= 0.005)
      porque.push(
        `${spotMin < 0 ? "El mercado mayorista llegó a precios negativos" : "El mercado mayorista bajó casi a cero"} a las ${hh(hSpotMin)}. Pasa cuando hay mucha producción solar o eólica y poca demanda: por eso esas horas salen tan baratas.`,
      );
  }

  // 2. Festivo o laborable: los peajes cambian.
  const libre = esFinDeSemanaOFestivo(i.fecha, new Set(festivosJson.fechas));
  const nombreDia = diaSemana(i.fecha);
  if (libre) {
    const festivo = nombreDia !== "sábado" && nombreDia !== "domingo";
    porque.push(
      `Al ser ${festivo ? "festivo nacional" : nombreDia}, todas las horas tienen el peaje más bajo (valle). Por eso la diferencia entre la hora más cara y la más barata (${ekwh(i.r.max.p - i.r.min.p)}) depende solo del precio de la energía, y suele ser menor que entre semana.`,
    );
  } else {
    porque.push(
      `Al ser ${nombreDia}, de 10:00 a 14:00 y de 18:00 a 22:00 se paga el peaje de punta, el más caro, y de 0:00 a 8:00 el de valle. Eso, sumado al mercado, hace que la hora más cara (${franja(i.r.max.h, 1)}) cueste ${ekwh(i.r.max.p - i.r.min.p)} más que la más barata.`,
    );
  }

  // 3. Puesto entre los últimos 30 días (incluido este).
  const ventana = dias.filter((d) => d.fecha <= i.fecha && d.fecha > sumarDias(i.fecha, -30));
  if (ventana.length >= 20) {
    const medias = ventana.map((d) => ({ f: d.fecha, m: resumen(d.precios).media })).sort((a, b) => a.m - b.m);
    const puesto = medias.findIndex((x) => x.f === i.fecha) + 1;
    const n = medias.length;
    const texto =
      puesto <= n / 2
        ? `Es el ${ordinal(puesto)}día más barato de los últimos ${n}`
        : `Es el ${ordinal(n - puesto + 1)}día más caro de los últimos ${n}`;
    const extremos = `el más barato fue el ${fechaCorta(medias[0].f)} (${ekwh(medias[0].m)}) y el más caro el ${fechaCorta(medias[n - 1].f)} (${ekwh(medias[n - 1].m)})`;
    porque.push(`${texto}: ${extremos}.`);
  }

  // 4. El mismo día de la semana anterior (mismos peajes si los dos son laborables o los dos libres).
  const semanaAntes = preciosDe(sumarDias(i.fecha, -7));
  if (semanaAntes) {
    const m = resumen(semanaAntes.precios).media;
    const d = (i.r.media - m) / m;
    const comp = Math.abs(d) < 0.03 ? "casi lo mismo que" : `un ${num(Math.abs(d) * 100)} % ${d > 0 ? "más" : "menos"} que`;
    porque.push(`Frente al ${nombreDia} anterior (${fechaCorta(sumarDias(i.fecha, -7))}, ${ekwh(m)} de media), la luz cuesta ${comp} entonces.`);
  }

  // Coste de cada aparato en su mejor y su peor franja, con impuestos.
  const fx = factorImpuestos(i.fecha);
  const costes: CosteAparato[] = [];
  for (const slug of APARATOS) {
    const a = aparatos.find((x) => x.slug === slug);
    if (!a) continue;
    const kwh = a.tipo === "potencia" ? ((a.potencia_w ?? 0) / 1000) * a.ventana_h : kwhUsoAparato(a);
    const horas = a.ventana_h;
    const mejor = mejorFranja(p, horas);
    const peor = mejorFranja(p, horas, true);
    if (!mejor || !peor || kwh <= 0) continue;
    costes.push({
      nombre: a.nombre,
      kwh,
      horas,
      mejor: { inicio: mejor.inicio, coste: kwh * mejor.media * fx },
      peor: { inicio: peor.inicio, coste: kwh * peor.media * fx },
    });
  }

  return { porque, aparatos: costes };
}


// Datos de energía de cada zona para la web global: mix de generación real (ENTSO-E A75), previsión de eólica,
// solar y demanda (A69 y A65), horas con precio negativo y medias mensuales (a partir de los precios A44).

import { diasDe, hoyDe, type Mercado } from "./datos";
import { sumarDias } from "./bloque";
import { leerJsons } from "./ficheros";
import { TEXTOS_E, FACTOR_CO2, RENOVABLES, type Grupo, type TextosEnergia } from "./textos-energia";

interface DiaMix { fecha: string; zona: string; completo: boolean; horas: Partial<Record<Grupo, (number | null)[]>> }
interface DiaPrevision { fecha: string; zona: string; eolica: (number | null)[] | null; solar: (number | null)[] | null; demanda: (number | null)[] | null }

const mixes = leerJsons<DiaMix>("global-mix");
const previsiones = leerJsons<DiaPrevision>("global-prevision");

export const textosE = (m: Mercado) => TEXTOS_E[m.pais.lang] as TextosEnergia;
export const tieneEnergia = (m: Mercado) => !!TEXTOS_E[m.pais.lang];

const suma = (xs: (number | null)[] | null | undefined) => (xs ?? []).reduce<number>((a, b) => a + (b ?? 0), 0);

// ---------------- Mix de generación ----------------

const porZonaMix = new Map<string, DiaMix[]>();
for (const d of mixes) porZonaMix.set(d.zona, [...(porZonaMix.get(d.zona) ?? []), d]);
for (const l of porZonaMix.values()) l.sort((a, b) => a.fecha.localeCompare(b.fecha));
export const mixDe = (zona: string) => porZonaMix.get(zona) ?? [];

/** Las estadísticas se calculan una vez por zona y build (se usan en cientos de páginas). */
function memo<T>(f: (m: Mercado) => T): (m: Mercado) => T {
  const cache = new Map<string, T>();
  return (m) => {
    if (!cache.has(m.zona.id)) cache.set(m.zona.id, f(m));
    return cache.get(m.zona.id)!;
  };
}
export const tieneMix = (m: Mercado) => mixDe(m.zona.id).length > 0;

export interface Totales { grupos: [Grupo, number][]; total: number; renovable: number; bajasEmisiones: number; co2: number; horas: number }

/** Energía de cada tecnología en el día (MWh), % renovable, % sin emisiones y g CO₂/kWh estimados. */
export function totales(d: DiaMix): Totales {
  const grupos = (Object.entries(d.horas) as [Grupo, (number | null)[]][]).map(([g, v]): [Grupo, number] => [g, suma(v)]).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const total = grupos.reduce((a, [, v]) => a + v, 0) || 1;
  const de = (lista: Grupo[]) => grupos.filter(([g]) => lista.includes(g)).reduce((a, [, v]) => a + v, 0);
  const co2 = grupos.reduce((a, [g, v]) => a + v * FACTOR_CO2[g], 0) / total;
  const horas = Math.max(...Object.values(d.horas).map((v) => (v ?? []).filter((x) => x !== null).length));
  return { grupos, total, renovable: de(RENOVABLES) / total, bajasEmisiones: de([...RENOVABLES, "nuclear"]) / total, co2, horas };
}

/** El día más reciente con datos (normalmente hoy hasta la última hora publicada). */
export const mixUltimo = (m: Mercado) => mixDe(m.zona.id).at(-1) ?? null;
export const mixCompletoUltimo = (m: Mercado) => mixDe(m.zona.id).filter((d) => d.completo).at(-1) ?? null;

/** % renovable de cada día completo de los últimos 30. */
export function renovable30(m: Mercado) {
  const desde = sumarDias(hoyDe(m), -30);
  return mixDe(m.zona.id).filter((d) => d.completo && d.fecha >= desde).map((d) => ({ fecha: d.fecha, valor: totales(d).renovable }));
}

/** Producción por hora de cada tecnología (para la gráfica apilada). */
export const horasMix = (d: DiaMix) => d.horas;

// ---------------- Previsión ----------------

export const previsionDe = (zona: string, fecha: string) => previsiones.find((p) => p.zona === zona && p.fecha === fecha) ?? null;

/** GWh de eólica y solar previstos y % sobre la demanda prevista. */
export function resumenPrevision(p: DiaPrevision) {
  const eolica = suma(p.eolica) / 1000;
  const solar = suma(p.solar) / 1000;
  const demanda = suma(p.demanda) / 1000;
  return { eolica, solar, demanda, pct: demanda > 0 ? (eolica + solar) / demanda : null };
}

// ---------------- Precios negativos ----------------

export interface Negativos { horas: number; dias: number; min: { fecha: string; h: number; p: number } | null; ultima: { fecha: string; h: number; p: number } | null; porMes: { mes: string; horas: number }[]; desde: string }

export const negativos = memo(function negativos(m: Mercado): Negativos {
  const desde = sumarDias(hoyDe(m), -365);
  const lista = diasDe(m.zona.id).filter((d) => d.fecha >= desde && d.fecha <= hoyDe(m));
  let horas = 0;
  let dias = 0;
  let min: Negativos["min"] = null;
  let ultima: Negativos["ultima"] = null;
  const porMes = new Map<string, number>();
  for (const d of lista) {
    let hayDia = false;
    d.precios.forEach((p, h) => {
      if (p === null) return;
      if (!min || p < min.p) min = { fecha: d.fecha, h, p };
      if (p < 0) {
        horas++;
        hayDia = true;
        ultima = { fecha: d.fecha, h, p };
        porMes.set(d.fecha.slice(0, 7), (porMes.get(d.fecha.slice(0, 7)) ?? 0) + 1);
      }
    });
    if (hayDia) dias++;
  }
  const meses = [...new Set(lista.map((d) => d.fecha.slice(0, 7)))].sort();
  return { horas, dias, min, ultima, porMes: meses.map((mes) => ({ mes, horas: porMes.get(mes) ?? 0 })), desde: lista[0]?.fecha ?? desde };
});

// ---------------- Medias mensuales ----------------

export interface Mes { mes: string; media: number; dias: number; completo: boolean; barato: { fecha: string; media: number }; caro: { fecha: string; media: number }; perfil: (number | null)[] }

const mediaDia = (p: (number | null)[]) => {
  const v = p.filter((x): x is number => x !== null);
  return v.reduce((a, b) => a + b, 0) / v.length;
};

/** Meses con datos (del más reciente al más antiguo); el mes en curso, con los días que van. */
export const meses = memo(function meses(m: Mercado): Mes[] {
  const hoy = hoyDe(m);
  const grupos = new Map<string, { fecha: string; precios: (number | null)[] }[]>();
  for (const d of diasDe(m.zona.id).filter((x) => x.fecha <= hoy)) grupos.set(d.fecha.slice(0, 7), [...(grupos.get(d.fecha.slice(0, 7)) ?? []), d]);
  const out: Mes[] = [];
  for (const [mes, lista] of grupos) {
    const [y, mm] = mes.split("-").map(Number);
    const enMes = new Date(Date.UTC(y, mm, 0)).getUTCDate();
    if (lista.length < Math.min(10, enMes)) continue; // meses con muy pocos días (el primero del histórico)
    const medias = lista.map((d) => ({ fecha: d.fecha, media: mediaDia(d.precios) }));
    const perfil = Array.from({ length: 24 }, (_, h) => {
      const v = lista.map((d) => d.precios[h]).filter((x): x is number => x !== null);
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
    });
    out.push({
      mes,
      media: medias.reduce((a, x) => a + x.media, 0) / medias.length,
      dias: lista.length,
      completo: lista.length >= enMes,
      barato: medias.reduce((a, x) => (x.media < a.media ? x : a)),
      caro: medias.reduce((a, x) => (x.media > a.media ? x : a)),
      perfil,
    });
  }
  return out.sort((a, b) => b.mes.localeCompare(a.mes));
});

export const nombreMes = (mes: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${mes}-15T12:00:00Z`));

// ---------------- URLs ----------------

export const urlMix = (m: Mercado) => `${m.ruta}${textosE(m).slugMix}/`;
export const urlNegativos = (m: Mercado) => `${m.ruta}${textosE(m).slugNegativos}/`;
export const urlMeses = (m: Mercado) => `${m.ruta}${textosE(m).slugMes}/`;
export const urlMes = (m: Mercado, mes: string) => `${urlMeses(m)}${mes}/`;

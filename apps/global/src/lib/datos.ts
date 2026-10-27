// Datos de la web global en el build: países, zonas («mercados»), precios de cada día y textos con el dato del día.
// Cada zona es un mercado con su ruta: la primera zona de cada país va en /<país>/ y las demás en /<país>/<zona>/.

import paisesJson from "../paises.json";
import fxJson from "../../../../data/global/fx.json";
import { TEXTOS, type Idioma, type Cuando } from "./textos";
import { fechaLocal, hoyEn, mejorFranja, porcentaje, resumen, sumarDias, valor, type Formato, type Precios } from "./bloque";
import { SITIO } from "../config";

export interface Zona { id: string; slug: string; nombre: string; eic: string; ec: string | null }
export interface Pais {
  cc: string; lang: Idioma; locale: string; nombre: string; nombreEn: string; tz: string;
  moneda: "EUR" | "NOK" | "SEK" | "DKK"; unidad: string; factor: number; decimales: number; zonas: Zona[];
}
export interface Mercado { pais: Pais; zona: Zona; ruta: string; principal: boolean }
export interface Dia { fecha: string; zona: string; fuente: string; precios: Precios }

export const PAISES = paisesJson.paises as Pais[];
const fx = fxJson as Record<string, number | string>;

const ficheros = import.meta.glob<Dia>("../../../../data/global/*/*.json", { eager: true, import: "default" });
const porZona = new Map<string, Dia[]>();
for (const d of Object.values(ficheros)) porZona.set(d.zona, [...(porZona.get(d.zona) ?? []), d]);
for (const l of porZona.values()) l.sort((a, b) => a.fecha.localeCompare(b.fecha));

export const diasDe = (zona: string) => porZona.get(zona) ?? [];
export const diaDe = (zona: string, fecha: string) => diasDe(zona).find((d) => d.fecha === fecha) ?? null;

/**
 * Solo hay páginas para las zonas con datos (sin token de ENTSO-E, solo las de licencia libre). La primera zona
 * con datos de cada país es la principal y va en /<país>/; las demás, en /<país>/<zona>/.
 */
export const MERCADOS: Mercado[] = PAISES.flatMap((pais) =>
  pais.zonas
    .filter((zona) => diasDe(zona.id).length > 0)
    .map((zona, i) => ({ pais, zona, principal: i === 0, ruta: i === 0 ? `/${pais.cc}/` : `/${pais.cc}/${zona.slug || zona.id.toLowerCase()}/` })),
);

export const PAISES_CON_DATOS = PAISES.filter((p) => MERCADOS.some((m) => m.pais.cc === p.cc && m.principal));

export function formato(p: Pais): Formato {
  const tipo = p.moneda === "EUR" ? 1 : Number(fx[p.moneda]);
  return { lang: p.lang, locale: p.locale, unidad: p.unidad, mult: p.factor * tipo, decimales: p.decimales };
}

export const urlManana = (m: Mercado) => `${m.ruta}${TEXTOS[m.pais.lang].slugManana}/`;
export const urlFecha = (m: Mercado, fecha: string) => `${m.ruta}${fecha}/`;
export const absoluta = (ruta: string) => new URL(ruta, SITIO.url).href;
export const hoyDe = (m: Mercado) => hoyEn(m.pais.tz);

/**
 * Se guarda un año de precios (para precios negativos y medias mensuales), pero solo los últimos DIAS_PAGINA
 * días tienen página propia: Cloudflare admite como mucho 20.000 ficheros por web.
 */
export const DIAS_PAGINA = 60;
export const conPagina = (m: Mercado, fecha: string) => fecha >= sumarDias(hoyDe(m), -DIAS_PAGINA);
export const diasConPagina = (m: Mercado) => diasDe(m.zona.id).filter((d) => conPagina(m, d.fecha));

/** Nombre de la zona para títulos: solo si el país tiene varias («NO2», «Sicilia»). */
export const etiquetaZona = (m: Mercado) => (m.principal ? "" : m.zona.id.startsWith("IT-") ? m.zona.nombre : m.zona.id);
/** «: » (y « : » en francés) */
const dp = (m: Mercado) => (m.pais.lang === "fr" ? " : " : ": ");

const primeroQueQuepa = (op: string[], max: number) => op.find((o) => o.length <= max) ?? op.at(-1)!.slice(0, max);

export type Pagina = "hoy" | "manana" | "fecha";

export interface Info {
  m: Mercado; fecha: string; fechaL: string; f: Formato; precios: Precios; cuando: Cuando;
  r: ReturnType<typeof resumen>; b2: ReturnType<typeof mejorFranja>; vsAyer: string | null;
  tramos: { nombre: string; media: number | null; desde: number; hasta: number }[];
}

export function info(m: Mercado, fecha: string): Info | null {
  const d = diaDe(m.zona.id, fecha);
  if (!d) return null;
  const L = TEXTOS[m.pais.lang];
  const f = formato(m.pais);
  const r = resumen(d.precios);
  const hoy = hoyDe(m);
  const cuando: Cuando = fecha === hoy ? "hoy" : fecha === sumarDias(hoy, 1) ? "manana" : "fecha";
  const ref = cuando === "manana" ? "hoy" : "ayer";
  const ayer = diaDe(m.zona.id, sumarDias(fecha, -1));
  let vsAyer: string | null = null;
  if (ayer) {
    const ra = resumen(ayer.precios).media;
    // Con medias cercanas a cero (o negativas) el porcentaje no dice nada: no se compara.
    if (Math.abs(ra) > 5 && Math.sign(ra) === Math.sign(r.media)) {
      const dif = (r.media - ra) / Math.abs(ra);
      vsAyer = Math.abs(dif) < 0.03 ? L.igualAyer(ref) : Math.abs(dif) > 3 ? null : L.vsAyer(porcentaje(m.pais.locale, Math.abs(dif)), dif > 0, ref);
    }
  }
  const tramos = [0, 8, 14, 20].map((desde, k) => {
    const hasta = [8, 14, 20, 24][k];
    const v = d.precios.slice(desde, hasta).filter((x): x is number => x !== null);
    return { nombre: L.tramos[k], desde, hasta, media: v.length ? v.reduce((a, b) => a + b, 0) / v.length : null };
  });
  return { m, fecha, fechaL: fechaLocal(fecha, m.pais.locale), f, precios: d.precios, cuando, r, b2: mejorFranja(d.precios, 2), vsAyer, tramos };
}

function cabecera(i: Info, pag: Pagina) {
  const L = TEXTOS[i.m.pais.lang];
  const z = etiquetaZona(i.m);
  const cuando = pag === "hoy" ? L.hoy : pag === "manana" ? L.manana : "";
  return [L.precio, z, cuando].filter(Boolean).join(" ");
}

export function titulo(i: Info, pag: Pagina): string {
  const L = TEXTOS[i.m.pais.lang];
  const base = `${cabecera(i, pag)} ${i.fechaL}`;
  return primeroQueQuepa([`${base}${dp(i.m)}${L.baratoA(i.r.min.h)}`, base, `${cabecera(i, pag)}`], 70);
}

/** Entradilla en frases completas, en el idioma del país. */
export function entradilla(i: Info): string {
  const L = TEXTOS[i.m.pais.lang];
  const v = (x: number) => valor(i.f, x);
  return L.frase({
    cuando: i.cuando, fecha: i.fechaL, media: v(i.r.media), vs: i.vsAyer,
    rangoMin: L.rango(i.r.min.h, i.r.min.h + 1), pMin: v(i.r.min.p), rangoMax: L.rango(i.r.max.h, i.r.max.h + 1), pMax: v(i.r.max.p),
  });
}

/** Meta descripción: la entradilla, cortada por frases si pasa de 160 caracteres. */
export function descripcion(i: Info, _pag: Pagina): string {
  return recortarFrases(entradilla(i), 158);
}

/**
 * Corta un texto por el final de una frase para que quepa en `max` caracteres. Un punto detrás de una cifra
 * no cuenta como final («Am 20. Oktober», «den 27. oktober»).
 */
export function recortarFrases(t: string, max: number): string {
  if (t.length <= max) return t;
  let corte = -1;
  for (const m of t.matchAll(/\. /g)) {
    if (/\d/.test(t[m.index! - 1])) continue;
    if (m.index! + 1 > max) break;
    corte = m.index! + 1;
  }
  return corte >= 40 ? t.slice(0, corte) : t.slice(0, t.lastIndexOf(" ", max - 2)) + "…";
}

export function preguntas(i: Info) {
  const L = TEXTOS[i.m.pais.lang];
  const v = (x: number) => valor(i.f, x);
  const c = L.elDia(i.fechaL) + (etiquetaZona(i.m) ? ` (${etiquetaZona(i.m)})` : "");
  const r = (h: number, n = 1) => L.rango(h, h + n);
  return [
    { p: L.pBarata(c), r: L.rBarata(c, r(i.r.min.h), v(i.r.min.p), i.b2 ? `${r(i.b2.inicio, 2)} (${v(i.b2.media)})` : null) },
    { p: L.pMedia(c), r: L.rMedia(c, v(i.r.media)) },
    { p: L.pCara(c), r: L.rCara(r(i.r.max.h), v(i.r.max.p)) },
  ];
}

export const esquemaFaq = (q: { p: string; r: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: q.map((x) => ({ "@type": "Question", name: x.p, acceptedAnswer: { "@type": "Answer", text: x.r } })),
});

export function esquemaDataset(i: Info, ruta: string, fuente: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${TEXTOS[i.m.pais.lang].precio} ${i.m.zona.nombre} ${i.fechaL}`,
    description: entradilla(i),
    url: absoluta(ruta),
    temporalCoverage: i.fecha,
    inLanguage: i.m.pais.locale,
    spatialCoverage: `${i.m.pais.nombreEn} (${i.m.zona.id})`,
    creator: { "@type": "Organization", name: fuente.startsWith("ENTSO-E") ? "ENTSO-E" : "Bundesnetzagentur | SMARD.de" },
    isAccessibleForFree: true,
  };
}

/** hreflang entre las páginas equivalentes de cada país (hoy o mañana), España incluida (web española). */
export function alternativas(pag: "hoy" | "manana"): { lang: string; href: string }[] {
  const lista = MERCADOS.filter((m) => m.principal).map((m) => ({ lang: m.pais.locale, href: absoluta(pag === "hoy" ? m.ruta : urlManana(m)) }));
  return [...lista, { lang: "es-ES", href: pag === "hoy" ? SITIO.espana : SITIO.espanaManana }, { lang: "x-default", href: absoluta("/") }];
}

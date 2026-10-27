// Bloque de precios de un día para cualquier país: resumen, mejores horas y gráfico de 24 horas.
// Sin dependencias del build: se usa igual al generar la página y en el navegador al cambiar de día.
// Usa las mismas clases CSS que la web española (apps/web/src/styles/componentes.css).

import { TEXTOS, type Idioma, type Textos } from "./textos";

export type Precios = (number | null)[];

export interface Formato {
  lang: Idioma;
  locale: string;
  unidad: string;
  /** €/MWh → unidad mostrada: factor (0,1 para c/kWh u øre/kWh; 0,001 para €/kWh) × tipo de cambio */
  mult: number;
  decimales: number;
}

export const hh = (h: number) => `${String(h % 24).padStart(2, "0")}:00`;
export const franja = (ini: number, horas: number) => `${hh(ini)}–${hh(ini + horas)}`;

export function valor(f: Formato, eurMwh: number): string {
  const x = eurMwh * f.mult;
  // Un precio negativo muy pequeño no debe salir como «-0,0000»: se dan los decimales que hagan falta.
  let dec = x === 0 ? 0 : f.decimales;
  while (x !== 0 && Math.abs(x) < 0.5 * 10 ** -dec && dec < 6) dec++;
  const n = new Intl.NumberFormat(f.locale, { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(x).replace(/^-/, "−");
  return `${n}\u00a0${f.unidad}`;
}
/** Porcentaje con la costumbre de cada idioma («79%» en italiano, «79 %» en alemán). */
export const porcentaje = (locale: string, x: number) => new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(x);

export function resumen(p: Precios) {
  const v = p.map((x, h) => ({ p: x, h })).filter((x): x is { p: number; h: number } => x.p !== null);
  const media = v.reduce((a, x) => a + x.p, 0) / v.length;
  const min = v.reduce((a, x) => (x.p < a.p ? x : a));
  const max = v.reduce((a, x) => (x.p > a.p ? x : a));
  return { media, min, max };
}

export function mejorFranja(p: Precios, horas: number, cara = false) {
  let mejor: { inicio: number; media: number } | null = null;
  for (let i = 0; i + horas <= p.length; i++) {
    const w = p.slice(i, i + horas);
    if (w.some((x) => x === null)) continue;
    const m = (w as number[]).reduce((a, b) => a + b, 0) / horas;
    if (!mejor || (cara ? m > mejor.media : m < mejor.media)) mejor = { inicio: i, media: m };
  }
  return mejor;
}

function niveles(p: Precios) {
  const v = p.filter((x): x is number => x !== null).sort((a, b) => a - b);
  const t1 = v[Math.floor(v.length / 3)];
  const t2 = v[Math.floor((2 * v.length) / 3)];
  return p.map((x) => (x === null ? null : x < t1 ? "barata" : x >= t2 ? "cara" : "normal"));
}

/** Horas seguidas de cada uso (en el orden de Textos.usos): lavadora, lavavajillas, horno, coche. */
const HORAS_USO = [2, 2, 1, 3];

export function bloque(f: Formato, fecha: string, p: Precios, ahora: number | null = null): string {
  const L: Textos = TEXTOS[f.lang];
  const hh = L.reloj;
  const franja = (ini: number, horas: number) => `${hh(ini)}–${hh(ini + horas)}`;
  const r = resumen(p);
  const pAhora = ahora !== null ? p[ahora] : null;
  const stat = (lab: string, val: string, sub: string) => `<div class="stat"><span class="stat__label">${lab}</span><span class="stat__value">${val}</span><span class="stat__sub num">${sub}</span></div>`;
  const stats = [
    pAhora != null ? stat(`${L.ahora} (${hh(ahora!)})`, valor(f, pAhora), "") : "",
    stat(L.horaBarata, hh(r.min.h), valor(f, r.min.p)),
    stat(L.horaCara, hh(r.max.h), valor(f, r.max.p)),
    stat(L.media, valor(f, r.media), ""),
  ].join("");
  const usos = HORAS_USO.map((horas, i) => {
    const fr = mejorFranja(p, horas);
    return fr ? `<li class="uso"><span class="uso__que">${L.usos[i]}</span><span class="uso__cuando">${franja(fr.inicio, horas)}</span><span class="uso__precio num">${valor(f, fr.media)}</span></li>` : "";
  }).join("");
  const ev = mejorFranja(p, 2, true);
  const evitar = ev ? `<li class="uso uso--evitar"><span class="uso__que">${L.evitar}</span><span class="uso__cuando">${franja(ev.inicio, 2)}</span><span class="uso__precio num">${valor(f, ev.media)}</span></li>` : "";
  const niv = niveles(p);
  const maxAbs = Math.max(...p.filter((x): x is number => x !== null).map(Math.abs), 1);
  const filas = p
    .map((x, h) => {
      if (x === null) return `<li class="hrow hrow--nula"><span class="hrow__h">${hh(h)}</span><span class="hrow__bar"></span><span class="hrow__p">—</span><span class="hrow__tag"></span></li>`;
      const n = niv[h]!;
      const ancho = Math.max(4, (Math.abs(x) / maxAbs) * 100).toFixed(1);
      return `<li class="hrow hrow--${n}${ahora === h ? " hrow--ahora" : ""}" data-h="${h}"${ahora === h ? ' aria-current="time"' : ""}><span class="hrow__h">${hh(h)}</span><span class="hrow__bar" aria-hidden="true"><span style="width:${ancho}%"></span></span><span class="hrow__p num">${valor(f, x)}</span><span class="hrow__tag"><span class="pill pill--${n}">${L.niveles[n as "barata"]}</span>${ahora === h ? `<span class="pill pill--canopy">${L.ahora}</span>` : ""}</span></li>`;
    })
    .join("");
  return `<div class="grid grid--4 stats">${stats}</div>
<h2 class="h-sec">${L.mejoresHoras}</h2>
<ul class="usos">${usos}${evitar}</ul>
<h2 class="h-sec">${L.porHora}</h2>
<p class="leyenda caption">${L.leyenda(L.niveles.barata, L.niveles.cara)}</p>
<ol class="horas" data-fecha="${fecha}">${filas}</ol>`;
}

export function noPublicado(lang: Idioma): string {
  return `<div class="notice notice--warn" role="status"><p>${TEXTOS[lang].noPublicado}</p></div>`;
}

/** Fecha y hora actuales en la zona horaria del país. */
export const hoyEn = (tz: string, d = new Date()) => new Intl.DateTimeFormat("sv-SE", { timeZone: tz }).format(d);
export const horaEn = (tz: string, d = new Date()) => Number(new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hourCycle: "h23" }).format(d));
export const sumarDias = (iso: string, n: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};
/** «27. oktober 2026», «27 de outubro de 2026»… */
export const fechaLocal = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));

// Gráfico de 24 horas y bloque "las mejores horas para…".
// Devuelve HTML como texto para poder usarse igual en el build (Astro) y en el navegador
// cuando hay que refrescar los datos. Accesible: cada hora lleva su precio y su etiqueta en texto;
// el color nunca es la única señal.

import { ekwh, hh, franja } from "./formato";

export type Nivel = "barata" | "normal" | "cara";

export interface Franja {
  inicio: number;
  horas: number;
  media: number;
}

/** Franja de `horas` seguidas con la media más baja (o más alta). Ignora ventanas con horas inexistentes. */
export function mejorFranja(precios: (number | null)[], horas: number, cara = false): Franja | null {
  let mejor: Franja | null = null;
  for (let i = 0; i + horas <= precios.length; i++) {
    const ventana = precios.slice(i, i + horas);
    if (ventana.some((p) => p === null)) continue;
    const media = (ventana as number[]).reduce((a, b) => a + b, 0) / horas;
    if (!mejor || (cara ? media > mejor.media : media < mejor.media)) mejor = { inicio: i, horas, media };
  }
  return mejor;
}

/** Barata / normal / cara por terciles del propio día. */
export function niveles(precios: (number | null)[]): (Nivel | null)[] {
  const validos = precios.filter((p): p is number => p !== null).sort((a, b) => a - b);
  const t1 = validos[Math.floor(validos.length / 3)];
  const t2 = validos[Math.floor((validos.length * 2) / 3)];
  return precios.map((p) => (p === null ? null : p < t1 ? "barata" : p >= t2 ? "cara" : "normal"));
}

/** Media ponderada por el consumo de un hogar tipo (más peso a las horas en que más se consume). */
export function mediaHogar(precios: (number | null)[], pesos: number[]): number {
  let s = 0, w = 0;
  precios.forEach((p, h) => {
    if (p === null) return;
    s += p * pesos[h];
    w += pesos[h];
  });
  return w ? s / w : 0;
}

export function resumen(precios: (number | null)[]) {
  const validos = precios.map((p, h) => ({ p, h })).filter((x): x is { p: number; h: number } => x.p !== null);
  const media = validos.reduce((a, x) => a + x.p, 0) / validos.length;
  const min = validos.reduce((a, x) => (x.p < a.p ? x : a));
  const max = validos.reduce((a, x) => (x.p > a.p ? x : a));
  return { media, min, max };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

/** Lista de 24 barras horizontales con precio en texto. `ahora` resalta la hora en curso. */
export function graficoHoras(precios: (number | null)[], ahora: number | null = null): string {
  const niv = niveles(precios);
  const validos = precios.filter((p): p is number => p !== null);
  const max = Math.max(...validos);
  const filas = precios
    .map((p, h) => {
      if (p === null) {
        return `<li class="hrow hrow--nula"><span class="hrow__h">${hh(h)}</span><span class="hrow__bar"></span><span class="hrow__p">—</span><span class="hrow__tag">No existe (cambio de hora)</span></li>`;
      }
      const n = niv[h]!;
      const ancho = Math.max(4, (p / max) * 100).toFixed(1);
      const actual = ahora === h ? " hrow--ahora" : "";
      const etiquetaAhora = ahora === h ? `<span class="pill pill--canopy">Ahora</span>` : "";
      return `<li class="hrow hrow--${n}${actual}" data-h="${h}"${ahora === h ? ' aria-current="time"' : ""}>
<span class="hrow__h">${hh(h)}<span class="sr-only"> a ${hh(h + 1)}</span></span>
<span class="hrow__bar" aria-hidden="true"><span style="width:${ancho}%"></span></span>
<span class="hrow__p num">${esc(ekwh(p))}</span>
<span class="hrow__tag"><span class="pill pill--${n}">${n}</span>${etiquetaAhora}</span>
</li>`;
    })
    .join("");
  return `<ol class="horas" aria-label="Precio de cada hora, de 00:00 a 24:00">${filas}</ol>`;
}

const USOS = [
  { nombre: "Poner la lavadora", horas: 2, icono: "lavadora" },
  { nombre: "Poner el lavavajillas", horas: 2, icono: "lavavajillas" },
  { nombre: "Usar el horno", horas: 1, icono: "horno" },
  { nombre: "Cargar el coche", horas: 3, icono: "coche" },
];

/** Bloque "Las mejores horas para…" con franjas de 1, 2 y 3 horas seguidas y la franja que conviene evitar. */
export function mejoresHoras(precios: (number | null)[]): string {
  const items = USOS.map((u) => {
    const f = mejorFranja(precios, u.horas);
    if (!f) return "";
    return `<li class="uso"><span class="uso__que">${u.nombre}</span><span class="uso__cuando">${franja(f.inicio, f.horas)}</span><span class="uso__precio num">media ${ekwh(f.media)}</span></li>`;
  }).join("");
  const evitar = mejorFranja(precios, 2, true);
  const evitarHtml = evitar
    ? `<li class="uso uso--evitar"><span class="uso__que">Evita</span><span class="uso__cuando">${franja(evitar.inicio, evitar.horas)}</span><span class="uso__precio num">media ${ekwh(evitar.media)}</span></li>`
    : "";
  return `<ul class="usos">${items}${evitarHtml}</ul>`;
}

/** Frase tipo Telegram: "La hora más barata es de 14:00 a 15:00 (0,080 €/kWh). Evita de 20:00 a 22:00." */
export function frase(precios: (number | null)[]): string {
  const r = resumen(precios);
  const evitar = mejorFranja(precios, 2, true);
  return `La hora más barata es ${franja(r.min.h, 1)} (${ekwh(r.min.p)}).${evitar ? ` Evita ${franja(evitar.inicio, 2)}.` : ""}`;
}

// ---------- Gráfico de barras interactivo ----------
// SVG de 24 barras verticales que se pinta en el build (Google lo ve) y en el navegador. Al pasar el
// ratón, tocar una barra o moverse con las flechas, la línea de lectura dice el precio de esa hora y, si
// se indica un aparato, lo que cuesta usarlo a esa hora. La lista de horas (graficoHoras) sigue siendo
// la versión accesible con todos los datos: aquí el SVG va oculto a los lectores de pantalla.

export interface OpcionesGrafico {
  ahora?: number | null;
  /** Franja que se sombrea (la mejor para un aparato, por ejemplo). */
  resaltar?: Franja | null;
  /** Si se da, la lectura incluye «Usar <texto> a esta hora: X €» (kWh de un uso × precio × impuestos). */
  uso?: { texto: string; kwh: number; factor: number } | null;
}

// El SVG se estira a lo ancho y alto de su caja (preserveAspectRatio="none"); los textos de los ejes van
// fuera, en HTML, para que no se deformen ni se corten en el móvil.
const W = 720, H = 200, MT = 8;

/** Paso «bonito» del eje Y y techo redondeado a ese paso (entre 3 y 6 líneas). */
function ejeY(max: number): { paso: number; techo: number } {
  const paso = max <= 0.15 ? 0.025 : max <= 0.3 ? 0.05 : max <= 0.6 ? 0.1 : 0.2;
  return { paso, techo: Math.max(paso, Math.ceil((max * 1.04) / paso) * paso) };
}

const precioCorto = (p: number) => p.toFixed(3).replace(".", ",");

export function textoLectura(h: number, p: number, n: Nivel, uso: OpcionesGrafico["uso"] = null): string {
  const base = `${franja(h, 1)}: ${ekwh(p)} (${n})`;
  return uso ? `${base}. Usar ${uso.texto} a esta hora: ${(p * uso.kwh * uso.factor).toFixed(2).replace(".", ",")} € con impuestos.` : `${base}.`;
}

export function graficoBarras(precios: (number | null)[], o: OpcionesGrafico = {}): string {
  const niv = niveles(precios);
  const validos = precios.filter((p): p is number => p !== null);
  if (!validos.length) return "";
  const r = resumen(precios);
  const { paso, techo: yMax } = ejeY(Math.max(...validos));
  const ph = H - MT;
  const slot = W / precios.length;
  const y = (p: number) => MT + ph - (p / yMax) * ph;
  const pct = (v: number, total: number) => `${((v / total) * 100).toFixed(2)}%`;
  const lineas: string[] = [];
  const etiquetasY: string[] = [];
  for (let k = 0; k * paso <= yMax + 1e-9; k++) {
    const v = k * paso;
    lineas.push(`<line class="gb__rej" x1="0" x2="${W}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" vector-effect="non-scaling-stroke"/>`);
    etiquetasY.push(`<span style="top:${pct(y(v), H)}">${precioCorto(v).replace(/(,\d\d)0$/, "$1")}</span>`);
  }
  const ejeX = Array.from({ length: precios.length / 3 + 1 }, (_, k) => k * 3)
    .map((h) => {
      const c = [h === precios.length ? "gb__fin" : h === 0 ? "gb__ini" : "", h % 6 === 3 ? "gb__medio" : ""].filter(Boolean).join(" ");
      return `<span${c ? ` class="${c}"` : ""} style="left:${pct(h, precios.length)}">${String(h).padStart(2, "0")}h</span>`;
    })
    .join("");
  const zona = o.resaltar
    ? `<rect class="gb__zona" x="${(o.resaltar.inicio * slot).toFixed(1)}" y="${MT}" width="${(o.resaltar.horas * slot).toFixed(1)}" height="${ph}"/>`
    : "";
  const barras = precios
    .map((p, h) => {
      const x = h * slot;
      const hit = `<rect class="gb__hit" data-h="${h}" x="${x.toFixed(1)}" y="0" width="${slot.toFixed(1)}" height="${H}"/>`;
      if (p === null) return hit;
      const ahora = o.ahora === h ? " gb__b--ahora" : "";
      return `<rect class="gb__b gb__b--${niv[h]}${ahora}" data-h="${h}" data-p="${p}" x="${(x + slot * 0.14).toFixed(1)}" y="${y(p).toFixed(1)}" width="${(slot * 0.72).toFixed(1)}" height="${(MT + ph - y(p)).toFixed(1)}" vector-effect="non-scaling-stroke"/>${hit}`;
    })
    .join("");
  const inicial = o.ahora != null && precios[o.ahora] != null ? o.ahora : r.min.h;
  const lectura = textoLectura(inicial, precios[inicial]!, niv[inicial]!, o.uso);
  const uso = o.uso ? ` data-uso="${esc(o.uso.texto)}" data-kwh="${o.uso.kwh}" data-factor="${o.uso.factor}"` : "";
  return `<figure class="gb" tabindex="0" data-sel="${inicial}"${uso} aria-label="Gráfico del precio de cada hora. Usa las flechas izquierda y derecha para recorrer las horas.">
<p class="gb__lectura" aria-live="polite"><span class="gb__tit">${o.ahora === inicial ? "Ahora" : "Hora más barata"}</span> <span class="gb__txt">${esc(lectura)}</span></p>
<div class="gb__area"><div class="gb__ejey" aria-hidden="true">${etiquetasY.join("")}</div><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${lineas.join("")}${zona}${barras}<line class="gb__guia" x1="0" x2="0" y1="0" y2="${H}" vector-effect="non-scaling-stroke"/></svg></div>
<div class="gb__ejex" aria-hidden="true">${ejeX}</div>
<figcaption class="gb__pie"><span><i class="gb__c gb__c--barata"></i>barata</span><span><i class="gb__c gb__c--normal"></i>normal</span><span><i class="gb__c gb__c--cara"></i>cara</span>${o.resaltar ? `<span><i class="gb__c gb__c--zona"></i>mejor franja</span>` : ""}<span class="gb__ayuda">Toca o pasa el ratón por una barra</span></figcaption>
</figure>`;
}

/** «La mejor franja de 2 h es de 02:00 a 04:00 (0,08 €/kWh) y la peor…» para la página de un aparato. */
export function textoFranjas(precios: (number | null)[], horas: number): string {
  const b = mejorFranja(precios, horas);
  const c = mejorFranja(precios, horas, true);
  if (!b || !c) return "";
  const ahorro = Math.round((1 - b.media / c.media) * 100);
  return `La mejor franja de ${horas} ${horas === 1 ? "hora" : "horas seguidas"} es ${franja(b.inicio, horas)} (${ekwh(b.media)} de media) y la peor, ${franja(c.inicio, horas)} (${ekwh(c.media)}). Elegir la buena en lugar de la mala abarata ese uso un ${ahorro} %.`;
}

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
      return `<li class="hrow hrow--${n}${actual}"${ahora === h ? ' aria-current="time"' : ""}>
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

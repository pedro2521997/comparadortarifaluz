// Gráficas SVG sencillas y accesibles (devuelven HTML como texto: sirven en el build y en el navegador).
// Cada gráfica lleva una descripción y una tabla con los datos: el color nunca es la única señal.

import { num } from "./formato";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

function tablaDatos(cab: string[], filas: (string | number)[][]): string {
  return `<details class="gr-datos"><summary>Ver los datos</summary><div class="table-wrap" tabindex="0" role="region" aria-label="Datos de la gráfica"><table><thead><tr>${cab.map((c) => `<th scope="col">${esc(c)}</th>`).join("")}</tr></thead><tbody>${filas
    .map((f) => `<tr>${f.map((v, i) => (i === 0 ? `<th scope="row">${esc(String(v))}</th>` : `<td class="r num">${esc(String(v))}</td>`)).join("")}</tr>`)
    .join("")}</tbody></table></div></details>`;
}

export interface OpcionesBarras {
  titulo: string;
  etiquetas: string[];
  valores: number[];
  unidad: string;
  decimales?: number;
  /** Índices a resaltar (p. ej. el máximo) */
  resaltar?: number[];
  /** Mostrar la etiqueta solo cada N barras */
  cadaEtiqueta?: number;
  alto?: number;
}

/** Gráfica de barras verticales. */
export function barras(o: OpcionesBarras): string {
  const W = 640, H = o.alto ?? 220, mI = 40, mB = 28, mT = 12;
  const max = Math.max(...o.valores, 0.0001);
  const n = o.valores.length;
  const ancho = (W - mI - 8) / n;
  const d = o.decimales ?? 1;
  const cada = o.cadaEtiqueta ?? 1;
  const ticks = [0, max / 2, max];
  const barrasSvg = o.valores
    .map((v, i) => {
      const h = ((H - mB - mT) * v) / max;
      const x = mI + i * ancho;
      const res = o.resaltar?.includes(i);
      return `<rect x="${(x + ancho * 0.12).toFixed(1)}" y="${(H - mB - h).toFixed(1)}" width="${(ancho * 0.76).toFixed(1)}" height="${h.toFixed(1)}" rx="2" class="${res ? "gr-b gr-b--res" : "gr-b"}"><title>${esc(o.etiquetas[i])}: ${num(v, d)} ${esc(o.unidad)}</title></rect>${
        i % cada === 0 ? `<text x="${(x + ancho / 2).toFixed(1)}" y="${H - 10}" class="gr-eje" text-anchor="middle">${esc(o.etiquetas[i])}</text>` : ""
      }`;
    })
    .join("");
  const ejes = ticks
    .map((t) => {
      const y = H - mB - ((H - mB - mT) * t) / max;
      return `<line x1="${mI}" x2="${W}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" class="gr-rej"/><text x="${mI - 6}" y="${(y + 4).toFixed(1)}" class="gr-eje" text-anchor="end">${num(t, t < 10 ? d : 0)}</text>`;
    })
    .join("");
  const imax = o.valores.indexOf(Math.max(...o.valores));
  const resumen = `${o.titulo}. Máximo: ${o.etiquetas[imax]}, ${num(o.valores[imax], d)} ${o.unidad}.`;
  return `<figure class="gr"><figcaption class="gr-t">${esc(o.titulo)} <span class="caption">(${esc(o.unidad)})</span></figcaption>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(resumen)}" preserveAspectRatio="none">${ejes}${barrasSvg}</svg>
    ${tablaDatos(["", o.unidad], o.etiquetas.map((e, i) => [e, num(o.valores[i], d)]))}</figure>`;
}

export interface Serie {
  nombre: string;
  valores: number[];
  /** clase de color: a (canopy), b (violeta), c (menta) */
  color: "a" | "b" | "c";
}

/** Gráfica de líneas con varias series y leyenda en texto. */
export function lineas(titulo: string, etiquetas: string[], series: Serie[], unidad: string, decimales = 2): string {
  const W = 640, H = 220, mI = 40, mB = 28, mT = 12;
  const max = Math.max(...series.flatMap((s) => s.valores), 0.0001);
  const n = etiquetas.length;
  const x = (i: number) => mI + ((W - mI - 12) * i) / Math.max(1, n - 1);
  const y = (v: number) => H - mB - ((H - mB - mT) * v) / max;
  const ejes = [0, max / 2, max].map((t) => `<line x1="${mI}" x2="${W}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}" class="gr-rej"/><text x="${mI - 6}" y="${(y(t) + 4).toFixed(1)}" class="gr-eje" text-anchor="end">${num(t, decimales)}</text>`).join("");
  const etq = etiquetas.map((e, i) => (i % 3 === 0 ? `<text x="${x(i).toFixed(1)}" y="${H - 10}" class="gr-eje" text-anchor="middle">${esc(e)}</text>` : "")).join("");
  const lin = series.map((s, k) => `<polyline points="${s.valores.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}" class="gr-l gr-l--${s.color}" ${k ? 'stroke-dasharray="6 4"' : ""}/>`).join("");
  const leyenda = series.map((s, k) => `<span class="gr-ley"><span class="gr-ley__m gr-ley__m--${s.color}${k ? " gr-ley__m--disc" : ""}" aria-hidden="true"></span>${esc(s.nombre)}</span>`).join("");
  return `<figure class="gr"><figcaption class="gr-t">${esc(titulo)} <span class="caption">(${esc(unidad)})</span></figcaption>
    <p class="gr-leyenda">${leyenda}</p>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(titulo)}" preserveAspectRatio="none">${ejes}${etq}${lin}</svg>
    ${tablaDatos(["", ...series.map((s) => s.nombre)], etiquetas.map((e, i) => [e, ...series.map((s) => num(s.valores[i], decimales))]))}</figure>`;
}

/** Mapa de calor (filas × columnas). Las celdas sin dato se dejan vacías. */
export function calor(titulo: string, filas: string[], columnas: string[], m: (number | null)[][], unidad: string): string {
  const valores = m.flat().filter((v): v is number => v !== null);
  const min = Math.min(...valores), max = Math.max(...valores);
  const celda = (v: number | null) => {
    if (v === null) return `<td class="gr-c gr-c--vacia"><span class="sr-only">sin datos</span></td>`;
    const t = max > min ? (v - min) / (max - min) : 0;
    // De crema a violeta (más consumo = más oscuro). El número va en el title y en la tabla accesible.
    const l = Math.round(96 - t * 56);
    return `<td class="gr-c" style="background:hsl(272 ${Math.round(20 + t * 55)}% ${l}%)" title="${num(v, 2)} ${esc(unidad)}"><span class="sr-only">${num(v, 2)}</span></td>`;
  };
  return `<figure class="gr"><figcaption class="gr-t">${esc(titulo)} <span class="caption">(${esc(unidad)}; más oscuro, más consumo)</span></figcaption>
    <div class="gr-calor-wrap" tabindex="0" role="region" aria-label="Mapa de calor"><table class="gr-calor"><thead><tr><th scope="col"><span class="sr-only">Mes</span></th>${columnas.map((c, i) => `<th scope="col">${i % 3 === 0 ? esc(c) : `<span class="sr-only">${esc(c)}</span>`}</th>`).join("")}</tr></thead>
    <tbody>${filas.map((f, i) => (m[i].some((v) => v !== null) ? `<tr><th scope="row">${esc(f)}</th>${m[i].map(celda).join("")}</tr>` : "")).join("")}</tbody></table></div></figure>`;
}

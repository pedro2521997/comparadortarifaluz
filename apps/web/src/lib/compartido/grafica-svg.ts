// Gráfica de líneas en SVG generada en el build (sin JavaScript). La usan la web española y la global
// (apps/global importa este fichero). Accesible: role="img" con un resumen en texto.

export interface Serie {
  nombre: string;
  valores: (number | null)[];
  /** Variable CSS o color; la primera serie va en el color principal. */
  color?: string;
}

interface Opciones {
  etiquetas: string[]; // una por punto (fechas ya formateadas)
  formato: (n: number) => string;
  resumen: string; // texto alternativo
  alto?: number;
}

export function graficaLineas(series: Serie[], o: Opciones): string {
  const W = 720;
  const H = o.alto ?? 240;
  const m = { izq: 64, der: 16, arr: 16, aba: 32 };
  const todos = series.flatMap((s) => s.valores).filter((v): v is number => v !== null);
  if (!todos.length) return "";
  let min = Math.min(...todos);
  let max = Math.max(...todos);
  const margen = (max - min) * 0.08 || max * 0.05 || 1;
  min -= margen;
  max += margen;
  const n = Math.max(...series.map((s) => s.valores.length));
  const x = (i: number) => m.izq + (n <= 1 ? 0 : (i / (n - 1)) * (W - m.izq - m.der));
  const y = (v: number) => m.arr + (1 - (v - min) / (max - min)) * (H - m.arr - m.aba);
  const lineas = series
    .map((s, k) => {
      let d = "";
      let abierto = false;
      s.valores.forEach((v, i) => {
        if (v === null) return void (abierto = false);
        d += `${abierto ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
        abierto = true;
      });
      return `<path d="${d}" fill="none" stroke="${s.color ?? (k === 0 ? "var(--color-canopy)" : "var(--color-slate)")}" stroke-width="${k === 0 ? 2.5 : 1.5}" ${k > 0 ? 'stroke-dasharray="5 4"' : ""} stroke-linejoin="round" />`;
    })
    .join("");
  const marcas = [0, 0.5, 1].map((t) => min + margen + t * (max - min - 2 * margen));
  const ejeY = marcas
    .map((v) => `<line x1="${m.izq}" x2="${W - m.der}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" stroke="var(--color-pale-sage)" /><text x="${m.izq - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end" font-size="12" fill="var(--color-slate)">${o.formato(v)}</text>`)
    .join("");
  const ejeX = [0, Math.floor((n - 1) / 2), n - 1]
    .filter((i, k, a) => a.indexOf(i) === k && o.etiquetas[i])
    .map((i) => `<text x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="${i === 0 ? "start" : i === n - 1 ? "end" : "middle"}" font-size="12" fill="var(--color-slate)">${o.etiquetas[i]}</text>`)
    .join("");
  const leyenda =
    series.length > 1
      ? `<p class="caption g-leyenda">${series.map((s, k) => `<span><span class="g-leyenda__l" style="border-top:${k === 0 ? "3px solid var(--color-canopy)" : "2px dashed var(--color-slate)"}"></span>${s.nombre}</span>`).join(" ")}</p>`
      : "";
  return `<figure class="g-svg"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.resumen.replace(/"/g, "&quot;")}" preserveAspectRatio="none" style="width:100%;height:auto">${ejeY}${lineas}${ejeX}</svg>${leyenda}</figure>`;
}

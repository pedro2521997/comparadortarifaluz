// Gráficas SVG del mix: producción por hora apilada por tecnología y barra de reparto del día.

import { COLOR_GRUPO, type Grupo } from "./textos-energia";

export function barrasApiladas(horas: Partial<Record<Grupo, (number | null)[]>>, orden: Grupo[], nombres: Record<Grupo, string>, resumen: string): string {
  const W = 720;
  const H = 240;
  const m = { izq: 8, der: 8, arr: 8, aba: 24 };
  const totalHora = Array.from({ length: 24 }, (_, h) => orden.reduce((a, g) => a + (horas[g]?.[h] ?? 0), 0));
  const max = Math.max(...totalHora, 1);
  const ancho = (W - m.izq - m.der) / 24;
  let barras = "";
  for (let h = 0; h < 24; h++) {
    let y = H - m.aba;
    for (const g of [...orden].reverse()) {
      const v = horas[g]?.[h] ?? 0;
      if (v <= 0) continue;
      const alto = (v / max) * (H - m.arr - m.aba);
      y -= alto;
      barras += `<rect x="${(m.izq + h * ancho + 1).toFixed(1)}" y="${y.toFixed(1)}" width="${(ancho - 2).toFixed(1)}" height="${alto.toFixed(1)}" fill="${COLOR_GRUPO[g]}"><title>${String(h).padStart(2, "0")}:00 · ${nombres[g]}: ${Math.round(v).toLocaleString()} MW</title></rect>`;
    }
  }
  const ejeX = [0, 6, 12, 18, 23].map((h) => `<text x="${(m.izq + h * ancho + ancho / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="12" fill="var(--color-slate)">${String(h).padStart(2, "0")}:00</text>`).join("");
  return `<figure class="g-svg"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${resumen.replace(/"/g, "&quot;")}" style="width:100%;height:auto">${barras}${ejeX}</svg></figure>`;
}

export function barraReparto(grupos: [Grupo, number][], nombres: Record<Grupo, string>, fmt: (x: number) => string): string {
  const total = grupos.reduce((a, [, v]) => a + v, 0) || 1;
  const partes = grupos.map(([g, v]) => `<span style="width:${((v / total) * 100).toFixed(2)}%;background:${COLOR_GRUPO[g]}" title="${nombres[g]}: ${fmt(v / total)}"></span>`).join("");
  const lista = grupos.map(([g, v]) => `<li><span class="ed-punto" style="background:${COLOR_GRUPO[g]}" aria-hidden="true"></span>${nombres[g]}: <strong>${fmt(v / total)}</strong></li>`).join("");
  return `<div class="ed-barra" role="img" aria-label="${grupos.map(([g, v]) => `${nombres[g]} ${fmt(v / total)}`).join(", ")}">${partes}</div><ul class="ed-lista small" style="margin-top:10px">${lista}</ul>`;
}

import { describe, expect, it } from "vitest";
import { grafico, type Formato } from "../../apps/global/src/lib/bloque";
import { TEXTOS_V } from "../../apps/global/src/lib/textos-visual";

const de: Formato = { lang: "de", locale: "de-DE", unidad: "ct/kWh", mult: 0.1, decimales: 2 };
// Un domingo de mucho sol: precios negativos al mediodía (€/MWh).
const precios = [90, 85, 80, 78, 80, 88, 95, 70, 30, 5, -10, -40, -60, -45, -20, 10, 60, 120, 150, 140, 120, 100, 95, 90];

const barras = (html: string) => [...html.matchAll(/<rect class="gb__b[^"]*" data-h="(\d+)" data-l="[^"]*" x="[\d.]+" y="([\d.]+)" width="[\d.]+" height="([\d.]+)"/g)].map((m) => ({ h: Number(m[1]), y: Number(m[2]), alto: Number(m[3]) }));

describe("gráfico interactivo de la web global", () => {
  const html = grafico(de, precios, 12);

  it("pinta una barra por hora con su lectura traducida", () => {
    expect(barras(html)).toHaveLength(24);
    expect(html).toContain('data-l="12:00–13:00: −6,00 ct/kWh (günstig)"');
    expect(html).toContain(TEXTOS_V.de.ayuda);
  });

  it("las horas negativas cuelgan por debajo de la línea del cero", () => {
    const cero = Number(/class="gb__rej gb__cero"[^>]*y1="([\d.]+)"/.exec(html)![1]);
    for (const b of barras(html)) {
      if (precios[b.h] < 0) expect(b.y).toBeCloseTo(cero, 0);
      else expect(b.y + b.alto).toBeCloseTo(cero, 0);
    }
  });

  it("el eje lleva valores negativos y redondos", () => {
    const eje = [...html.matchAll(/<span style="top:[\d.]+%">([^<]+)<\/span>/g)].map((m) => m[1]);
    expect(eje[0]).toMatch(/^−/);
    expect(eje).toContain("0");
  });

  it("marca la hora actual", () => {
    expect(html).toContain("gb__b--ahora");
    expect(html).toContain('<span class="gb__tit">Jetzt</span>');
  });
});

// El catálogo importado de la CNMC tiene que cuadrar con los precios que publica cada comercializadora.
import { describe, expect, it } from "vitest";
import tarifas from "../../../data/tarifas.json";
import manuales from "../../../data/tarifas-manuales.json";

const todas = [...tarifas.tarifas, ...manuales.tarifas] as any[];
const buscar = (com: RegExp, nombre: string) => todas.find((t) => com.test(t.comercializadora) && t.nombre === nombre);

describe("catálogo de tarifas", () => {
  it("Visalia 3 Precios coincide con su ficha (27,704413 y 0,725423 €/kW·año; 0,260402 / 0,170417 / 0,142047 €/kWh)", () => {
    const t = buscar(/DOMESTICA GAS/, "Visalia 3 Precios");
    expect(t.potencia.p1 * 365).toBeCloseTo(27.704413, 2);
    expect(t.potencia.p2 * 365).toBeCloseTo(0.725423, 2);
    expect(t.energia).toEqual({ p1: 0.260402, p2: 0.170417, p3: 0.142047 });
  });
  it("Endesa Conecta 3 Periodos coincide con su ficha (26,88 €/kW·año; 0,2249 / 0,1489 / 0,1229 €/kWh)", () => {
    const t = buscar(/ENDESA/, "Conecta 3 Periodos");
    expect(t.potencia.p1 * 365).toBeCloseTo(26.88, 2);
    expect(t.energia).toEqual({ p1: 0.2249, p2: 0.1489, p3: 0.1229 });
  });
  it("todas las tarifas tienen precios válidos, fuente y fecha", () => {
    for (const t of todas.filter((x) => x.tipo !== "pvpc" && x.tipo !== "indexada")) {
      expect(t.potencia.p1, t.id).toBeGreaterThanOrEqual(0);
      expect(t.energia.p1, t.id).toBeGreaterThan(0.03);
      expect(t.energia.p1, t.id).toBeLessThan(0.6);
      expect(t.url_fuente, t.id).toMatch(/^https?:\/\//);
      expect(t.fecha_comprobacion, t.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it("las indexadas tienen potencia, cuota y parámetros de fórmula", () => {
    const idx = todas.filter((t) => t.tipo === "indexada");
    expect(idx.length).toBeGreaterThanOrEqual(4);
    for (const t of idx) {
      expect(t.potencia.p1, t.id).toBeGreaterThan(0.05);
      expect(t.indexada.factor_tm, t.id).toBeGreaterThanOrEqual(1);
      expect(["oficial", "terceros", "aproximada"]).toContain(t.indexada.formula);
    }
  });
  it("no hay identificadores repetidos", () => {
    expect(new Set(todas.map((t) => t.id)).size).toBe(todas.length);
  });
});

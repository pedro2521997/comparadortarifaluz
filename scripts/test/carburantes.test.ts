import { describe, expect, it } from "vitest";
// @ts-expect-error módulo .mjs sin tipos
import { fechaMinisterio, compactar, estadisticas, leerHoja } from "../carburantes.mjs";

describe("Ministerio (gasolineras)", () => {
  it("lee la fecha y la hora del Ministerio", () => {
    expect(fechaMinisterio("27/10/2026 11:57:43")).toEqual({ fecha: "2026-10-27", hora: "11:57" });
    expect(fechaMinisterio("28/10/2026 9:51:13")).toEqual({ fecha: "2026-10-28", hora: "09:51" });
    expect(fechaMinisterio("basura")).toBeNull();
  });

  it("convierte los precios con coma y descarta los vacíos o absurdos", () => {
    const e = compactar({ IDEESS: "1", "Rótulo": "REPSOL", Municipio: "Solana (La)", IDProvincia: "13", "Precio Gasolina 95 E5": "1,699", "Precio Gasoleo A": "", "Precio Gasolina 98 E5": "99,9" });
    expect(e.p).toEqual({ g95: 1.699 });
  });

  it("calcula media, mínimo y máximo por carburante", () => {
    const s = estadisticas([{ p: { g95: 1.5 } }, { p: { g95: 1.7, diesel: 1.6 } }]);
    expect(s.g95).toEqual({ media: 1.6, min: 1.5, max: 1.7, n: 2 });
    expect(s.diesel.n).toBe(1);
  });
});

describe("Boletín petrolero europeo", () => {
  it("lee los bloques de cada país, de la semana más antigua a la más reciente, en €/litro", () => {
    const cab = [null, "CTR", "EU_price_with_tax_euro95", null, null, null, null, null, "CTR", "ES_price_with_tax_euro95"];
    const filas = [cab, [], [], [46314, "EU_", 1991, 2138, 1739, 0, 0, 890, "ES_", 1780, 1889, 1521, 0, 0, 1103], [46307, "EU_", 2000, 2140, 1740, 0, 0, 891, "ES_", 1790, 1889, 1445, 0, 0, 1101]];
    const { semanas, paises } = leerHoja(filas, "price_with_tax");
    expect(semanas).toEqual(["2026-10-12", "2026-10-19"]);
    expect(paises.ES.euro95).toEqual([1.79, 1.78]);
    expect(paises.ES.glp).toEqual([1.101, 1.103]);
    expect(paises.EU.diesel).toEqual([2.14, 2.138]);
  });
});

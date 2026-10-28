import { describe, expect, it } from "vitest";
import { TEXTOS_Z } from "../../apps/global/src/lib/textos-zonas";
import { departamento } from "../../apps/global/src/lib/zonas";

describe("gasolineras baratas por región (Francia y Portugal)", () => {
  it("departamento a partir del código postal, también en Córcega", () => {
    expect(departamento("69003")).toBe("69");
    expect(departamento("01000")).toBe("01");
    expect(departamento("20090")).toBe("2A");
    expect(departamento("20200")).toBe("2B");
  });

  it("preposiciones delante de cada ciudad", () => {
    const fr = TEXTOS_Z.fr;
    expect(fr.enCiudad("Lyon")).toBe("à Lyon");
    expect(fr.enCiudad("Le Mans")).toBe("au Mans");
    expect(fr.enCiudad("Les Herbiers")).toBe("aux Herbiers");
    expect(fr.deCiudad("Angers")).toBe("d'Angers");
    expect(fr.slugRegion("Corse-du-Sud", "2A")).toBe("corse-du-sud-2a");
    const pt = TEXTOS_Z.pt;
    expect(pt.enCiudad("Lisboa")).toBe("em Lisboa");
    expect(pt.enCiudad("Porto")).toBe("no Porto");
    expect(pt.enCiudad("Amadora")).toBe("na Amadora");
    expect(pt.enRegion("Guarda", "guarda")).toBe("no distrito da Guarda");
    expect(pt.rRank(2, 18, "o gasóleo")).toContain("do gasóleo");
    expect(pt.rRank(2, 18, "a gasolina 95")).toContain("da gasolina 95");
  });
});

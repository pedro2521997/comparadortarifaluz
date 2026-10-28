import { describe, expect, it } from "vitest";
import { marca, insignia, nombreMarca } from "../../apps/global/src/lib/marcas";
// @ts-expect-error módulo .mjs sin tipos
import { slugFicha, rotuloVacio } from "../../apps/global/src/lib/fichas.mjs";

describe("Marcas de gasolineras", () => {
  it("reconoce la marca dentro del rótulo", () => {
    expect(marca("REPSOL")?.nombre).toBe("Repsol");
    expect(marca("BP ROMICA")?.nombre).toBe("BP");
    expect(marca("ESTACIÓN DE SERVICIO REPSOL")?.nombre).toBe("Repsol");
    expect(marca("E.LECLERC")?.nombre).toBe("E.Leclerc");
    expect(marca("CAMPSA EXPRESS")?.nombre).toBe("Campsa");
    expect(marca("BPX TRANSPORTES")).toBeNull(); // «BP» tiene que ser una palabra
    expect(marca("")).toBeNull();
  });

  it("insignia genérica con la inicial para las que no son de marca", () => {
    expect(insignia("CARBURANTES LOS SEÑORITOS SL")).toMatchObject({ id: "x-c", t: "C" });
    expect(insignia("")).toMatchObject({ id: "x", t: "" });
  });

  it("nombre bonito solo cuando el rótulo es la marca a secas", () => {
    expect(nombreMarca("BONAREA")).toBe("bonÀrea");
    expect(nombreMarca("Repsol")).toBe("Repsol");
    expect(nombreMarca("BP Romica")).toBe("BP Romica");
  });
});

describe("Fichas de gasolineras", () => {
  it("la URL sale igual con el artículo detrás o delante", () => {
    expect(slugFicha("REPSOL", "Solana (La)", "5122")).toBe("repsol-la-solana-5122");
    expect(slugFicha("REPSOL", "La Solana", "5122")).toBe("repsol-la-solana-5122");
    expect(slugFicha("Nº 10.935", "Abengibre", "4375")).toBe("gasolinera-abengibre-4375");
    expect(slugFicha("CAMPSA", "Hospitalet de Llobregat (L')", "9")).toBe(slugFicha("CAMPSA", "L'Hospitalet de Llobregat", "9"));
  });

  it("rótulos vacíos", () => {
    expect(rotuloVacio("(SIN RÓTULO)")).toBe(true);
    expect(rotuloVacio("Nº 7.374")).toBe(true);
    expect(rotuloVacio("REPSOL")).toBe(false);
  });
});

describe("Nombres y direcciones de las fichas", () => {
  it("minúsculas sin romper las palabras con tilde ni las siglas", async () => {
    const { bonito, nombreEstacion } = await import("../../apps/global/src/lib/gasolineras");
    expect(bonito("GALÁN DE MEMBRILLA")).toBe("Galán de Membrilla");
    expect(bonito("RONDA DE LOS EMIGRANTES, SN")).toBe("Ronda de los Emigrantes, s/n");
    expect(bonito("CR N-430, 307,3")).toBe("Cr N-430, 307,3");
    expect(nombreEstacion("BP ROMICA")).toBe("BP Romica");
    expect(nombreEstacion("REPSOL")).toBe("Repsol");
    expect(nombreEstacion("Nº 10.935")).toBe("Gasolinera");
  }, 120000); // la primera vez carga las 11.000 gasolineras del día
});

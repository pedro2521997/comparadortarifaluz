import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import regulados from "../../../data/regulados.json";
import festivosJson from "../../../data/festivos.json";
import ajustesJson from "../../../data/mercado-ajustes.json";
import manuales from "../../../data/tarifas-manuales.json";
import { precioIndexado, prepararMercado, calcularFactura, generarLecturas, type Regulados, type Tarifa, type ParamsIndexada } from "../src/index";

const reg = regulados as unknown as Regulados;
const festivos = new Set(festivosJson.fechas);

describe("precio de una hora indexada", () => {
  it("aplica pérdidas, FNEE, tasa municipal, peajes y margen", () => {
    const p: ParamsIndexada = { factor_perdidas: 1, fnee: true, extra_kwh: 0, factor_tm: 1.015, margen_kwh: 0.01, formula: "oficial", descripcion: "" };
    const m = prepararMercado({ spot: { "2026-10-19": new Array(24).fill(0.1) }, ajustes: { "2026-10": 0.02 } });
    const h = precioIndexado("2026-10-19", 12, 1, p, m, reg);
    // ((0,10 + 0,02) × 1,167 + 0,002657) × 1,015 + 0,097553 + 0,01
    expect(h.precio).toBeCloseTo(((0.12 * 1.167 + 0.002657) * 1.015) + 0.097553 + 0.01, 6);
    expect(h.sinSpot).toBe(false);
    const sinDatos = precioIndexado("2026-11-02", 3, 3, p, m, reg);
    expect(sinDatos.sinSpot).toBe(true);
    expect(sinDatos.sinAjuste).toBe(true);
  });
});

describe("indexadas con un año real de mercado", () => {
  const dir = new URL("../../../data/precios/", import.meta.url);
  const spot: Record<string, (number | null)[]> = {};
  const pvpc: Record<string, number[]> = {};
  for (const f of readdirSync(dir)) {
    const d = JSON.parse(readFileSync(new URL(f, dir), "utf8"));
    spot[d.fecha] = d.spot;
    pvpc[d.fecha] = d.precios;
  }
  const ajustes = Object.fromEntries(Object.entries(ajustesJson.meses).map(([m, v]) => [m, (v as { ajuste_eur_kwh: number }).ajuste_eur_kwh]));
  const fechas = Object.keys(spot).sort();
  const hasta = fechas[fechas.length - 2];
  const desde = fechas[fechas.length - 366];
  const lecturas = generarLecturas({ desde, hasta, anualKwh: 3000, tipo: "estandar", festivos });
  const ctx = { regulados: reg, festivos, pvpc, mercado: { spot, ajustes } };

  it("el precio medio de la energía es razonable y del orden del PVPC", () => {
    const pvpcT = { id: "pvpc", comercializadora: "", nombre: "", tipo: "pvpc", potencia: null, energia: null, cuota_fija_mes: 0, permanencia_meses: 0, servicios_obligatorios: [], url_fuente: "", fecha_comprobacion: null, comision: false, url_contratar: "" } as Tarifa;
    const fPvpc = calcularFactura(lecturas, pvpcT, { p1: 4.6, p2: 4.6 }, ctx);
    for (const t of (manuales.tarifas as unknown as Tarifa[]).filter((x) => x.tipo === "indexada")) {
      const f = calcularFactura(lecturas, t, { p1: 4.6, p2: 4.6 }, ctx);
      const medio = f.energia / f.kwh;
      expect(medio, t.id).toBeGreaterThan(0.08);
      expect(medio, t.id).toBeLessThan(0.25);
      // Mismo orden de magnitud que la PVPC (que mezcla mercado diario y a plazo): ±35 %.
      expect(Math.abs(f.energia / fPvpc.energia - 1), t.id).toBeLessThan(0.35);
    }
  });
});

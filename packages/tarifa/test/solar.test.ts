// Tests del cálculo solar (vive en apps/web porque usa PVGIS desde el navegador).
import { describe, expect, it } from "vitest";
import { simular, escenario, consumoTipo, produccionAproximada, tamanoRecomendado, matrizDesdePvgis, DIAS_MES, type Matriz } from "../../../apps/web/src/lib/solar";

const plana = (v: number): Matriz => Array.from({ length: 12 }, () => new Array(24).fill(v));
const anual = (m: Matriz) => m.reduce((a, fila, i) => a + fila.reduce((x, y) => x + y, 0) * DIAS_MES[i], 0);
const precios = { energia: 0.15, excedente: 0.05, impuestos: 1 };

describe("simulación de autoconsumo", () => {
  it("sin excedentes: todo lo producido se autoconsume", () => {
    const s = simular(plana(0.1), plana(1), 1, precios);
    expect(s.excedentes).toBeCloseTo(0);
    expect(s.autoconsumo).toBeCloseTo(s.produccion);
    expect(s.ahorro).toBeCloseTo(s.produccion * 0.15);
  });

  it("la compensación nunca supera el término de energía del mes", () => {
    // Produce mucho más de lo que consume: el término de energía restante es 0,
    // así que los excedentes no pueden descontar nada.
    const s = simular(plana(5), plana(0.2), 1, precios);
    expect(s.consumo).toBeCloseTo(s.autoconsumo);
    expect(s.compensacion).toBeCloseTo(0);
  });

  it("la compensación descuenta excedentes cuando hay energía comprada", () => {
    const prod = plana(0).map((fila) => fila.map((_, h) => (h >= 10 && h < 16 ? 1 : 0)));
    const s = simular(prod, plana(0.5), 1, precios);
    expect(s.excedentes).toBeGreaterThan(0);
    expect(s.compensacion).toBeCloseTo(s.excedentes * 0.05);
  });
});

describe("batería", () => {
  // 6 h de sol con 1 kWh cada hora; consumo plano de 0,5 kWh: sobran 3 kWh al día y faltan 9.
  const prod = plana(0).map((fila) => fila.map((_, h) => (h >= 10 && h < 16 ? 1 : 0)));

  it("guarda excedentes y los usa en las horas sin sol", () => {
    const sin = simular(prod, plana(0.5), 1, precios);
    const con = simular(prod, plana(0.5), 1, precios, 1, 5);
    expect(con.desdeBateria).toBeGreaterThan(0);
    expect(con.autoconsumo).toBeGreaterThan(sin.autoconsumo);
    expect(con.excedentes).toBeLessThan(sin.excedentes);
    // Cada día carga los 3 kWh sobrantes y devuelve el 90 % (dos pasos del 95 %).
    expect(con.desdeBateria / anual(plana(1 / 24))).toBeCloseTo(3 * 0.95 * 0.95, 5);
  });

  it("no devuelve más de su capacidad al día", () => {
    const con = simular(prod, plana(0.5), 1, precios, 1, 1);
    expect(con.desdeBateria / anual(plana(1 / 24))).toBeLessThanOrEqual(1 + 1e-9);
  });

  it("sin batería, el resultado es el de siempre", () => {
    expect(simular(prod, plana(0.5), 1, precios, 1, 0)).toEqual({ ...simular(prod, plana(0.5), 1, precios), desdeBateria: 0 });
  });
});

describe("escenarios", () => {
  it("amortización y neto a 25 años", () => {
    const e = escenario(500, 4000, 0, 0);
    expect(e.amortizacion).toBe(8);
    expect(e.neto25).toBeCloseTo(500 * 25 - 4000);
    expect(escenario(10, 4000, 0, 0).amortizacion).toBeNull();
  });
});

describe("perfiles y producción", () => {
  it("el perfil tipo suma el consumo anual pedido", () => {
    expect(anual(consumoTipo(3500, false))).toBeCloseTo(3500, 0);
    expect(anual(consumoTipo(3500, true))).toBeCloseTo(3500, 0);
  });
  it("la aproximación da un rendimiento razonable en Madrid y en Canarias", () => {
    const madrid = anual(produccionAproximada({ lat: 40.4, lon: -3.7, canarias: false }, 0));
    const canarias = anual(produccionAproximada({ lat: 28.1, lon: -15.4, canarias: true }, 0));
    expect(madrid).toBeGreaterThan(1300);
    expect(madrid).toBeLessThan(1700);
    expect(canarias).toBeGreaterThan(madrid);
  });
  it("convierte la serie de PVGIS (UTC) a hora local", () => {
    const serie = [{ time: "20230115:1110", P: 600 }, { time: "20230715:1110", P: 800 }];
    const m = matrizDesdePvgis(serie, false);
    expect(m[0][12]).toBeCloseTo(0.6); // enero: UTC+1
    expect(m[6][13]).toBeCloseTo(0.8); // julio: UTC+2
  });
  it("el tamaño recomendado respeta el tejado", () => {
    const prod = produccionAproximada({ lat: 40.4, lon: -3.7, canarias: false }, 0);
    expect(tamanoRecomendado(prod, 20000, 4)).toBe(4);
    expect(tamanoRecomendado(prod, 3000, 10)).toBeGreaterThanOrEqual(1);
  });
});

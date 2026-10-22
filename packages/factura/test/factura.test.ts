import { describe, expect, it } from "vitest";
import { leerFactura, numero, cupsValido, lineasDesdeTrozos, camposEncontrados, conceptosEn, repararPalabras } from "../src/index";

// CUPS con letras de control correctas (ES0021000012345678 → YX según el algoritmo módulo 529).
const L = "TRWAGMYFPDXBNJZSQVHLCKE";
const n = Number(BigInt("0021000012345678") % 529n);
const CUPS = `ES0021000012345678${L[Math.floor(n / 23)]}${L[n % 23]}`;

// Facturas sintéticas que imitan el modelo regulado. Se sustituirán por reales anonimizadas.
const FIJA = `
Iberdrola Clientes, S.A.U.
FACTURA DE ELECTRICIDAD Nº 21E000123456
Fecha de emisión: 05/10/2026
Periodo de facturación: del 01/09/2026 al 30/09/2026 (30 días)
RESUMEN DE LA FACTURA
Por potencia contratada 12,40 €
Por energía consumida 33,15 €
Financiación bono social 0,38 €
Impuesto electricidad 2,36 €
Alquiler equipos de medida y control 0,80 €
Servicio de mantenimiento Pack Hogar 4,99 €
IVA (21%) 11,24 €
TOTAL IMPORTE FACTURA 64,72 €
DATOS DEL CONTRATO
Titular: XXXXX
CUPS: ${CUPS.slice(0, 6)} ${CUPS.slice(6, 10)} ${CUPS.slice(10, 14)} ${CUPS.slice(14, 18)} ${CUPS.slice(18)} 0F
Potencia contratada: punta-llano 3,450 kW valle 4,600 kW
Peaje de acceso: 2.0TD
Empresa distribuidora: i-DE Redes Eléctricas Inteligentes
DETALLE
Potencia punta 3,45 kW x 30 días x 0,089000 €/kW día 9,21 €
Potencia valle 4,60 kW x 30 días x 0,023000 €/kW día 3,17 €
Energía consumida 221 kWh x 0,150000 €/kWh 33,15 €
Consumo punta 61 kWh
Consumo llano 64 kWh
Consumo valle 96 kWh
Consumo total 221 kWh
Su consumo en los últimos 12 meses ha sido de 2.640 kWh
`;

const PVPC = `
Energía XXI Comercializadora de Referencia S.L.U.
Precio voluntario para el pequeño consumidor (PVPC)
Periodo de consumo: 15-08-2026 a 14-09-2026
Nº de días: 31
Término de potencia 10,53 €
Término de energía 45,80 €
Impuesto especial sobre la electricidad 2,88 €
Alquiler de contador 0,84 €
IVA 21 % 12,58 €
Total a pagar 72,63 €
Potencia contratada P1: 4,6 kW P2: 4,6 kW
P1: 32,704413 €/kW año P2: 9,725423 €/kW año
Energía P1 70 kWh P2 80 kWh P3 120 kWh
`;

const TABLA = `
Octopus Energy España
Del 1 de septiembre de 2026 al 30 de septiembre de 2026
Punta Llano Valle
Energía 55 kWh 60 kWh 105 kWh
Precio 0,1890 €/kWh 0,1890 €/kWh 0,1890 €/kWh
Total factura 58,40 €
`;

describe("números", () => {
  it("formatos español e inglés", () => {
    expect(numero("1.234,56")).toBeCloseTo(1234.56);
    expect(numero("3,450")).toBeCloseTo(3.45);
    expect(numero("0.150000")).toBeCloseTo(0.15);
    expect(numero("1.234.567")).toBe(1234567);
    expect(numero("-4,99")).toBeCloseTo(-4.99);
  });
});

describe("CUPS", () => {
  it("valida las letras de control", () => {
    expect(cupsValido(CUPS)).toBe(true);
    expect(cupsValido(CUPS.slice(0, 18) + "AA")).toBe(false);
  });
});

describe("factura de precio fijo", () => {
  const d = leerFactura(FIJA);
  it("datos del contrato", () => {
    expect(d.comercializadora).toBe("Iberdrola");
    expect(d.cups).toBe(`${CUPS}0F`);
    expect(d.cupsValido).toBe(true);
    expect(d).toMatchObject({ desde: "2026-09-01", hasta: "2026-09-30", dias: 30, pvpc: false });
    expect(d.potencia).toEqual({ p1: 3.45, p2: 4.6 });
  });
  it("consumo y precios", () => {
    expect(d.kwh).toMatchObject({ p1: 61, p2: 64, p3: 96, total: 221 });
    expect(d.precioEnergia).toEqual({ p1: 0.15, p2: 0.15, p3: 0.15 });
    expect(d.precioPotencia.p1).toBeCloseTo(0.089);
    expect(d.precioPotencia.p2).toBeCloseTo(0.023);
    expect(d.consumoAnual).toBe(2640);
  });
  it("importes del resumen y servicios añadidos", () => {
    expect(d.importes).toMatchObject({ potencia: 12.4, energia: 33.15, bonoSocial: 0.38, impuestoElectrico: 2.36, alquiler: 0.8, iva: 11.24, total: 64.72 });
    expect(d.servicios).toEqual([{ concepto: "Servicio de mantenimiento Pack Hogar", importe: 4.99 }]);
    expect(Object.values(camposEncontrados(d)).every(Boolean)).toBe(true);
  });
});

describe("factura PVPC", () => {
  const d = leerFactura(PVPC);
  it("lee lo esencial", () => {
    expect(d.pvpc).toBe(true);
    expect(d.comercializadora).toMatch(/Energía XXI/);
    expect(d).toMatchObject({ desde: "2026-08-15", hasta: "2026-09-14", dias: 31 });
    expect(d.potencia).toEqual({ p1: 4.6, p2: 4.6 });
    expect(d.precioPotencia.p1).toBeCloseTo(32.704413 / 365, 6);
    expect(d.kwh).toMatchObject({ p1: 70, p2: 80, p3: 120, total: 270 });
    expect(d.importes).toMatchObject({ potencia: 10.53, energia: 45.8, impuestoElectrico: 2.88, alquiler: 0.84, iva: 12.58, total: 72.63 });
    expect(d.servicios).toEqual([]);
  });
});

describe("factura en tabla", () => {
  const d = leerFactura(TABLA);
  it("fechas en texto y columnas por periodo", () => {
    expect(d).toMatchObject({ desde: "2026-09-01", hasta: "2026-09-30", dias: 30 });
    expect(d.importes.total).toBeCloseTo(58.4);
    expect(d.comercializadora).toBe("Octopus Energy");
  });
});

describe("líneas desde pdf.js", () => {
  it("agrupa por altura y ordena por posición", () => {
    const l = lineasDesdeTrozos([
      { str: "64,72 €", x: 400, y: 700, pagina: 1 },
      { str: "TOTAL", x: 50, y: 701, pagina: 1 },
      { str: "Cabecera", x: 50, y: 800, pagina: 1 },
      { str: "Página dos", x: 50, y: 800, pagina: 2 },
    ]);
    expect(l).toEqual(["Cabecera", "TOTAL 64,72 €", "Página dos"]);
  });
});

// Como sale de muchos PDF: palabras partidas, otro orden y conceptos poco habituales.
const PARTIDA = `
Repsol Comercializadora de Electricidad y Gas
Periodo de factur ación 03/08/2026 - 01/09/2026 (30 días)
Término fijo 11,20 €
Término de consumo 39,10 €
Financi ación bono social fijo 0,38 €
Impuesto sobre la elec tricidad 2,57 €
Alquiler de equipos de medida 0,80 €
Regularización lecturas estimadas periodo anterior -12,40 €
Servicio Asistente 24h 2,90 €
IVA 21% 9,21 €
TOT AL A PAGAR 53,76 €
Potencia contratada (kW) P1 4,600 P2 4,600 kW
Potencias máximas demandadas último año P1 2,9 kW P2 3,1 kW
Lectura estimada
Peaje de acceso 2.0TD
Fecha fin de contrato 31/12/2026
`;

describe("factura con palabras partidas y conceptos variados", () => {
  const d = leerFactura(PARTIDA);
  it("recompone las palabras y lee los importes", () => {
    expect(d.importes).toMatchObject({ potencia: 11.2, energia: 39.1, bonoSocial: 0.38, impuestoElectrico: 2.57, alquiler: 0.8, iva: 9.21, total: 53.76 });
    expect(d).toMatchObject({ desde: "2026-08-03", hasta: "2026-09-01", dias: 30 });
    expect(d.potencia).toEqual({ p1: 4.6, p2: 4.6 });
    expect(d.potenciaMaxima).toBeCloseTo(3.1);
    expect(d.servicios.map((s) => s.importe)).toEqual([2.9]);
  });
  it("detecta y explica los conceptos", () => {
    const ids = conceptosEn(PARTIDA.split("\n")).map((c) => c.id);
    for (const id of ["potencia", "energia", "bonoSocial", "iee", "alquiler", "regularizacion", "estimada", "servicios", "iva", "potenciaMaxima", "peaje20td", "finContrato"]) expect(ids).toContain(id);
    expect(ids).not.toContain("descuentoBono");
    const reg = conceptosEn(PARTIDA.split("\n")).find((c) => c.id === "regularizacion")!;
    expect(reg.importe).toBeCloseTo(-12.4);
    expect(reg.linea).toMatch(/Regularización/);
  });
  it("repara sin tocar lo que ya está bien", () => {
    expect(repararPalabras("Pote ncia contratada")).toBe("Potencia contratada");
    expect(repararPalabras("TOT AL")).toBe("TOTAL");
    expect(repararPalabras("Subtotal de la factura")).toBe("Subtotal de la factura");
  });
});

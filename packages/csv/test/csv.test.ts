import { describe, expect, it } from "vitest";
import { leerConsumos, leerConMapeo, numero, fechaISO, horaDecimal } from "../src/index";

// Ficheros de ejemplo sintéticos con la forma de cada fuente. Sustituir por ficheros reales
// anonimizados en cuanto se reúnan (Fase 0).
const CUPS = "ES0021000000000000AB0F";

function filas(dias: string[], fmt: (fecha: string, h: number, kwh: string) => string, horas = 24) {
  const out: string[] = [];
  for (const f of dias) for (let h = 1; h <= horas; h++) out.push(fmt(f, h, (0.1 + h / 100).toFixed(3).replace(".", ",")));
  return out;
}

describe("utilidades", () => {
  it("lee números con coma o punto decimal", () => {
    expect(numero("0,123")).toBeCloseTo(0.123);
    expect(numero("0.123")).toBeCloseTo(0.123);
    expect(numero("1.234,5")).toBeCloseTo(1234.5);
    expect(numero("1,234.5")).toBeCloseTo(1234.5);
  });
  it("lee fechas en varios formatos", () => {
    expect(fechaISO("2026/01/05")).toBe("2026-01-05");
    expect(fechaISO("05/01/2026")).toBe("2026-01-05");
    expect(fechaISO("2026-01-05 13:00")).toBe("2026-01-05");
    expect(fechaISO("hola")).toBeNull();
  });
  it("lee horas", () => {
    expect(horaDecimal("01:00")).toBe(1);
    expect(horaDecimal("24")).toBe(24);
    expect(horaDecimal("00:15")).toBe(0.25);
    expect(horaDecimal("2026/01/05 13:00")).toBe(13);
  });
});

describe("Datadis", () => {
  const texto = ["CUPS;Fecha;Hora;Consumo_kWh;Metodo_obtencion", ...filas(["2026/01/05", "2026/01/06"], (f, h, k) => `${CUPS};${f};${String(h).padStart(2, "0")}:00;${k};Real`)].join("\n");
  it("detecta columnas y convierte la hora 1–24 en 0–23", () => {
    const r = leerConsumos(texto);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.lecturas).toHaveLength(48);
    expect(r.lecturas[0]).toEqual({ fecha: "2026-01-05", hora: 0, kwh: 0.11 });
    expect(r.lecturas[23].hora).toBe(23);
    expect(r.cups).toBe(CUPS);
    expect(r.desde).toBe("2026-01-05");
    expect(r.hasta).toBe("2026-01-06");
  });
  it("maneja la hora 25 del cambio de octubre", () => {
    const t = ["CUPS;Fecha;Hora;Consumo_kWh;Metodo_obtencion", ...filas(["2026/10/25"], (f, h, k) => `${CUPS};${f};${h}:00;${k};Real`, 25)].join("\n");
    const r = leerConsumos(t);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.lecturas).toHaveLength(25);
    expect(r.lecturas.filter((l) => l.hora === 2)).toHaveLength(2);
    expect(r.lecturas[24].hora).toBe(23);
    expect(r.avisos.join(" ")).toMatch(/hora 25/);
  });
  it("maneja el día de 23 horas de marzo", () => {
    const t = ["CUPS;Fecha;Hora;Consumo_kWh", ...filas(["2026/03/29"], (f, h, k) => `${CUPS};${f};${h};${k}`, 23)].join("\n");
    const r = leerConsumos(t);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.lecturas.map((l) => l.hora)).not.toContain(2);
    expect(r.lecturas[22].hora).toBe(23);
  });
});

describe("e-distribución (AE_kWh, fecha dd/mm/aaaa)", () => {
  const texto = ["CUPS;Fecha;Hora;AE_kWh;REAL/ESTIMADO", ...filas(["05/01/2026"], (f, h, k) => `${CUPS};${f};${h};${k};R`)].join("\r\n");
  it("lee el fichero", () => {
    const r = leerConsumos(texto);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.lecturas).toHaveLength(24);
    expect(r.lecturas[5]).toEqual({ fecha: "2026-01-05", hora: 5, kwh: 0.16 });
  });
});

describe("i-DE con comillas y BOM", () => {
  const texto = "﻿" + ['"CUPS";"Fecha";"Hora";"Consumo_kWh";"Metodo_obtencion"', ...filas(["2026/02/02"], (f, h, k) => `"${CUPS}";"${f}";"${h}";"${k}";"R"`)].join("\n");
  it("lee el fichero", () => {
    const r = leerConsumos(texto);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.lecturas).toHaveLength(24);
  });
});

describe("fichero con comas, punto decimal, fecha y hora juntas, hora 0–23", () => {
  const lineas = ["date,consumption (kWh)"];
  for (let h = 0; h < 24; h++) lineas.push(`2026-01-05 ${String(h).padStart(2, "0")}:00,0.${String(h + 10)}`);
  it("lee el fichero", () => {
    const r = leerConsumos(lineas.join("\n"));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.lecturas).toHaveLength(24);
    expect(r.lecturas[0]).toEqual({ fecha: "2026-01-05", hora: 0, kwh: 0.1 });
  });
});

describe("cuartohorario en Wh", () => {
  const lineas = ["Fecha;Hora;Energia_Wh"];
  for (let q = 1; q <= 96; q++) {
    const h = Math.floor(q / 4);
    const m = (q % 4) * 15;
    lineas.push(`05/01/2026;${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")};25`);
  }
  it("agrupa a horas y pasa a kWh", () => {
    const r = leerConsumos(lineas.join("\n"));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.lecturas).toHaveLength(24);
    expect(r.lecturas.every((l) => Math.abs(l.kwh - 0.1) < 1e-9)).toBe(true);
  });
});

describe("formato desconocido", () => {
  const texto = ["col1;col2;col3", "05/01/2026;1;0,2", "05/01/2026;2;0,3"].join("\n");
  it("pide el mapeo manual en lugar de fallar en silencio", () => {
    const r = leerConsumos(texto);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.cabecera).toEqual(["col1", "col2", "col3"]);
    expect(r.muestra?.length).toBe(2);
  });
  it("lee con el mapeo que indica el usuario", () => {
    const r = leerConMapeo(texto, { separador: ";", filaCabecera: 0, colFecha: 0, colHora: 1, colKwh: 2, colCups: -1, unidad: "kWh" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.lecturas.map((l) => l.kwh)).toEqual([0.2, 0.3]);
  });
});

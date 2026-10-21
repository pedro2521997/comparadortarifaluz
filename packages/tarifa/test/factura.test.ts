import { describe, expect, it } from "vitest";
import regulados from "../../../data/regulados.json";
import festivosJson from "../../../data/festivos.json";
import {
  calcularFactura,
  compararTarifas,
  periodoEnergia,
  repartoPorPeriodos,
  desplazarPuntaAValle,
  mejorFranja,
  nivelesDelDia,
  type Lectura,
  type Tarifa,
  type Regulados,
} from "../src/index";

const festivos = new Set(festivosJson.fechas);
const ctx = { regulados: regulados as Regulados, festivos };

const fija: Tarifa = {
  id: "fija", comercializadora: "X", nombre: "Fija", tipo: "fijo",
  potencia: { p1: 0.1, p2: 0.01 }, energia: { p1: 0.12, p2: 0.12, p3: 0.12 },
  cuota_fija_mes: 0, permanencia_meses: 0, servicios_obligatorios: [],
  url_fuente: "", fecha_comprobacion: "2026-10-01", comision: false, url_contratar: "",
};

function mesPlano(desde: string, dias: number, kwh = 0.5): Lectura[] {
  const out: Lectura[] = [];
  const base = Date.parse(desde + "T00:00:00Z");
  for (let d = 0; d < dias; d++) {
    const fecha = new Date(base + d * 86_400_000).toISOString().slice(0, 10);
    for (let h = 0; h < 24; h++) out.push({ fecha, hora: h, kwh });
  }
  return out;
}

describe("periodos 2.0TD", () => {
  it("lunes laborable", () => {
    expect(periodoEnergia("2026-10-19", 7, festivos)).toBe(3);
    expect(periodoEnergia("2026-10-19", 8, festivos)).toBe(2);
    expect(periodoEnergia("2026-10-19", 10, festivos)).toBe(1);
    expect(periodoEnergia("2026-10-19", 14, festivos)).toBe(2);
    expect(periodoEnergia("2026-10-19", 18, festivos)).toBe(1);
    expect(periodoEnergia("2026-10-19", 22, festivos)).toBe(2);
  });
  it("fin de semana y festivo nacional son valle todo el día", () => {
    expect(periodoEnergia("2026-10-18", 12, festivos)).toBe(3); // domingo
    expect(periodoEnergia("2026-10-12", 12, festivos)).toBe(3); // lunes, 12 de octubre
  });
});

describe("factura", () => {
  it("calcula a mano un mes plano con IVA del 21 %", () => {
    // Octubre de 2026: 31 días, 0,5 kWh cada hora = 372 kWh
    const f = calcularFactura(mesPlano("2026-10-01", 31), fija, { p1: 4.6, p2: 4.6 }, ctx);
    const potencia = (4.6 * 0.1 + 4.6 * 0.01) * 31;
    const energia = 372 * 0.12;
    const bono = 0.024658 * 31;
    const iee = 0.0511269632 * (potencia + energia + bono);
    const alquiler = 0.02663 * 31;
    const base = potencia + energia + bono + iee + alquiler;
    expect(f.dias).toBe(31);
    expect(f.kwh).toBeCloseTo(372);
    expect(f.potencia).toBeCloseTo(potencia, 2);
    expect(f.energia).toBeCloseTo(energia, 2);
    expect(f.total).toBeCloseTo(base * 1.21, 1);
  });

  it("aplica el IVA vigente cada día (10 % en abril de 2026)", () => {
    const abril = calcularFactura(mesPlano("2026-04-01", 30), fija, { p1: 3.3, p2: 3.3 }, ctx);
    expect(abril.iva / abril.baseIva).toBeCloseTo(0.1, 3);
    const mixto = calcularFactura(mesPlano("2026-05-17", 30), fija, { p1: 3.3, p2: 3.3 }, ctx);
    const tipo = mixto.iva / mixto.baseIva;
    expect(tipo).toBeGreaterThan(0.1);
    expect(tipo).toBeLessThan(0.21);
  });

  it("valora la PVPC hora a hora y avisa de los huecos", () => {
    const pvpc: Tarifa = { ...fija, id: "pvpc", tipo: "pvpc", potencia: null, energia: null };
    const lect = mesPlano("2026-10-19", 2, 1);
    const precios = { "2026-10-19": new Array(24).fill(0.1), "2026-10-20": new Array(24).fill(0.2) };
    const f = calcularFactura(lect, pvpc, { p1: 3.3, p2: 3.3 }, { ...ctx, pvpc: precios });
    expect(f.energia).toBeCloseTo(24 * 0.1 + 24 * 0.2, 2);
    const hueco = calcularFactura(lect, pvpc, { p1: 3.3, p2: 3.3 }, { ...ctx, pvpc: { "2026-10-19": new Array(24).fill(0.1) } });
    expect(hueco.horasSinPrecio).toBe(24);
    expect(hueco.avisos.join(" ")).toMatch(/sin precio/);
  });
});

describe("comparador", () => {
  it("ordena solo por precio y deja detrás las tarifas por revisar", () => {
    const cara: Tarifa = { ...fija, id: "cara", energia: { p1: 0.2, p2: 0.2, p3: 0.2 }, comision: true };
    const barataSinComprobar: Tarifa = { ...fija, id: "barata", energia: { p1: 0.05, p2: 0.05, p3: 0.05 }, fecha_comprobacion: null };
    const r = compararTarifas(mesPlano("2026-10-01", 7), [cara, barataSinComprobar, fija], { p1: 3.3, p2: 3.3 }, ctx, "2026-10-21");
    expect(r.map((x) => x.tarifa.id)).toEqual(["fija", "cara", "barata"]);
  });
});

describe("análisis", () => {
  it("reparto por periodos y desplazamiento de consumo", () => {
    const lect = mesPlano("2026-10-19", 5); // lunes a viernes
    const rep = repartoPorPeriodos(lect, festivos);
    expect(rep.porcentaje[1]).toBeCloseTo(8 / 24);
    const movido = desplazarPuntaAValle(lect, festivos, 0.1);
    const total = movido.reduce((a, l) => a + l.kwh, 0);
    expect(total).toBeCloseTo(60);
    expect(repartoPorPeriodos(movido, festivos).porcentaje[1]).toBeCloseTo((8 / 24) * 0.9);
  });
  it("mejor franja de horas", () => {
    const precios = [5, 4, 3, 2, 1, 1, 2, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9];
    expect(mejorFranja(precios, 2)?.inicio).toBe(4);
    expect(mejorFranja(precios, 3)?.inicio).toBe(3);
    expect(nivelesDelDia(precios)[4]).toBe("barata");
    expect(nivelesDelDia(precios)[10]).toBe("cara");
  });
});

describe("perfiles y promociones", () => {
  it("el perfil sintético suma el consumo pedido y respeta el reparto de la factura", async () => {
    const { generarLecturas } = await import("../src/index");
    const l = generarLecturas({ desde: "2025-10-01", hasta: "2026-09-30", anualKwh: 3500, tipo: "estandar", festivos, porPeriodo: { 1: 1000, 2: 1000, 3: 1500 } });
    expect(l).toHaveLength(365 * 24 - 1); // el día del cambio de marzo tiene 23 horas
    expect(l.reduce((a, x) => a + x.kwh, 0)).toBeCloseTo(3500, 0);
    const rep = repartoPorPeriodos(l, festivos);
    expect(rep.kwh[3]).toBeCloseTo(1500, 0);
  });

  it("descuenta la promoción solo si se pide y no cobra el bono social si va incluido", () => {
    const conPromo: Tarifa = { ...fija, info: { descuento_energia: { pct: 0.5, meses: 12 }, incluye_bono_social: true } };
    const lect = mesPlano("2026-10-01", 31);
    const sin = calcularFactura(lect, conPromo, { p1: 3.3, p2: 3.3 }, ctx);
    const con = calcularFactura(lect, conPromo, { p1: 3.3, p2: 3.3 }, { ...ctx, promociones: true });
    expect(sin.bonoSocial).toBe(0);
    expect(con.energia).toBeCloseTo(sin.energia / 2, 2);
  });
});

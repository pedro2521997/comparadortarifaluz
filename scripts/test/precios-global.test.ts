import { describe, expect, it } from "vitest";
// @ts-expect-error módulo .mjs sin tipos
import { leerEntsoe, porHoras, completo } from "../precios-global.mjs";

const xml = (puntos: string, res = "PT15M", ini = "2026-10-26T23:00Z", fin = "2026-10-27T23:00Z") => `<Publication_MarketDocument>
<TimeSeries><mRID>1</mRID><Period><timeInterval><start>${ini}</start><end>${fin}</end></timeInterval><resolution>${res}</resolution>
${puntos}
</Period></TimeSeries></Publication_MarketDocument>`;
const punto = (pos: number, precio: number) => `<Point><position>${pos}</position><price.amount>${precio}</price.amount></Point>`;

describe("ENTSO-E", () => {
  it("rellena los puntos omitidos con el anterior (curva A03)", () => {
    const p = leerEntsoe(xml(punto(1, 10) + punto(4, 40), "PT15M", "2026-10-26T23:00Z", "2026-10-27T00:00Z"));
    expect(p.map(([, v]: [number, number]) => v)).toEqual([10, 10, 10, 40]);
  });

  it("ignora las series que no son la de posición 1", () => {
    const doble = `<Publication_MarketDocument>
<TimeSeries><classificationSequence_AttributeInstanceComponent.position>2</classificationSequence_AttributeInstanceComponent.position><Period><timeInterval><start>2026-10-26T23:00Z</start><end>2026-10-27T00:00Z</end></timeInterval><resolution>PT60M</resolution>${punto(1, 99)}</Period></TimeSeries>
<TimeSeries><classificationSequence_AttributeInstanceComponent.position>1</classificationSequence_AttributeInstanceComponent.position><Period><timeInterval><start>2026-10-26T23:00Z</start><end>2026-10-27T00:00Z</end></timeInterval><resolution>PT60M</resolution>${punto(1, 50)}</Period></TimeSeries>
</Publication_MarketDocument>`;
    expect(leerEntsoe(doble)).toEqual([[Date.parse("2026-10-26T23:00Z"), 50]]);
  });
});

describe("porHoras", () => {
  it("promedia los cuartos de hora de cada hora local", () => {
    const ini = Date.parse("2026-10-26T23:00Z"); // 00:00 en Berlín
    const puntos = Array.from({ length: 96 }, (_, k) => [ini + k * 900000, k < 4 ? [10, 20, 30, 40][k] : 5]);
    const dia = porHoras(puntos, "Europe/Berlin").get("2026-10-27");
    expect(dia[0]).toBe(25);
    expect(dia[23]).toBe(5);
    expect(completo(dia)).toBe(true);
  });

  it("el día del cambio de hora de marzo tiene 23 horas y sigue siendo completo", () => {
    const ini = Date.parse("2026-03-28T23:00Z"); // 29 de marzo, 00:00 en Madrid; a las 02:00 se pasa a las 03:00
    const puntos = Array.from({ length: 23 }, (_, k) => [ini + k * 3600000, 1]);
    const dia = porHoras(puntos, "Europe/Madrid").get("2026-03-29");
    expect(dia[2]).toBeNull();
    expect(completo(dia)).toBe(true);
  });

  it("un día con huecos no está completo", () => {
    const ini = Date.parse("2026-10-26T23:00Z");
    const dia = porHoras([[ini, 1], [ini + 3600000, 2]], "Europe/Berlin").get("2026-10-27");
    expect(completo(dia)).toBe(false);
  });
});

// @ts-expect-error módulo .mjs sin tipos
import { leerSeries, mixPorDia } from "../precios-global.mjs";

describe("Mix de generación (A75)", () => {
  const serie = (psr: string, q: number, consumo = false) => `<TimeSeries><mRID>1</mRID>${consumo ? "<outBiddingZone_Domain.mRID>X</outBiddingZone_Domain.mRID>" : "<inBiddingZone_Domain.mRID>X</inBiddingZone_Domain.mRID>"}<MktPSRType><psrType>${psr}</psrType></MktPSRType><Period><timeInterval><start>2026-10-26T23:00Z</start><end>2026-10-27T01:00Z</end></timeInterval><resolution>PT60M</resolution><Point><position>1</position><quantity>${q}</quantity></Point><Point><position>2</position><quantity>${q * 2}</quantity></Point></Period></TimeSeries>`;

  it("lee cada tecnología y separa el consumo de bombeo", () => {
    const s = leerSeries(`<GL_MarketDocument>${serie("B19", 100)}${serie("B10", 50, true)}</GL_MarketDocument>`);
    expect(s.map((x: { psr: string; consumo: boolean }) => [x.psr, x.consumo])).toEqual([["B19", false], ["B10", true]]);
  });

  it("agrupa eólica terrestre y marina y suma por hora local", () => {
    const s = leerSeries(`<GL_MarketDocument>${serie("B19", 100)}${serie("B18", 10)}${serie("B10", 50, true)}${serie("B16", 0)}</GL_MarketDocument>`);
    const dia = mixPorDia(s, "Europe/Berlin").get("2026-10-27");
    expect(dia.eolica.slice(0, 2)).toEqual([110, 220]);
    expect(dia.hidraulica).toBeUndefined();
    expect(dia.solar.slice(0, 2)).toEqual([0, 0]);
  });
});

// @ts-expect-error módulo .mjs sin tipos
import { tramos } from "../precios-global.mjs";

describe("tramos de días que faltan", () => {
  it("agrupa los días seguidos y separa los sueltos", () => {
    expect(tramos(["2026-01-05", "2026-01-01", "2026-01-02"])).toEqual([["2026-01-01", "2026-01-02"], ["2026-01-05", "2026-01-05"]]);
    expect(tramos(["2026-02-28", "2026-03-01"])).toEqual([["2026-02-28", "2026-03-01"]]);
  });
});

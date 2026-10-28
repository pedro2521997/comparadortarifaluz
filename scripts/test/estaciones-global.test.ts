import { describe, expect, it } from "vitest";
// @ts-expect-error módulo .mjs sin tipos
import { capitalizar, municipioEs, csvMimit, italia, portugal, francia, espana } from "../estaciones-global.mjs";

const hoy = new Date("2026-10-27T12:00:00Z");

describe("Gasolineras para los mapas", () => {
  it("pone en minúsculas lo que llega en mayúsculas, sin tocar siglas de carretera", () => {
    expect(capitalizar("AVENIDA DE LA PAZ, 12")).toBe("Avenida de la Paz, 12");
    expect(capitalizar("RN 94")).toBe("RN 94");
    expect(capitalizar("CTRA. N-332 KM 45")).toBe("Ctra. N-332 KM 45");
    expect(capitalizar("RUE D'ALSACE")).toBe("Rue d'Alsace");
    expect(capitalizar("Boulevard Carnot")).toBe("Boulevard Carnot");
  });

  it("pone delante el artículo de los municipios españoles", () => {
    expect(municipioEs("Palmas de Gran Canaria (Las)")).toBe("Las Palmas de Gran Canaria");
    expect(municipioEs("Hospitalet de Llobregat (L')")).toBe("L'Hospitalet de Llobregat");
    expect(municipioEs("Pobla de Vallbona (la)")).toBe("La Pobla de Vallbona");
    expect(municipioEs("Madrid")).toBe("Madrid");
  });

  it("Francia: precios recientes y razonables, marca de autopista", () => {
    const { combustibles, e } = francia(
      [
        { geom: { lat: 45.76, lon: 4.83 }, adresse: "RUE X", ville: "Lyon", cp: "69007", pop: "A", gazole_prix: 2.1, gazole_maj: "2026-10-26T10:00:00+00:00", e10_prix: 1.9, e10_maj: "2025-01-01T10:00:00+00:00" },
        { geom: { lat: 0, lon: 0 }, gazole_prix: 2, gazole_maj: "2026-10-26T10:00:00+00:00" },
      ],
      hoy,
    );
    expect(e).toHaveLength(1);
    expect(e[0][6][combustibles.indexOf("diesel")]).toBe(2.1);
    expect(e[0][6][combustibles.indexOf("e10")]).toBeNull(); // precio de hace casi dos años
    expect(e[0][8]).toBe(1);
  });

  it("Italia: lee el CSV con «|» o «;» y prefiere el precio en autoservicio", () => {
    const a = csvMimit("Estrazione del 2026-10-27\nidImpianto|Gestore|Bandiera|Tipo Impianto|Nome Impianto|Indirizzo|Comune|Provincia|Latitudine|Longitudine\n1|X|Q8|Autostradale|Q8 Nord|VIA ROMA 5|MILANO|MI|45,46|9,19");
    const p = csvMimit("Estrazione del 2026-10-27\nidImpianto;descCarburante;prezzo;isSelf;dtComu\n1;Gasolio;1.899;0;27/10/2026 07:00:00\n1;Gasolio;1.799;1;27/10/2026 07:00:00\n1;Benzina;1.850;1;26/10/2026 07:00:00");
    const { combustibles, e } = italia(a, p, hoy);
    expect(e).toHaveLength(1);
    expect(e[0].slice(2, 5)).toEqual(["Q8", "Via Roma 5", "Milano"]);
    expect(e[0][6][combustibles.indexOf("diesel")]).toBe(1.799);
    expect(e[0][7]).toBe("2026-10-27");
    expect(e[0][8]).toBe(1);
  });

  it("Portugal: junta los carburantes de cada posto y guarda su distrito y concelho", () => {
    const posto = { Id: 7, Nome: "Posto", Marca: "GALP", Morada: "Rua A", Localidade: "Porto", Distrito: "Porto", Municipio: "Porto", CodPostal: "4000-001", Latitude: 41.15, Longitude: -8.61, DataAtualizacao: "2026-10-26 08:00" };
    const { combustibles, e } = portugal({ g95: [{ ...posto, Preco: "1,899 €" }], diesel: [{ ...posto, Preco: "1,749 €" }] }, hoy);
    expect(e).toHaveLength(1);
    expect(e[0][6][combustibles.indexOf("g95")]).toBe(1.899);
    expect(e[0][6][combustibles.indexOf("diesel")]).toBe(1.749);
    expect(e[0].slice(9)).toEqual(["", "Porto", "Porto"]);
  });

  it("España: sin rótulos que solo son un número, nombres en minúsculas y enlace a la ficha", () => {
    const { e } = espana({
      fecha: "2026-10-27",
      estaciones: [
        { id: "7374", rotulo: "Nº 7374", dir: "CALLE MAYOR, 1", mun: "Solana (La)", cp: "13240", lat: 38.9, lon: -3.2, p: { g95: 1.7 } },
        { id: "11", rotulo: "CARBURANTES LOS SEÑORITOS SL", dir: "RONDA, SN", mun: "Solana (La)", cp: "13240", lat: 38.9, lon: -3.2, p: { g95: 1.6 } },
        { id: "12", rotulo: "A&A", dir: "RONDA, SN", mun: "Albacete", cp: "02005", lat: 39, lon: -1.8, p: { g95: 1.6 } },
      ],
    });
    expect(e[0].slice(2, 5)).toEqual(["", "Calle Mayor, 1", "La Solana"]);
    expect(e[0][9]).toBe("gasolinera-la-solana-7374");
    expect(e[1][2]).toBe("Carburantes los Señoritos SL");
    expect(e[1][9]).toBe("carburantes-los-senoritos-sl-la-solana-11");
    expect(e[2][2]).toBe("A&A");
  });
});

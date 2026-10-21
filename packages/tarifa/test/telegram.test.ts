// Mensaje diario del bot de Telegram (apps/worker).
import { describe, expect, it } from "vitest";
import { mensajeDiario } from "../../../apps/worker/src/index";

describe("mensaje diario de Telegram", () => {
  it("da la franja barata de 2 horas, la que evitar y el enlace", () => {
    const precios = Array.from({ length: 24 }, (_, h) => (h === 14 || h === 15 ? 0.08 : h === 20 || h === 21 ? 0.3 : 0.15));
    const m = mensajeDiario("2026-10-22", precios);
    expect(m).toContain("jueves, 22 de octubre de 2026");
    expect(m).toContain("de 14:00 a 16:00 (0,080 €/kWh)");
    expect(m).toContain("Evita de 20:00 a 22:00");
    expect(m).toContain("https://comparadortarifaluz.es/precio-luz-manana/");
  });
});

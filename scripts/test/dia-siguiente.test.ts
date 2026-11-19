// Las páginas de «hoy» y «mañana» de cada zona deben pasar por el Worker de la web global para que, desde la
// medianoche del país, sirva la versión del día siguiente (apps/worker-global/src/index.js).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { MERCADOS, urlManana } from "../../apps/global/src/lib/datos";

const toml = readFileSync(new URL("../../apps/worker-global/wrangler.toml", import.meta.url), "utf8");
const lista = JSON.parse(toml.match(/^run_worker_first = (\[.*\])$/m)![1]) as string[];

describe("worker global: hoy y mañana desde medianoche", () => {
  it("run_worker_first incluye la página de hoy y la de mañana de cada zona, y /dia-siguiente/", () => {
    const rutas = MERCADOS.flatMap((m) => [m.ruta, urlManana(m)]);
    expect(lista).toEqual(expect.arrayContaining([...rutas, "/dia-siguiente/*"]));
  });
});

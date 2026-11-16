import { describe, expect, it } from "vitest";
import { alternativas as web } from "../../apps/web/src/lib/hreflang";
import { alternativas as global } from "../../apps/global/src/lib/datos";

const orden = (xs: { lang: string; href: string }[]) => [...xs].sort((a, b) => a.lang.localeCompare(b.lang));

describe("hreflang recíproco entre comparadortarifaluz.es y powerpricenow.com", () => {
  it.each(["hoy", "manana"] as const)("la web española devuelve el mismo grupo que la global (%s)", (pag) => {
    expect(orden(web(pag))).toEqual(orden(global(pag)));
  });
});

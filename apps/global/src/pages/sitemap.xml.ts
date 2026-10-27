// Mapa del sitio de la web global con la fecha de cada página de día.
import type { APIRoute } from "astro";
import { MERCADOS, diasDe, diasConPagina, hoyDe, urlManana, urlFecha, absoluta } from "../lib/datos";
import { PAISES_C, CC, urlPrecios, urlCalefaccion, urlEuropa, urlDestino, destinos, hay } from "../lib/carburantes";
import { ACTUALIZADO } from "../../../web/src/lib/compartido/carburantes-ue";
import { GUIAS, urlGuia, urlGuias } from "../lib/guias";
import { MAPAS, tieneMapas, urlMapa, estaciones } from "../lib/mapa";
import { tieneEnergia, tieneMix, mixDe, meses, urlMix, urlNegativos, urlMeses, urlMes } from "../lib/energia";

export const GET: APIRoute = () => {
  const rutas: [string, string?][] = [["/"], ["/legal/"]];
  for (const m of MERCADOS) {
    const ultimo = diasDe(m.zona.id).filter((d) => d.fecha <= hoyDe(m)).at(-1)?.fecha;
    rutas.push([m.ruta, ultimo], [urlManana(m), diasDe(m.zona.id).at(-1)?.fecha]);
    for (const d of diasConPagina(m)) rutas.push([urlFecha(m, d.fecha), d.fecha]);
    if (!tieneEnergia(m)) continue;
    if (tieneMix(m)) rutas.push([urlMix(m), mixDe(m.zona.id).at(-1)?.fecha]);
    rutas.push([urlNegativos(m), ultimo]);
    const ms = meses(m);
    if (ms.length) rutas.push([urlMeses(m), ultimo], ...ms.map((x): [string, string?] => [urlMes(m, x.mes), x.completo ? undefined : ultimo]));
  }
  for (const p of PAISES_C) {
    rutas.push([urlPrecios(p), ACTUALIZADO], [urlEuropa(p), ACTUALIZADO]);
    if (hay(CC(p), "calefaccion")) rutas.push([urlCalefaccion(p), ACTUALIZADO]);
    for (const d of destinos(p)) rutas.push([urlDestino(p, d), ACTUALIZADO]);
    if (tieneMapas(p)) {
      rutas.push([urlMapa(p), estaciones(MAPAS[0])!.actualizado.slice(0, 10)]);
      for (const cc of MAPAS.filter((x) => x !== CC(p))) rutas.push([urlMapa(p, cc), estaciones(cc)!.actualizado.slice(0, 10)]);
    }
  }
  for (const cc of new Set(GUIAS.map((g) => g.cc))) rutas.push([urlGuias(cc), "2026-10-27"]);
  for (const g of GUIAS) rutas.push([urlGuia(g), "2026-10-27"]);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rutas.map(([r, f]) => `<url><loc>${absoluta(r)}</loc>${f ? `<lastmod>${f}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
};

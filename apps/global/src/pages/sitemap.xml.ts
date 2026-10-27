// Mapa del sitio de la web global con la fecha de cada página de día.
import type { APIRoute } from "astro";
import { MERCADOS, diasDe, hoyDe, urlManana, urlFecha, absoluta } from "../lib/datos";
import { PAISES_C, CC, urlPrecios, urlCalefaccion, urlEuropa, urlDestino, destinos, hay } from "../lib/carburantes";
import { ACTUALIZADO } from "../../../web/src/lib/compartido/carburantes-ue";

export const GET: APIRoute = () => {
  const rutas: [string, string?][] = [["/"], ["/legal/"]];
  for (const m of MERCADOS) {
    const ultimo = diasDe(m.zona.id).filter((d) => d.fecha <= hoyDe(m)).at(-1)?.fecha;
    rutas.push([m.ruta, ultimo], [urlManana(m), diasDe(m.zona.id).at(-1)?.fecha]);
    for (const d of diasDe(m.zona.id)) rutas.push([urlFecha(m, d.fecha), d.fecha]);
  }
  for (const p of PAISES_C) {
    rutas.push([urlPrecios(p), ACTUALIZADO], [urlEuropa(p), ACTUALIZADO]);
    if (hay(CC(p), "calefaccion")) rutas.push([urlCalefaccion(p), ACTUALIZADO]);
    for (const d of destinos(p)) rutas.push([urlDestino(p, d), ACTUALIZADO]);
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rutas.map(([r, f]) => `<url><loc>${absoluta(r)}</loc>${f ? `<lastmod>${f}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
};

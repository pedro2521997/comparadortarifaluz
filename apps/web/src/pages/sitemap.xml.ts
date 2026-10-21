// Mapa del sitio generado en el build con todas las páginas con datos.
import type { APIRoute } from "astro";
import { SITIO } from "../config";
import { dias, aparatos } from "../lib/datos";
import { guias } from "../lib/guias";

export const GET: APIRoute = () => {
  const rutas = [
    "/", "/tarifas/", "/precio-luz-hoy/", "/precio-luz-manana/", "/precio-luz-ayer/", "/precio-luz/", "/comparador/", "/cuanto-gasta/",
    "/placas-solares/", "/guias/", "/como-funciona/", "/aviso-legal/", "/privacidad/", "/cookies/",
    ...dias.map((d) => `/precio-luz/${d.fecha}/`),
    ...aparatos.map((a) => `/cuanto-gasta/${a.slug}/`),
    ...guias.map((g) => `/guias/${g.slug}/`),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rutas.map((r) => `<url><loc>${SITIO.url}${r}</loc></url>`).join("\n")}\n</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
};

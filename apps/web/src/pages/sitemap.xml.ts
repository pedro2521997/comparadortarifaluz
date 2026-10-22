// Mapa del sitio generado en el build con todas las páginas, con fecha de última modificación donde la sabemos.
import type { APIRoute } from "astro";
import { SITIO } from "../config";
import { dias, aparatos, catalogoActualizado } from "../lib/datos";
import { guias } from "../lib/guias";
import { hoyMadrid } from "../lib/formato";

export const GET: APIRoute = () => {
  const hoy = hoyMadrid();
  const ultimoDia = dias.filter((d) => d.fecha <= hoy).at(-1)?.fecha ?? hoy;
  const ultimaGuia = guias.map((g) => g.revisado).sort().at(-1);
  const catalogo = catalogoActualizado.slice(0, 10);
  // [ruta, última modificación]
  const rutas: [string, string?][] = [
    ["/", ultimoDia], ["/precio-luz-hoy/", ultimoDia], ["/precio-luz-manana/", dias.at(-1)?.fecha], ["/precio-luz-ayer/", ultimoDia], ["/precio-luz/", ultimoDia], ["/precio-luz/historico/", ultimoDia],
    ["/tarifas/", catalogo], ["/comparador/", catalogo], ["/calcular-factura-luz/"], ["/analizador-consumo/"], ["/cuanto-gasta/", ultimoDia],
    ["/placas-solares/"], ["/herramientas/"], ["/herramientas/potencia/"], ["/herramientas/coche-electrico/"], ["/herramientas/distribuidora/"],
    ["/guias/", ultimaGuia], ["/como-funciona/"], ["/aviso-legal/"], ["/condiciones-de-uso/"], ["/privacidad/"], ["/cookies/"],
    ...dias.map((d): [string, string] => [`/precio-luz/${d.fecha}/`, d.fecha]),
    ...aparatos.map((a): [string, string] => [`/cuanto-gasta/${a.slug}/`, ultimoDia]),
    ...guias.map((g): [string, string] => [`/guias/${g.slug}/`, g.revisado]),
  ];
  const url = ([r, f]: [string, string?]) => `<url><loc>${SITIO.url}${r}</loc>${f ? `<lastmod>${f}</lastmod>` : ""}</url>`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rutas.map(url).join("\n")}\n</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
};

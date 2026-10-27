// Mapa del sitio generado en el build con todas las páginas, con fecha de última modificación donde la sabemos.
import type { APIRoute } from "astro";
import { SITIO } from "../config";
import { dias, aparatos, catalogoActualizado } from "../lib/datos";
import { guias } from "../lib/guias";
import { HERRAMIENTAS } from "../lib/herramientas";
import { marcas, urlTarifa, urlMarca } from "../lib/catalogo";
import { tarifas } from "../lib/datos";
import { hoyMadrid } from "../lib/formato";
import { HAY_GASOLINERAS, FECHA as FECHA_GASOLINERAS, PROVINCIAS as PROVINCIAS_GAS, MUNICIPIOS, urlProvincia, urlMunicipio } from "../lib/gasolineras";
import { PAISES_UE, nombrePais, ACTUALIZADO as ACTUALIZADO_UE } from "../lib/compartido/carburantes-ue";
import { slug as slugTexto } from "../lib/ranking";

export const GET: APIRoute = () => {
  const hoy = hoyMadrid();
  const ultimoDia = dias.filter((d) => d.fecha <= hoy).at(-1)?.fecha ?? hoy;
  const ultimaGuia = guias.map((g) => g.revisado).sort().at(-1);
  const catalogo = catalogoActualizado.slice(0, 10);
  // [ruta, última modificación]
  const rutas: [string, string?][] = [
    ["/", ultimoDia], ["/precio-luz-hoy/", ultimoDia], ["/precio-luz-manana/", dias.at(-1)?.fecha], ["/precio-luz/", ultimoDia], ["/precio-luz/historico/", ultimoDia],
    ["/tarifas/", catalogo], ["/comparador/", catalogo], ["/cuanto-gasta/", ultimoDia],
    ["/herramientas/"], ["/precio-luz-ayer/", dias.filter((d) => d.fecha < hoy).at(-1)?.fecha],
    ...HERRAMIENTAS.filter((h) => !["/", "/precio-luz-hoy/", "/precio-luz-manana/", "/precio-luz/historico/", "/tarifas/", "/comparador/", "/cuanto-gasta/"].includes(h.href)).map((h): [string, string?] => [h.href, h.href.includes("gasol") || h.href.includes("glp") || h.href.includes("carburantes") ? (h.href.includes("europa") || h.href.includes("calefaccion") ? ACTUALIZADO_UE : FECHA_GASOLINERAS || undefined) : undefined]),
    ["/guias/", ultimaGuia], ["/como-funciona/"], ["/contacto/"], ["/aviso-legal/"], ["/condiciones-de-uso/"], ["/privacidad/"], ["/cookies/"],
    ...dias.map((d): [string, string] => [`/precio-luz/${d.fecha}/`, d.fecha]),
    ...aparatos.map((a): [string, string] => [`/cuanto-gasta/${a.slug}/`, ultimoDia]),
    ...guias.map((g): [string, string] => [`/guias/${g.slug}/`, g.revisado]),
    ...marcas().map((m): [string, string] => [urlMarca(m.marca), catalogo]),
    ...tarifas.filter((t) => t.tipo !== "pvpc").map((t): [string, string] => [urlTarifa(t), t.fecha_comprobacion ?? catalogo]),
    ...(HAY_GASOLINERAS
      ? [
          ...PROVINCIAS_GAS.map((p): [string, string] => [urlProvincia(p), FECHA_GASOLINERAS]),
          ...MUNICIPIOS.map((m): [string, string] => [urlMunicipio(m), FECHA_GASOLINERAS]),
        ]
      : []),
    ...PAISES_UE.filter((cc) => cc !== "ES").map((cc): [string, string] => [`/carburantes-europa/${slugTexto(nombrePais(cc, "es"))}/`, ACTUALIZADO_UE]),
  ];
  const url = ([r, f]: [string, string?]) => `<url><loc>${SITIO.url}${r}</loc>${f ? `<lastmod>${f}</lastmod>` : ""}</url>`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rutas.map(url).join("\n")}\n</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
};

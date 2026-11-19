// Páginas de la web global para los sitemaps, en grupos (un sitemap por grupo y un índice en /sitemap.xml):
// así Search Console dice por separado cuántas páginas de cada tipo tiene indexadas.
import { MERCADOS, diasDe, diasConPagina, diaIndexable, zonaIndexable, detalleIndexable, mesIndexable, hoyDe, urlManana, urlFecha, absoluta } from "./datos";
import { PAISES_C, CC, urlPrecios, urlCalefaccion, urlEuropa, urlDestino, destinos, hay } from "./carburantes";
import { ACTUALIZADO } from "../../../web/src/lib/compartido/carburantes-ue";
import { GUIAS, urlGuia, urlGuias } from "./guias";
import { MAPAS, tieneMapas, urlMapa, estaciones } from "./mapa";
import { HAY_GASOLINERAS, FECHA as FECHA_ES, PROVINCIAS, MUNICIPIOS, ESTACIONES, urlProvincia, urlMunicipio, urlEstacion, tieneFicha, gemelaPrincipal } from "./gasolineras";
import { tieneEnergia, tieneMix, mixDe, meses, urlMix, urlNegativos, urlMeses, urlMes } from "./energia";
import { PAISES_Z, zonas, urlZonas, urlRegion, urlCiudad } from "./zonas";

type Ruta = [string, string?];
export const GRUPOS = ["web", "gasolineras", "fichas"] as const;
export type Grupo = (typeof GRUPOS)[number];

export function rutasSitemap(): Record<Grupo, Ruta[]> {
  const rutas: Ruta[] = [["/"], ["/legal/"], ["/about/"], ["/contact/"], ["/es/quienes-somos/"], ["/es/contacto/"]];
  // Gasolineras baratas por región y ciudad (España, Francia, Portugal) y fichas de cada gasolinera de España.
  const zonasR: Ruta[] = [];
  const fichas: Ruta[] = [];
  for (const m of MERCADOS) {
    const ultimo = diasDe(m.zona.id).filter((d) => d.fecha <= hoyDe(m)).at(-1)?.fecha;
    // Solo lo indexable (el resto lleva noindex): ver zonaIndexable, diaIndexable, detalleIndexable y mesIndexable.
    if (!zonaIndexable(m)) continue;
    rutas.push([m.ruta, ultimo], [urlManana(m), diasDe(m.zona.id).at(-1)?.fecha]);
    // Solo los días que se dejan indexar (los demás llevan noindex o su canónica es «hoy»/«mañana»).
    for (const d of diasConPagina(m)) if (diaIndexable(m, d.fecha)) rutas.push([urlFecha(m, d.fecha), d.fecha]);
    if (!tieneEnergia(m) || !detalleIndexable(m)) continue;
    if (tieneMix(m)) rutas.push([urlMix(m), mixDe(m.zona.id).at(-1)?.fecha]);
    rutas.push([urlNegativos(m), ultimo]);
    const ms = meses(m);
    if (ms.length) rutas.push([urlMeses(m), ultimo], ...ms.filter((x) => mesIndexable(m, x.mes)).map((x): [string, string?] => [urlMes(m, x.mes), x.completo ? undefined : ultimo]));
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
  // España (en español): portada y páginas con cada gasolinera, que vienen de la web española.
  rutas.push(["/es/", FECHA_ES || undefined]);
  if (HAY_GASOLINERAS) {
    rutas.push(["/es/precio-gasoil-hoy/", FECHA_ES], ["/es/precio-glp-hoy/", FECHA_ES]);
    zonasR.push(["/es/gasolineras-baratas/", FECHA_ES]);
    for (const p of PROVINCIAS) zonasR.push([urlProvincia(p), FECHA_ES]);
    for (const m of MUNICIPIOS) zonasR.push([urlMunicipio(m), FECHA_ES]);
    for (const e of ESTACIONES) if (tieneFicha(e) && !gemelaPrincipal(e)) fichas.push([urlEstacion(e), FECHA_ES]);
  }
  for (const cc of PAISES_Z) {
    const z = zonas(cc);
    const f = z.actualizado.slice(0, 10);
    zonasR.push([urlZonas(z), f], ...z.regiones.map((r): Ruta => [urlRegion(z, r), f]), ...z.ciudades.map((c): Ruta => [urlCiudad(z, c), f]));
  }
  for (const cc of new Set(GUIAS.map((g) => g.cc))) rutas.push([urlGuias(cc), "2026-10-27"]);
  for (const g of GUIAS) rutas.push([urlGuia(g), "2026-10-27"]);
  return { web: rutas, gasolineras: zonasR, fichas };
}

/** Fecha más reciente de un grupo (para el índice). */
export const ultimaFecha = (rs: Ruta[]) => rs.reduce((a, [, f]) => (f && f > a ? f : a), "");

export const xmlUrls = (rs: Ruta[]) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rs.map(([r, f]) => `<url><loc>${absoluta(r)}</loc>${f ? `<lastmod>${f}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>`;

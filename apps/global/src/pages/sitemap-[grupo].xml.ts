// Cada sitemap del índice (/sitemap-web.xml, /sitemap-gasolineras.xml, /sitemap-fichas.xml).
import type { APIRoute } from "astro";
import { GRUPOS, rutasSitemap, xmlUrls, type Grupo } from "../lib/sitemap";

export const getStaticPaths = () => {
  const r = rutasSitemap();
  return GRUPOS.filter((g) => r[g].length).map((grupo) => ({ params: { grupo }, props: { rutas: r[grupo] } }));
};

export const GET: APIRoute = ({ props }) => new Response(xmlUrls(props.rutas as ReturnType<typeof rutasSitemap>[Grupo]), { headers: { "Content-Type": "application/xml" } });

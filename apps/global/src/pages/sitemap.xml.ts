// Índice de sitemaps de la web global: uno por grupo de páginas (lib/sitemap.ts).
import type { APIRoute } from "astro";
import { absoluta } from "../lib/datos";
import { GRUPOS, rutasSitemap, ultimaFecha } from "../lib/sitemap";

export const GET: APIRoute = () => {
  const r = rutasSitemap();
  const sitemaps = GRUPOS.filter((g) => r[g].length).map((g) => `<sitemap><loc>${absoluta(`/sitemap-${g}.xml`)}</loc>${ultimaFecha(r[g]) ? `<lastmod>${ultimaFecha(r[g])}</lastmod>` : ""}</sitemap>`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps.join("\n")}\n</sitemapindex>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
};

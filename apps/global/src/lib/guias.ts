// Guías de la web global (src/guias/<idioma>/<slug>.md). Cada guía tiene «clave», común a sus traducciones,
// para enlazarlas entre sí con hreflang. Van en /<país>/guide/<slug>/.

import type { MarkdownInstance } from "astro";
import type { Idioma } from "./textos";
import { PAISES } from "./datos";
import { SITIO } from "../config";

interface Frontmatter { titulo: string; resumen: string; clave: string; lang: Idioma; cc: string; orden: number }
export interface Guia extends Frontmatter { slug: string; md: MarkdownInstance<Frontmatter> }

const ficheros = import.meta.glob<MarkdownInstance<Frontmatter>>("../guias/*/*.md", { eager: true });

export const GUIAS: Guia[] = Object.entries(ficheros)
  .map(([ruta, md]) => ({ ...md.frontmatter, lang: String(md.frontmatter.lang) as Idioma, cc: String(md.frontmatter.cc), slug: ruta.split("/").at(-1)!.replace(/\.md$/, ""), md }))
  .sort((a, b) => a.orden - b.orden);

export const urlGuia = (g: Guia) => `/${g.cc}/guide/${g.slug}/`;
export const urlGuias = (cc: string) => `/${cc}/guide/`;

/** Guías en el idioma de un país (Austria ve las alemanas y Bélgica las neerlandesas). */
export const guiasDe = (lang: Idioma) => GUIAS.filter((g) => g.lang === lang);

export const traducciones = (g: Guia) =>
  GUIAS.filter((x) => x.clave === g.clave).map((x) => ({ lang: PAISES.find((p) => p.cc === x.cc)?.locale ?? x.lang, href: new URL(urlGuia(x), SITIO.url).href }));

export const TITULO_GUIAS: Record<Idioma, string> = {
  no: "Guider og tips",
  sv: "Guider och tips",
  da: "Guider og tips",
  fi: "Oppaat ja vinkit",
  de: "Ratgeber und Tipps",
  pt: "Guias e dicas",
  fr: "Guides et conseils",
  it: "Guide e consigli",
  nl: "Gidsen en tips",
  en: "Guides",
};

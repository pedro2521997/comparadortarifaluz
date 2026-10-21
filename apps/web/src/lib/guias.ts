// Guías en Markdown (src/guias/*.md). Reglas: fecha de revisión visible, fuentes oficiales
// y siempre una herramienta o una decisión al final.

import type { MarkdownInstance } from "astro";

export interface Frontmatter {
  titulo: string;
  resumen: string;
  revisado: string;
  orden: number;
  herramienta: { href: string; texto: string };
  fuentes: { nombre: string; url: string }[];
  howto?: boolean;
}

const ficheros = import.meta.glob<MarkdownInstance<Frontmatter>>("../guias/*.md", { eager: true });

export const guias = Object.entries(ficheros)
  .map(([ruta, md]) => ({ slug: ruta.split("/").pop()!.replace(/\.md$/, ""), ...md.frontmatter, md }))
  .sort((a, b) => a.orden - b.orden);

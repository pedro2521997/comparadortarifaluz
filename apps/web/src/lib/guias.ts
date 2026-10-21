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
  /** Preguntas en ### con la respuesta debajo → datos estructurados FAQPage */
  faq?: boolean;
}

const ficheros = import.meta.glob<MarkdownInstance<Frontmatter>>("../guias/*.md", { eager: true });

export const guias = Object.entries(ficheros)
  .map(([ruta, md]) => ({ slug: ruta.split("/").pop()!.replace(/\.md$/, ""), ...md.frontmatter, md }))
  .sort((a, b) => a.orden - b.orden);

/** Pares pregunta/respuesta de una guía con `faq: true` (### Pregunta + párrafo). */
export function preguntas(md: MarkdownInstance<Frontmatter>): { q: string; a: string }[] {
  return md
    .rawContent()
    .split(/^### /m)
    .slice(1)
    .map((bloque) => {
      const [q, ...resto] = bloque.split("\n");
      const a = resto
        .join(" ")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // enlaces markdown → texto
        .replace(/[*_]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      return { q: q.trim(), a };
    });
}

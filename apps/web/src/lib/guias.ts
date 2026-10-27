// Guías en Markdown (src/guias/*.md). Reglas: fecha de revisión visible, fuentes oficiales,
// una respuesta corta al principio (la que citan Google y los buscadores con IA) y siempre
// una herramienta o una decisión al final.

import type { MarkdownInstance } from "astro";

export const CATEGORIAS = [
  "Tu factura",
  "Tarifas y compañías",
  "Tu consumo y el fichero",
  "Ahorrar luz",
  "Precio y mercado",
  "Placas solares y baterías",
  "Coche eléctrico",
  "Hogar y aparatos",
  "Contratos y trámites",
  "Gas y otros",
  "Gasolina y diésel",
] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export interface Frontmatter {
  titulo: string;
  /** Título para Google cuando el titular es largo (máx. ~65 caracteres); si no, se usa `titulo` */
  titulo_seo?: string;
  resumen: string;
  /** Respuesta directa en 1–3 frases (GEO): se muestra arriba en «En pocas palabras» */
  respuesta?: string;
  revisado: string;
  publicado?: string;
  orden: number;
  categoria?: Categoria;
  herramienta: { href: string; texto: string };
  fuentes: { nombre: string; url: string }[];
  howto?: boolean;
  /** true: preguntas en ### dentro del texto. Lista: preguntas propias al final de la guía. */
  faq?: boolean | { p: string; r: string }[];
}

const ficheros = import.meta.glob<MarkdownInstance<Frontmatter>>("../guias/*.md", { eager: true });

export const guias = Object.entries(ficheros)
  .map(([ruta, md]) => ({ slug: ruta.split("/").pop()!.replace(/\.md$/, ""), ...md.frontmatter, md }))
  .sort((a, b) => a.orden - b.orden);

export type Guia = (typeof guias)[number];

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

/** Todas las preguntas de una guía (las del texto o las del frontmatter). */
export function preguntasDe(g: Guia): { q: string; a: string }[] {
  if (Array.isArray(g.faq)) return g.faq.map((x) => ({ q: x.p, a: x.r }));
  if (g.faq === true) return preguntas(g.md);
  return [];
}

/** Guías relacionadas: misma categoría primero y luego por orden. */
export function relacionadas(g: Guia, n = 3): Guia[] {
  const otras = guias.filter((x) => x.slug !== g.slug);
  return [...otras.filter((x) => x.categoria && x.categoria === g.categoria), ...otras.filter((x) => x.categoria !== g.categoria)].slice(0, n);
}

/**
 * Inserta huecos de anuncio en el HTML de una guía: después del 2.º apartado (h2) y luego cada 3,
 * nunca pegados al final. Solo en guías con 4 apartados o más.
 */
export function conAnuncios(html: string, anuncio: string): string {
  if (!anuncio) return html;
  const partes = html.split(/(?=<h2[\s>])/);
  const nH2 = partes.length - 1;
  if (nH2 < 3) return html;
  // Uno cada dos apartados desde el segundo, nunca antes del último, y solo si hay bastante texto desde el
  // anuncio anterior y hasta el final (debajo de la guía viene otro): ningún anuncio queda pegado a otro.
  const texto = (h: string) => h.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").length;
  const largos = partes.map(texto);
  let desdeAnterior = 0;
  return partes
    .map((p, i) => {
      const restante = largos.slice(i).reduce((a, b) => a + b, 0);
      const poner = i >= 2 && (i - 2) % 2 === 0 && i < nH2 && desdeAnterior >= 600 && restante >= 600;
      desdeAnterior = (poner ? 0 : desdeAnterior) + largos[i];
      return poner ? anuncio + p : p;
    })
    .join("");
}

/** Minutos de lectura (unas 200 palabras por minuto). */
export function minutosLectura(md: MarkdownInstance<Frontmatter>): number {
  return Math.max(2, Math.round(md.rawContent().split(/\s+/).length / 200));
}

// Revisa la web construida (apps/web/dist): longitud del título y de la meta descripción de cada página.
// Bing y Google cortan la descripción a ~160 caracteres y avisan si baja de 25; el título, a ~60.
// Uso: npm run build && node scripts/auditar-seo.mjs   (sale con error si alguna descripción se pasa)

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST = new URL("../apps/web/dist", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const entidades = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const largo = (s) => [...s].length;

const paginas = [];
(function recorrer(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) recorrer(p);
    else if (f.endsWith(".html")) {
      const html = readFileSync(p, "utf8");
      const ruta = "/" + p.slice(DIST.length + 1).replace(/\\/g, "/").replace(/index\.html$/, "");
      const desc = entidades(/<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? "");
      const titulo = entidades(/<title>([^<]*)<\/title>/.exec(html)?.[1] ?? "");
      paginas.push({ ruta, desc: largo(desc), titulo: largo(titulo), textoDesc: desc });
    }
  }
})(DIST);

// Agrupa las páginas que salen de una misma plantilla para no listar cientos de fechas.
const plantilla = (r) => r.replace(/\/precio-luz\/\d{4}-\d{2}-\d{2}\//, "/precio-luz/[fecha]/").replace(/^\/cuanto-gasta\/[^/]+\/$/, "/cuanto-gasta/[aparato]/");
const malas = paginas.filter((p) => p.desc > 160 || p.desc < 25);
const grupos = new Map();
for (const p of malas) {
  const k = plantilla(p.ruta);
  const g = grupos.get(k) ?? { n: 0, max: 0, min: Infinity, ejemplo: p };
  g.n++;
  g.max = Math.max(g.max, p.desc);
  g.min = Math.min(g.min, p.desc);
  grupos.set(k, g);
}
console.log(`${paginas.length} páginas · ${malas.length} con la descripción fuera de 25–160 caracteres`);
for (const [k, g] of [...grupos].sort((a, b) => b[1].max - a[1].max)) console.log(`  ${g.min === g.max ? g.max : `${g.min}–${g.max}`} car. · ${k}${g.n > 1 ? ` (${g.n} páginas)` : ""}`);
const titulos = paginas.filter((p) => p.titulo > 70);
if (titulos.length) console.log(`${titulos.length} títulos de más de 70 caracteres (Google los recorta):`, titulos.slice(0, 10).map((p) => `${p.titulo} ${p.ruta}`));
// Enlaces internos rotos: cada href="/..." tiene que corresponder a una página construida.
const rutas = new Set(paginas.map((p) => p.ruta));
const ESTATICO = /\.(xml|txt|svg|png|webp|jpe?g|ico|pdf|js|css|json|woff2?|mjs|webmanifest)$/;
const rotos = new Map();
for (const p of paginas) {
  const html = readFileSync(join(DIST, p.ruta.slice(1), p.ruta.endsWith("/") ? "index.html" : ""), "utf8");
  for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
    let u = m[1];
    if (u.includes("${") || ESTATICO.test(u) || u.startsWith("/_astro/") || u.startsWith("/logos/") || u.startsWith("/api/")) continue;
    if (!u.endsWith("/")) u += "/";
    if (!rutas.has(u)) rotos.set(u, [...(rotos.get(u) ?? []), p.ruta]);
  }
}
console.log(`${rotos.size} enlaces internos rotos`);
for (const [u, desde] of rotos) console.log(`  ${u}  ← ${desde.slice(0, 3).join(", ")}${desde.length > 3 ? ` y ${desde.length - 3} más` : ""}`);
process.exitCode = malas.length || rotos.size ? 1 : 0;

// llms.txt: resumen del sitio para asistentes de IA (https://llmstxt.org). Se genera en el build.
import type { APIRoute } from "astro";
import { SITIO } from "../config";
import { guias, CATEGORIAS } from "../lib/guias";
import { catalogoActualizado } from "../lib/datos";
import { HERRAMIENTAS } from "../lib/herramientas";

// Las herramientas salen de la lista común (lib/herramientas.ts).
const LISTA = HERRAMIENTAS.map((h): [string, string, string] => [h.t, h.href, h.d]);

export const GET: APIRoute = () => {
  const u = (r: string) => `${SITIO.url}${r}`;
  const partes = [
    `# ${SITIO.nombre}`,
    "",
    `> ${SITIO.descripcion}`,
    "",
    "Web independiente sobre la factura de la luz en España (tarifa 2.0TD, hogares). Los cálculos se hacen en el navegador del usuario y su fichero de consumos no se envía a ningún servidor. El comparador ordena solo por precio: si una tarifa paga comisión, se indica, pero no cambia su posición.",
    "",
    `Datos: precios PVPC y de mercado de Red Eléctrica (REData) y OMIE; catálogo de tarifas del comparador de la CNMC y de las webs de las comercializadoras (actualizado el ${catalogoActualizado.slice(0, 10)}); valores regulados del BOE. Al citar, enlaza la página concreta: cada una lleva su fecha de revisión y sus fuentes.`,
    "",
    "## Herramientas",
    "",
    ...LISTA.map(([t, r, d]) => `- [${t}](${u(r)}): ${d}`),
    "",
    ...CATEGORIAS.flatMap((c) => {
      const lista = guias.filter((g) => (g.categoria ?? "Tu factura") === c);
      return lista.length ? [`## Guías: ${c}`, "", ...lista.map((g) => `- [${g.titulo}](${u(`/guias/${g.slug}/`)}): ${g.respuesta ?? g.resumen}`), ""] : [];
    }),
    "## Opcional",
    "",
    `- [Cómo funciona y cómo nos financiamos](${u("/como-funciona/")})`,
    `- [Precio de la luz por días](${u("/precio-luz/")})`,
    "",
  ];
  return new Response(partes.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};

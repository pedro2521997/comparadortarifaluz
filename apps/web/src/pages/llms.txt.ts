// llms.txt: resumen del sitio para asistentes de IA (https://llmstxt.org). Se genera en el build.
import type { APIRoute } from "astro";
import { SITIO } from "../config";
import { guias, CATEGORIAS } from "../lib/guias";
import { tarifas, catalogoActualizado } from "../lib/datos";

const HERRAMIENTAS: [string, string, string][] = [
  ["Comparador de tarifas de luz", "/comparador/", "Calcula la factura de cada tarifa del mercado con el consumo del usuario (fichero horario, factura o lo que paga al mes) y las ordena solo por precio."],
  ["Ranking de tarifas", "/tarifas/", `Las ${tarifas.length} tarifas del catálogo (CNMC y comercializadoras) ordenadas por coste anual para un hogar tipo, con todos sus precios.`],
  ["Precio de la luz hoy", "/precio-luz-hoy/", "PVPC hora a hora de hoy, con las horas más baratas y más caras."],
  ["Precio de la luz mañana", "/precio-luz-manana/", "PVPC de mañana en cuanto lo publica Red Eléctrica (hacia las 20:30)."],
  ["Histórico del precio de la luz", "/precio-luz/historico/", "PVPC y mercado mayorista mes a mes desde 2021, y cambios de peajes e impuestos."],
  ["Simulador de factura de luz", "/calcular-factura-luz/", "Calcula una factura completa (potencia, energía, bono social, impuesto eléctrico, contador e IVA) con los kWh de la factura o con el fichero de consumos."],
  ["Analizador de consumo", "/analizador-consumo/", "Gráficas del consumo horario, consumo fantasma y picos a partir del fichero de la distribuidora."],
  ["Cuánto gasta cada aparato", "/cuanto-gasta/", "Coste al mes de cada electrodoméstico con el precio de hoy."],
  ["Calculadora de placas solares", "/placas-solares/", "Producción con PVGIS, autoconsumo, excedentes, batería opcional y amortización en dos escenarios."],
  ["Calculadora de potencia", "/herramientas/potencia/", "Potencia recomendada (P1 y P2) según los aparatos que se usan a la vez."],
  ["Coste de cargar el coche eléctrico", "/herramientas/coche-electrico/", "Coste al mes y al año de cargar en casa y fuera, frente a gasolina o diésel."],
  ["Distribuidora por CUPS", "/herramientas/distribuidora/", "Identifica la distribuidora eléctrica a partir del CUPS y comprueba sus letras de control."],
];

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
    ...HERRAMIENTAS.map(([t, r, d]) => `- [${t}](${u(r)}): ${d}`),
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

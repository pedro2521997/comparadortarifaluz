// /datos/mercado/AAAA-MM.json: OMIE horario de cada día y coste de ajustes del mes (tarifas indexadas).
import type { APIRoute, GetStaticPaths } from "astro";
import { dias, ajustesMercado } from "../../../lib/datos";

export const getStaticPaths = (() => {
  const meses = [...new Set(dias.map((d) => d.fecha.slice(0, 7)))];
  return meses.map((mes) => ({ params: { mes } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => {
  const mes = params.mes!;
  const spot = Object.fromEntries(dias.filter((d) => d.fecha.startsWith(mes) && d.spot).map((d) => [d.fecha, d.spot]));
  const cuerpo = { spot, ajuste: ajustesMercado[mes] ?? null };
  return new Response(JSON.stringify(cuerpo), { headers: { "Content-Type": "application/json" } });
};

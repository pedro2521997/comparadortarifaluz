// /datos/pvpc/AAAA-MM.json: precios PVPC de un mes para el comparador y el refresco en el navegador.
import type { APIRoute, GetStaticPaths } from "astro";
import { dias } from "../../../lib/datos";

export const getStaticPaths = (() => {
  const meses = [...new Set(dias.map((d) => d.fecha.slice(0, 7)))];
  return meses.map((mes) => ({ params: { mes } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => {
  const datos = Object.fromEntries(dias.filter((d) => d.fecha.startsWith(params.mes!)).map((d) => [d.fecha, d.precios]));
  return new Response(JSON.stringify(datos), { headers: { "Content-Type": "application/json" } });
};

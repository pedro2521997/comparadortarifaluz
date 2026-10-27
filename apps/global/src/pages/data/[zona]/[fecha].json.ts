// Precios de cada día en JSON (los usa la página de hoy/mañana en el navegador cuando cambia el día).
import type { APIRoute } from "astro";
import { MERCADOS, diasDe, type Dia } from "../../../lib/datos";

export function getStaticPaths() {
  return MERCADOS.flatMap((m) => diasDe(m.zona.id).map((d) => ({ params: { zona: m.zona.id, fecha: d.fecha }, props: { d } })));
}

export const GET: APIRoute = ({ props }) => {
  const d = props.d as Dia;
  return new Response(JSON.stringify({ fecha: d.fecha, zona: d.zona, precios: d.precios }), { headers: { "Content-Type": "application/json" } });
};

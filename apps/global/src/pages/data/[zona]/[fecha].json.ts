// Precios de cada día en JSON (los usa la página de hoy/mañana en el navegador cuando cambia el día).
import type { APIRoute } from "astro";
import { MERCADOS, diasDe, hoyDe, type Dia } from "../../../lib/datos";
import { sumarDias } from "../../../lib/bloque";

export function getStaticPaths() {
  // Solo hacen falta los días alrededor de hoy (la página de hoy y mañana los pide si cambia el día).
  return MERCADOS.flatMap((m) => diasDe(m.zona.id).filter((d) => d.fecha >= sumarDias(hoyDe(m), -3)).map((d) => ({ params: { zona: m.zona.id, fecha: d.fecha }, props: { d } })));
}

export const GET: APIRoute = ({ props }) => {
  const d = props.d as Dia;
  return new Response(JSON.stringify({ fecha: d.fecha, zona: d.zona, precios: d.precios }), { headers: { "Content-Type": "application/json" } });
};

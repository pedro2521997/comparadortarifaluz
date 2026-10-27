// Gasolineras de cada país con mapa (/data/gasolineras/fr.json…), tal como las deja scripts/estaciones-global.mjs.
import type { APIRoute } from "astro";
import { MAPAS, estaciones } from "../../../lib/mapa";

export const getStaticPaths = () => MAPAS.map((cc) => ({ params: { cc: cc.toLowerCase() }, props: { cc } }));

export const GET: APIRoute = ({ props }) => new Response(JSON.stringify(estaciones(props.cc as string)), { headers: { "Content-Type": "application/json" } });

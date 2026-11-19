// Fecha de las versiones de «día siguiente» que lleva este build (vacío si no hay). El Worker la lee
// para saber si ya le toca servirlas (ver pages/dia-siguiente/[pagina].astro).
import type { APIRoute } from "astro";
import { hoyMadrid, sumarDias } from "../../lib/formato";
import { preciosDe } from "../../lib/datos";

export const GET: APIRoute = () => {
  const manana = sumarDias(hoyMadrid(), 1);
  return new Response(preciosDe(manana) ? manana : "", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};

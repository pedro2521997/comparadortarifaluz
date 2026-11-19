// Qué versiones del día siguiente lleva este build: { "/fr/": { "fecha": "2026-11-20", "tz": "Europe/Paris" }, … }.
// El Worker sirve /dia-siguiente<ruta> en <ruta> cuando en la zona horaria del país ya es «fecha».
import type { APIRoute } from "astro";
import { MERCADOS, diaDe, hoyDe, urlManana } from "../../lib/datos";
import { sumarDias } from "../../lib/bloque";

export const GET: APIRoute = () => {
  const mapa: Record<string, { fecha: string; tz: string }> = {};
  for (const m of MERCADOS) {
    const manana = sumarDias(hoyDe(m), 1);
    if (!diaDe(m.zona.id, manana)) continue;
    mapa[m.ruta] = mapa[urlManana(m)] = { fecha: manana, tz: m.pais.tz };
  }
  return new Response(JSON.stringify(mapa), { headers: { "Content-Type": "application/json" } });
};

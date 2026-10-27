// /ads.txt: declara a Google como vendedor autorizado de los anuncios de la web (lo exige AdSense).
import type { APIRoute } from "astro";
import { cuentaAdsense } from "../lib/anuncios-html.mjs";

// Se publica en cuanto hay un ID de editor real, aunque los anuncios sigan apagados: AdSense lo revisa antes de aprobar.
export const GET: APIRoute = () => {
  const cuenta = cuentaAdsense();
  const pub = cuenta?.replace(/^ca-/, "");
  const cuerpo = cuenta
    ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`
    : `# Publicidad aún no activa. Al activar AdSense se publicará aquí la línea de Google.\n`;
  return new Response(cuerpo, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};

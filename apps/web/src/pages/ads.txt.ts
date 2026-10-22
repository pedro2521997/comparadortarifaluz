// /ads.txt: declara a Google como vendedor autorizado de los anuncios de la web (lo exige AdSense).
import type { APIRoute } from "astro";
import config from "../anuncios.json";

export const GET: APIRoute = () => {
  const pub = config.cliente.replace(/^ca-/, "");
  const cuerpo = config.activo
    ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`
    : `# Publicidad aún no activa. Al activar AdSense se publicará aquí la línea de Google.\n`;
  return new Response(cuerpo, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};

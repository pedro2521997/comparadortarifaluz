// Solo se ejecuta cuando la petición no coincide con ningún fichero de la web estática.
// Los días con más de DIAS_PAGINA (apps/global/src/lib/datos.ts) pierden su página: en vez de un 404,
// se redirigen a la página de su mercado (/se/2026-09-03/ → /se/, /it/sud/2026-09-01/ → /it/sud/).
const DIA_CADUCADO = /^(\/[a-z]{2}\/(?:[a-z0-9-]+\/)?)\d{4}-\d{2}-\d{2}\/?$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const m = url.pathname.match(DIA_CADUCADO);
    if (m) {
      const destino = new URL(m[1], url);
      const existe = await env.ASSETS.fetch(new Request(destino, { method: "HEAD" }));
      if (existe.ok) return Response.redirect(destino.href, 301);
    }
    return env.ASSETS.fetch(request);
  },
};

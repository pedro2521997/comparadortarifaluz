// Se ejecuta cuando la petición no coincide con ningún fichero de la web estática y, antes que los ficheros, en las
// páginas de «hoy» y «mañana» de cada zona (run_worker_first en wrangler.toml).
//
// Hoy y mañana desde medianoche: el build deja en /dia-siguiente/ esas páginas tal como serán al día siguiente y
// en /dia-siguiente/mapa.json la fecha y la zona horaria de cada una. Cuando en ese país ya es ese día, se sirve
// esa versión: si no, hasta el build de medianoche (que GitHub lanza con horas de retraso) la página de ayer se
// haría pasar por la de hoy. /dia-siguiente/ no se puede visitar directamente.
// Los días con más de DIAS_PAGINA (apps/global/src/lib/datos.ts) pierden su página: en vez de un 404,
// se redirigen a la página de su mercado (/se/2026-09-03/ → /se/, /it/sud/2026-09-01/ → /it/sud/).
const DIA_CADUCADO = /^(\/[a-z]{2}\/(?:[a-z0-9-]+\/)?)\d{4}-\d{2}-\d{2}\/?$/;

const hoyEn = (tz) => new Intl.DateTimeFormat("sv-SE", { timeZone: tz }).format(new Date());

async function paginaViva(request, url, env) {
  if (url.pathname.startsWith("/dia-siguiente/")) {
    const no = await env.ASSETS.fetch(new Request(new URL("/404.html", url)));
    return new Response(no.body, { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const r = await env.ASSETS.fetch(new Request(new URL("/dia-siguiente/mapa.json", url)));
  if (!r.ok) return null;
  const e = (await r.json())[url.pathname];
  if (!e || hoyEn(e.tz) !== e.fecha) return null;
  const v = await env.ASSETS.fetch(new Request(new URL(`/dia-siguiente${url.pathname}`, url), request));
  return v.ok || v.status === 304 ? v : null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const viva = await paginaViva(request, url, env);
    if (viva) return viva;
    const m = url.pathname.match(DIA_CADUCADO);
    if (m) {
      const destino = new URL(m[1], url);
      const existe = await env.ASSETS.fetch(new Request(destino, { method: "HEAD" }));
      if (existe.ok) return Response.redirect(destino.href, 301);
    }
    return env.ASSETS.fetch(request);
  },
};

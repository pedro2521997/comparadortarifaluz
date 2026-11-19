// Worker de ComparadorTarifaLuz.
//  - Sirve la web estática (binding ASSETS).
//  - Cron: trae el PVPC de mañana (ESIOS si hay token, si no REData), lo guarda en D1 y lo publica en Telegram.
//  - GET  /api/precios/AAAA-MM-DD  precios de un día (404 si aún no se han publicado).
//  - GET  /api/pvgis?…             proxy de PVGIS con caché en D1 por coordenadas redondeadas.
//  - POST /api/contacto            petición de estudio solar con consentimiento → D1 + aviso al instalador.
//  - GET/POST /panel               panel protegido con el estado de cada contacto.

import { mejorFranja, resumen } from "../../web/src/lib/grafico";
import { ekwh, franja, fechaLarga, hoyMadrid, sumarDias } from "../../web/src/lib/formato";

// Tipos mínimos de Cloudflare (sin dependencia de @cloudflare/workers-types).
interface D1Result<T> { results: T[] }
interface D1Stmt {
  bind(...v: unknown[]): D1Stmt;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<unknown>;
}
interface D1 { prepare(sql: string): D1Stmt }
interface Env {
  ASSETS: { fetch(r: Request): Promise<Response> };
  DB: D1;
  ZONA_INSTALADOR: string;
  ESIOS_TOKEN?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CANAL?: string;
  TELEGRAM_AVISOS?: string;
  PANEL_USUARIO?: string;
  PANEL_CLAVE?: string;
}
interface Ctx { waitUntil(p: Promise<unknown>): void }

type Precios = (number | null)[];

const json = (cuerpo: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...extra } });

// ---------------- Precios ----------------

/** Agrupa una serie horaria por fecha local y hora de reloj. Solo devuelve días completos. */
function agrupar(valores: { value: number; datetime: string }[], divisor: number): Record<string, Precios> {
  const acc: Record<string, { s: number; n: number }[]> = {};
  for (const v of valores) {
    const f = v.datetime.slice(0, 10);
    const h = Number(v.datetime.slice(11, 13));
    (acc[f] ??= [])[h] = acc[f][h] ? { s: acc[f][h].s + v.value, n: acc[f][h].n + 1 } : { s: v.value, n: 1 };
  }
  const out: Record<string, Precios> = {};
  for (const [f, horas] of Object.entries(acc)) {
    if (horas.filter(Boolean).length < 23) continue;
    out[f] = Array.from({ length: 24 }, (_, h) => (horas[h] ? Math.round((horas[h].s / horas[h].n / divisor) * 1e5) / 1e5 : null));
  }
  return out;
}

async function deRedata(fecha: string): Promise<Precios | null> {
  const url = `https://apidatos.ree.es/es/datos/mercados/precios-mercados-tiempo-real?start_date=${fecha}T00:00&end_date=${fecha}T23:59&time_trunc=hour`;
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) return null;
  const j = (await r.json()) as { included?: { id: string; type: string; attributes: { values: { value: number; datetime: string }[] } }[] };
  const serie = j.included?.find((i) => i.id === "1001" || i.type === "PVPC");
  return serie ? (agrupar(serie.attributes.values, 1000)[fecha] ?? null) : null;
}

/** ESIOS, indicador 1001 (PVPC 2.0TD), geo_id 8741 = península. Requiere token. */
async function deEsios(fecha: string, token: string): Promise<Precios | null> {
  const url = `https://api.esios.ree.es/indicators/1001?start_date=${fecha}T00:00&end_date=${fecha}T23:59&geo_ids[]=8741`;
  const r = await fetch(url, { headers: { Accept: "application/json; application/vnd.esios-api-v1+json", "x-api-key": token } });
  if (!r.ok) return null;
  const j = (await r.json()) as { indicator?: { values: { value: number; datetime: string }[] } };
  if (!j.indicator) return null;
  // ESIOS devuelve la hora en local con desfase; se normaliza a "AAAA-MM-DDTHH" local.
  const valores = j.indicator.values.map((v) => ({ value: v.value, datetime: v.datetime }));
  return agrupar(valores, 1000)[fecha] ?? null;
}

async function obtenerDia(env: Env, fecha: string): Promise<{ precios: Precios; fuente: string } | null> {
  if (env.ESIOS_TOKEN) {
    const p = await deEsios(fecha, env.ESIOS_TOKEN).catch(() => null);
    if (p) return { precios: p, fuente: "esios" };
  }
  const p = await deRedata(fecha).catch(() => null);
  return p ? { precios: p, fuente: "redata" } : null;
}

async function guardarDia(env: Env, fecha: string, precios: Precios, fuente: string) {
  await env.DB.prepare(
    "INSERT INTO precios (fecha, precios, fuente, descargado) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(fecha) DO UPDATE SET precios = ?2, fuente = ?3, descargado = ?4",
  ).bind(fecha, JSON.stringify(precios), fuente, new Date().toISOString()).run();
}

// ---------------- Telegram ----------------

async function telegram(env: Env, chat: string | undefined, texto: string) {
  if (!env.TELEGRAM_BOT_TOKEN || !chat) return false;
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text: texto, disable_web_page_preview: true }),
  });
  return r.ok;
}

export function mensajeDiario(fecha: string, precios: Precios): string {
  const barata = mejorFranja(precios, 2)!;
  const cara = mejorFranja(precios, 2, true)!;
  const r = resumen(precios);
  return [
    `💡 Precio de la luz para mañana, ${fechaLarga(fecha)}`,
    ``,
    `Mañana, la franja más barata es ${franja(barata.inicio, 2)} (${ekwh(barata.media)}). Evita ${franja(cara.inicio, 2)} (${ekwh(cara.media)}).`,
    `Media del día: ${ekwh(r.media)}. PVPC sin impuestos.`,
    ``,
    `Hora a hora: https://comparadortarifaluz.es/precio-luz-manana/`,
  ].join("\n");
}

// ---------------- Cron ----------------

async function cron(env: Env) {
  const manana = sumarDias(hoyMadrid(), 1);
  const ya = await env.DB.prepare("SELECT publicado_telegram FROM precios WHERE fecha = ?1").bind(manana).first<{ publicado_telegram: number }>();
  if (ya?.publicado_telegram) return;
  const dia = ya ? null : await obtenerDia(env, manana);
  if (!ya && !dia) return; // aún no publicado: se reintenta en el siguiente disparo
  if (dia) await guardarDia(env, manana, dia.precios, dia.fuente);
  const fila = await env.DB.prepare("SELECT precios FROM precios WHERE fecha = ?1").bind(manana).first<{ precios: string }>();
  if (fila && (await telegram(env, env.TELEGRAM_CANAL, mensajeDiario(manana, JSON.parse(fila.precios))))) {
    await env.DB.prepare("UPDATE precios SET publicado_telegram = 1 WHERE fecha = ?1").bind(manana).run();
  }
}

// ---------------- PVGIS ----------------

async function pvgis(url: URL, env: Env): Promise<Response> {
  const num = (k: string, min: number, max: number) => {
    const v = Number(url.searchParams.get(k));
    return Number.isFinite(v) && v >= min && v <= max ? v : null;
  };
  const lat = num("lat", 27, 44.5), lon = num("lon", -18.5, 4.5), angle = num("angle", 0, 60), aspect = num("aspect", -180, 180);
  if (lat === null || lon === null || angle === null || aspect === null) return json({ error: "Parámetros fuera de rango" }, 400);
  const clave = `${lat.toFixed(1)},${lon.toFixed(1)},${angle},${aspect}`;
  const cache = await env.DB.prepare("SELECT datos FROM pvgis_cache WHERE clave = ?1").bind(clave).first<{ datos: string }>();
  if (cache) return new Response(cache.datos, { headers: { "Content-Type": "application/json", "X-Cache": "HIT" } });
  const q = new URLSearchParams({
    lat: lat.toFixed(1), lon: lon.toFixed(1), peakpower: "1", loss: "14", angle: String(angle), aspect: String(aspect),
    startyear: "2023", endyear: "2023", pvcalculation: "1", outputformat: "json",
  });
  const r = await fetch(`https://re.jrc.ec.europa.eu/api/v5_3/seriescalc?${q}`);
  if (!r.ok) return json({ error: "PVGIS no responde" }, 502);
  const j = (await r.json()) as { outputs: { hourly: { time: string; P: number }[] } };
  // Solo lo necesario: hora y potencia (reduce el tamaño ~80 %).
  const datos = JSON.stringify({ outputs: { hourly: j.outputs.hourly.map((h) => ({ time: h.time, P: h.P })) } });
  await env.DB.prepare("INSERT OR REPLACE INTO pvgis_cache (clave, datos, creado) VALUES (?1, ?2, ?3)").bind(clave, datos, new Date().toISOString()).run();
  return new Response(datos, { headers: { "Content-Type": "application/json", "X-Cache": "MISS" } });
}

// ---------------- Contactos ----------------

const CONSENTIMIENTO = {
  estudio: "Acepto que mis datos se envíen al instalador colaborador para que me contacte con un estudio.",
  futuro: "Acepto que ComparadorTarifaLuz guarde mis datos para avisarme cuando haya un instalador en mi zona.",
};

async function contacto(req: Request, env: Env): Promise<Response> {
  let d: Record<string, unknown>;
  try {
    d = await req.json();
  } catch {
    return json({ error: "JSON no válido" }, 400);
  }
  const txt = (k: string, max: number) => (typeof d[k] === "string" ? (d[k] as string).trim().slice(0, max) : "");
  const nombre = txt("nombre", 80), contactoTxt = txt("contacto", 120), cp = txt("cp", 5), resumen = txt("resumen", 600);
  const tipo = d.tipo === "futuro" ? "futuro" : "estudio";
  if (d.consentimiento !== true) return json({ error: "Falta el consentimiento" }, 400);
  if (!nombre || !/^\d{5}$/.test(cp)) return json({ error: "Faltan datos" }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactoTxt) && !/^\+?[\d\s]{9,15}$/.test(contactoTxt)) return json({ error: "Contacto no válido" }, 400);
  const enZona = env.ZONA_INSTALADOR.split(",").some((z) => cp.startsWith(z.trim()));
  if (tipo === "estudio" && !enZona) return json({ error: "Fuera de zona" }, 400);

  const ahora = new Date().toISOString();
  const anio = ahora.slice(0, 4);
  const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM contactos WHERE codigo LIKE ?1").bind(`LST-${anio}-%`).first<{ n: number }>();
  const codigo = `LST-${anio}-${String((n?.n ?? 0) + 1).padStart(4, "0")}`;
  await env.DB.prepare(
    "INSERT INTO contactos (codigo, creado, tipo, nombre, contacto, cp, resumen, consentimiento, actualizado) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?2)",
  ).bind(codigo, ahora, tipo, nombre, contactoTxt, cp, resumen, `${CONSENTIMIENTO[tipo]} (${ahora})`).run();

  if (tipo === "estudio") {
    await telegram(env, env.TELEGRAM_AVISOS, `☀️ Nuevo contacto ${codigo}\n${nombre} · ${contactoTxt} · CP ${cp}\n${resumen}\nPanel: https://comparadortarifaluz.es/panel`);
  }
  return json({ codigo });
}

// ---------------- Panel ----------------

const ESTADOS = ["nuevo", "contactado", "visita", "presupuesto", "firmado", "perdido"];

function autorizado(req: Request, env: Env): boolean {
  if (!env.PANEL_USUARIO || !env.PANEL_CLAVE) return false;
  const h = req.headers.get("Authorization") ?? "";
  return h === `Basic ${btoa(`${env.PANEL_USUARIO}:${env.PANEL_CLAVE}`)}`;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

async function panel(req: Request, env: Env): Promise<Response> {
  if (!autorizado(req, env)) return new Response("Acceso restringido", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Panel ComparadorTarifaLuz"' } });
  if (req.method === "POST") {
    const f = await req.formData();
    const codigo = String(f.get("codigo") ?? "");
    const estado = String(f.get("estado") ?? "");
    const notas = String(f.get("notas") ?? "").slice(0, 1000);
    if (ESTADOS.includes(estado)) {
      await env.DB.prepare("UPDATE contactos SET estado = ?1, notas = ?2, actualizado = ?3 WHERE codigo = ?4").bind(estado, notas, new Date().toISOString(), codigo).run();
    }
    return Response.redirect(new URL("/panel", req.url).toString(), 303);
  }
  const { results } = await env.DB.prepare("SELECT * FROM contactos ORDER BY id DESC LIMIT 500").all<Record<string, string>>();
  const filas = results.map((c) => `<tr><td><strong>${esc(c.codigo)}</strong><br><small>${esc(c.creado.slice(0, 10))} · ${esc(c.tipo)}</small></td>
    <td>${esc(c.nombre)}<br>${esc(c.contacto)}<br>CP ${esc(c.cp)}</td><td><small>${esc(c.resumen)}</small></td>
    <td><form method="post"><input type="hidden" name="codigo" value="${esc(c.codigo)}">
    <select name="estado">${ESTADOS.map((e) => `<option ${e === c.estado ? "selected" : ""}>${e}</option>`).join("")}</select>
    <textarea name="notas" rows="2">${esc(c.notas)}</textarea><button>Guardar</button></form></td></tr>`).join("");
  const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Panel de contactos</title>
  <style>body{font:15px system-ui;margin:24px;color:#101f1e;background:#f3f1ec}table{border-collapse:collapse;width:100%;background:#fff}td{border-bottom:1px solid #afc4bf;padding:8px;vertical-align:top}textarea{width:100%}button{background:#104336;color:#fff;border:0;border-radius:8px;padding:6px 12px}</style>
  <h1>Contactos (${results.length})</h1><table>${filas}</table></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

// ---------------- Hoy, mañana y ayer desde medianoche ----------------
// El build de la tarde deja en /dia-siguiente/ esas tres páginas tal como serán al día siguiente, con la
// fecha en /dia-siguiente/fecha.txt. Cuando en Madrid ya es ese día, se sirven en lugar de las del build,
// que hablarían de ayer como si fuera hoy hasta que llegue el build de medianoche (GitHub lo lanza con
// horas de retraso). /dia-siguiente/ no se puede visitar directamente.

const VIVAS = new Set(["/precio-luz-hoy/", "/precio-luz-manana/", "/precio-luz-ayer/"]);

async function paginaViva(req: Request, url: URL, env: Env): Promise<Response | null> {
  if (url.pathname.startsWith("/dia-siguiente/")) {
    const no = await env.ASSETS.fetch(new Request(new URL("/404.html", url)));
    return new Response(no.body, { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
  if (!VIVAS.has(url.pathname) || (req.method !== "GET" && req.method !== "HEAD")) return null;
  const f = await env.ASSETS.fetch(new Request(new URL("/dia-siguiente/fecha.txt", url)));
  if (!f.ok || (await f.text()).trim() !== hoyMadrid()) return null;
  const r = await env.ASSETS.fetch(new Request(new URL(`/dia-siguiente${url.pathname}`, url), req));
  return r.ok || r.status === 304 ? r : null;
}

// ---------------- Entrada ----------------

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    try {
      const fecha = url.pathname.match(/^\/api\/precios\/(\d{4}-\d{2}-\d{2})\/?$/);
      if (fecha) {
        const fila = await env.DB.prepare("SELECT precios, fuente, descargado FROM precios WHERE fecha = ?1").bind(fecha[1]).first<{ precios: string; fuente: string; descargado: string }>();
        if (!fila) return json({ error: "Aún no publicado" }, 404, { "Cache-Control": "no-store" });
        return json({ fecha: fecha[1], precios: JSON.parse(fila.precios), fuente: fila.fuente, descargado: fila.descargado }, 200, { "Cache-Control": "public, max-age=600" });
      }
      if (url.pathname === "/api/pvgis") return await pvgis(url, env);
      if (url.pathname === "/api/contacto" && req.method === "POST") return await contacto(req, env);
      if (url.pathname.startsWith("/panel")) return await panel(req, env);
      if (url.pathname.startsWith("/api/")) return json({ error: "No encontrado" }, 404);
      const viva = await paginaViva(req, url, env);
      if (viva) return viva;
    } catch (e) {
      return json({ error: "Error interno" }, 500);
    }
    return env.ASSETS.fetch(req);
  },

  async scheduled(_evento: unknown, env: Env, ctx: Ctx) {
    ctx.waitUntil(cron(env));
  },
};

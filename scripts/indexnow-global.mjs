// Avisa a Bing y a los demás buscadores con IndexNow de las páginas de powerpricenow.com que han cambiado hoy
// (las que en los sitemaps tienen la fecha de hoy). Las fichas de cada gasolinera (más de 11.000) solo se mandan
// los domingos, para no avisar cada día de miles de páginas. La clave es pública a propósito: está en
// apps/global/public/<clave>.txt, que es como IndexNow comprueba que la web es nuestra.
//
// Uso: node scripts/indexnow-global.mjs   (después de construir apps/global)

import { readFileSync, readdirSync } from "node:fs";

const HOST = "powerpricenow.com";
const PUBLICO = new URL("../apps/global/public/", import.meta.url);
const clave = readdirSync(PUBLICO).find((f) => /^[0-9a-f]{32}\.txt$/.test(f))?.slice(0, -4);
if (!clave) throw new Error("Falta la clave de IndexNow en apps/global/public");

// /sitemap.xml es el índice; las páginas están en /sitemap-web.xml, /sitemap-gasolineras.xml y /sitemap-fichas.xml.
const DIST = new URL("../apps/global/dist/", import.meta.url);
const sitemap = readdirSync(DIST)
  .filter((f) => /^sitemap-[\w-]+\.xml$/.test(f))
  .map((f) => readFileSync(new URL(f, DIST), "utf8"))
  .join("\n");
const hoy = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
const domingo = new Date().toLocaleDateString("en-GB", { weekday: "short", timeZone: "Europe/Madrid" }) === "Sun";
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?/g)]
  .filter(([, , f]) => f === hoy)
  .map(([, u]) => u)
  .filter((u) => domingo || !u.includes("/es/gasolinera/"));

for (let i = 0; i < urls.length; i += 10000) {
  const r = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: clave, keyLocation: `https://${HOST}/${clave}.txt`, urlList: urls.slice(i, i + 10000) }),
  });
  console.log(`IndexNow (${HOST}): ${Math.min(10000, urls.length - i)} páginas → ${r.status}`);
}
if (!urls.length) console.log("IndexNow: ninguna página con fecha de hoy");

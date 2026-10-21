// Investigación de nombre: autocompletado de Google para frases de búsqueda candidatas y
// comprobación de DNS de dominios .es (sin DNS sugiere libre; solo un registrador lo confirma).
// Uso: node scripts/nombres.mjs  → docs/datos/nombres-AAAA-MM-DD.json
import { resolveAny } from "node:dns/promises";
import { mkdirSync, writeFileSync } from "node:fs";

const FRASES = [
  "comparador luz", "comparador tarifas luz", "comparador de luz", "comparador tarifa luz", "comparador electricidad",
  "comparar tarifas luz", "simulador factura luz", "calcular factura luz", "calculadora luz", "tarifa luz mas barata",
  "mejor tarifa luz", "tarifa luz barata", "luz barata", "ahorrar luz", "precio luz",
];
const DOMINIOS = [
  "comparadortarifaluz.es", "comparadortarifasluz.es", "comparadorluz.es", "comparadordeluz.es", "comparatuluz.es",
  "comparaluz.es", "tarifaluzbarata.es", "mejortarifaluz.es", "latarifamasbarata.es", "tarifamasbarata.es",
  "tuluzmasbarata.es", "luzmasbarata.es", "ahorraenluz.es", "calculaluz.es", "simuladorluz.es",
  "comparadorelectrico.es", "cualtarifaluz.es", "quetarifaluz.es", "luzsintrampa.es", "comparadorluzgratis.es",
  "tarifasdeluz.es", "rankingtarifasluz.es", "rankingluz.es", "comparadorluz.com", "comparadortarifasluz.com",
];

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
async function sugerencias(q) {
  const r = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&hl=es&gl=es&q=${encodeURIComponent(q)}`);
  const buf = Buffer.from(await r.arrayBuffer());
  let t = buf.toString("utf8");
  if (t.includes("�")) t = buf.toString("latin1");
  return JSON.parse(t)[1];
}
async function dns(d) {
  try {
    const r = await resolveAny(d);
    return r.length ? "con DNS (ocupado)" : "sin DNS";
  } catch (e) {
    return e.code === "ENOTFOUND" || e.code === "ENODATA" ? "sin DNS (posible libre)" : `error ${e.code}`;
  }
}

const autocompletado = {};
for (const f of FRASES) {
  autocompletado[f] = await sugerencias(f).catch(() => []);
  await espera(250);
}
const dominios = {};
for (const d of DOMINIOS) dominios[d] = await dns(d);

const hoy = new Date().toISOString().slice(0, 10);
mkdirSync(new URL("../docs/datos/", import.meta.url), { recursive: true });
writeFileSync(new URL(`../docs/datos/nombres-${hoy}.json`, import.meta.url), JSON.stringify({ fecha: hoy, autocompletado, dominios }, null, 1));
for (const [f, s] of Object.entries(autocompletado)) console.log(`\n# ${f}\n  ${s.slice(0, 10).join(" | ")}`);
console.log("\n# Dominios");
for (const [d, e] of Object.entries(dominios)) console.log(`  ${d.padEnd(28)} ${e}`);

// Fase 0: búsquedas reales del autocompletado de Google España para las semillas del plan.
// Guarda docs/datos/autocompletado-AAAA-MM-DD.json y un resumen .md.
// Uso: node scripts/autocompletado.mjs

import { mkdirSync, writeFileSync } from "node:fs";

const SEMILLAS = ["precio luz", "cuánto gasta", "tarifa luz", "placas solares", "factura luz", "potencia contratada", "bono social", "datadis"];
const SUFIJOS = ["", ...("abcdefghijklmnopqrstuvwxyz".split("").map((l) => ` ${l}`))];
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function sugerencias(q) {
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=es&gl=es&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error(`${r.status} ${q}`);
  const buf = Buffer.from(await r.arrayBuffer());
  // La respuesta puede venir en ISO-8859-1.
  let texto = buf.toString("utf8");
  if (texto.includes("�")) texto = buf.toString("latin1");
  return JSON.parse(texto)[1];
}

const hoy = new Date().toISOString().slice(0, 10);
const resultado = {};
for (const s of SEMILLAS) {
  const todas = new Set();
  for (const suf of SUFIJOS) {
    try {
      for (const x of await sugerencias(s + suf)) todas.add(x);
    } catch (e) {
      console.warn(String(e));
    }
    await espera(250);
  }
  resultado[s] = [...todas].sort();
  console.log(`${s}: ${todas.size}`);
}

const dir = new URL("../docs/datos/", import.meta.url);
mkdirSync(dir, { recursive: true });
writeFileSync(new URL(`autocompletado-${hoy}.json`, dir), JSON.stringify({ fecha: hoy, fuente: "Google Suggest, hl=es gl=es", resultado }, null, 1));
const md = [`# Autocompletado de Google España (${hoy})`, "", "Generado con `node scripts/autocompletado.mjs`. Sugerencias únicas por semilla (semilla sola y semilla + cada letra).", ""];
for (const [s, lista] of Object.entries(resultado)) md.push(`## ${s} (${lista.length})`, "", ...lista.map((x) => `- ${x}`), "");
writeFileSync(new URL(`autocompletado-${hoy}.md`, dir), md.join("\n"));

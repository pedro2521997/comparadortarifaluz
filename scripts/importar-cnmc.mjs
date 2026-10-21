// Importa el catálogo de ofertas de luz 2.0TD del comparador oficial de la CNMC (comparador.cnmc.gob.es)
// y genera data/tarifas.json.
//
// Cómo se obtienen los precios: en vez de interpretar el texto libre de cada oferta (cada comercializadora
// lo escribe a su manera), se pide a la CNMC el desglose de cada oferta con tres combinaciones de potencia y
// consumo y se despejan los precios unitarios:
//   A: P1=9 kW, P2=5 kW, 10.000 kWh en P1   → potencia A, energía P1
//   B: P1=5 kW, P2=9 kW, 10.000 kWh en P2   → potencia B, energía P2
//   C: P1=9 kW, P2=5 kW, 10.000 kWh en P3   → energía P3 (y comprobación de potencia)
//   9·p1 + 5·p2 = A ;  5·p1 + 9·p2 = B  →  p1, p2 (€/kW·año)
// Se usa el desglose del SEGUNDO año (sin promociones del primero), que es el precio estable.
// Los precios así obtenidos coinciden con los publicados por cada comercializadora (ver tests).
//
// Uso: node scripts/importar-cnmc.mjs
// API pública no documentada: peticiones en serie, con pausa y reintentos.

import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { servicioObligatorio } from "./servicios.mjs";

const API = "https://comparador.cnmc.gob.es/api/publico";
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const hoy = new Date().toISOString().slice(0, 10);
const BONO_SOCIAL_DIA = 0.024688; // lo que la CNMC suma como "Término fijo" (Orden TED/634/2026)

const BASE = {
  tipoSuministro: "E", codigoPostal: "28001", potencia: 4.6, potenciaPrimeraFranja: 4.6, potenciaSegundaFranja: 4.6,
  potenciaTerceraFranja: 4.6, potenciaCuartaFranja: 4.6, potenciaQuintaFranja: 4.6, potenciaSextaFranja: 4.6,
  consumoAnualE: 3500, consumoPrimeraFranja: 0, consumoSegundaFranja: 0, consumoTerceraFranja: 0, consumoCuartaFranja: 0,
  consumoQuintaFranja: 0, consumoSextaFranja: 0, tarifa: 4, consumoAnualG: 6000, serviciosAdicionales: 2, permanencia: 2,
  vivienda: true, factura: true, energiaAutoconsumo: 0, potenciaAutoconsumo: 4.6, revisionPrecios: 2,
};
const qs = (o) => Object.entries(o).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");

async function get(ruta, params) {
  for (let intento = 1; intento <= 4; intento++) {
    try {
      const r = await fetch(`${API}/${ruta}?${qs(params)}`, { headers: { Accept: "application/json" } });
      if (r.ok) return r.json();
      if (r.status < 500) throw Object.assign(new Error(`${r.status}: ${(await r.text()).slice(0, 200)}`), { definitivo: true });
    } catch (e) {
      if (e.definitivo) throw e;
    }
    await espera(1500 * intento);
  }
  throw new Error(`La CNMC no responde: ${ruta}`);
}

// ---------- 1. Lista de ofertas (todas las variantes de filtros) ----------
const lista = new Map();
for (const permanencia of [1, 2]) for (const serviciosAdicionales of [1, 2]) for (const revisionPrecios of [1, 2]) {
  const j = await get("ofertas/electricidad", { ...BASE, permanencia, serviciosAdicionales, revisionPrecios });
  for (const o of j.resultadoComparador) lista.set(o.id, o);
  await espera(300);
}
console.log(`${lista.size} ofertas en la CNMC`);

// ---------- 2. Desglose de cada oferta y precios unitarios ----------
const desglose = (ficha) => Object.fromEntries((ficha.datosElectricidadSegundoAnio ?? []).map((x) => [x.cabecera, x.valor]));
const consulta = (id, p1, p2, c) =>
  get("oferta", {
    ...BASE, idOferta: id, potencia: p1, potenciaPrimeraFranja: p1, potenciaSegundaFranja: p2,
    consumoPrimeraFranja: c[0], consumoSegundaFranja: c[1], consumoTerceraFranja: c[2], consumoAnualE: c[0] + c[1] + c[2],
  });

const r6 = (n) => Math.round(n * 1e6) / 1e6;
const brutas = [];
const tarifas = [];
const descartadas = [];

for (const o of lista.values()) {
  if (o.tipoElectricidad === "PVPC" || o.tipoElectricidad === "COR") {
    brutas.push({ resumen: o });
    continue; // la PVPC la calculamos hora a hora con los precios de Red Eléctrica
  }
  try {
    const fA = await consulta(o.id, 9, 5, [10000, 0, 0]); await espera(250);
    const fB = await consulta(o.id, 5, 9, [0, 10000, 0]); await espera(250);
    const fC = await consulta(o.id, 9, 5, [0, 0, 10000]); await espera(250);
    const A = desglose(fA), B = desglose(fB), C = desglose(fC);
    const potA = A["Término de potencia"], potB = B["Término de potencia"];
    const p1 = (9 * potA - 5 * potB) / 56, p2 = (9 * potB - 5 * potA) / 56;
    const e = [A["Consumo electricidad"], B["Consumo electricidad"], C["Consumo electricidad"]].map((x) => x / 10000);
    const cuotaAnual = (A["Término fijo"] ?? 0) - BONO_SOCIAL_DIA * 365;
    const c = fA.caracteristicas ?? {};
    brutas.push({ resumen: o, desgloses: { A, B, C }, caracteristicas: c });

    const problemas = [];
    if (![p1, p2, ...e].every((x) => Number.isFinite(x) && x >= 0)) problemas.push("precios no válidos");
    if (Math.abs((C["Término de potencia"] ?? 0) - potA) > 0.02) problemas.push("la potencia no cuadra entre consultas");
    if (e.some((x) => x === 0)) problemas.push("energía a 0 en algún periodo");
    if (problemas.length) {
      descartadas.push({ id: o.id, comercializadora: o.comercializadora, oferta: o.oferta, problemas });
      continue;
    }

    const unico = Math.abs(e[0] - e[1]) < 1e-5 && Math.abs(e[1] - e[2]) < 1e-5;
    const servicio = servicioObligatorio(c.serviciosObligatorios);
    const promo = Math.round(((o.importeSegundoAnio ?? 0) - (o.importePrimerAnio ?? 0)) * 100) / 100;
    tarifas.push({
      id: `cnmc-${o.id}`,
      comercializadora: o.comercializadora,
      nombre: o.oferta,
      tipo: unico ? "fijo" : "periodos",
      potencia: { p1: r6(p1 / 365), p2: r6(p2 / 365) },
      energia: { p1: r6(e[0]), p2: r6(e[1]), p3: r6(e[2]) },
      cuota_fija_mes: cuotaAnual > 0.05 ? Math.round((cuotaAnual / 12) * 100) / 100 : 0,
      servicio_mes: servicio.servicio_mes,
      permanencia_meses: o.penalizacion ? 12 : 0,
      servicios_obligatorios: c.serviciosObligatorios ? [String(c.serviciosObligatorios).replace(/\$/g, ": ").replace(/\s+/g, " ").trim().slice(0, 300)] : [],
      url_fuente: c.webOferta || "https://comparador.cnmc.gob.es/",
      fecha_comprobacion: hoy,
      comision: false,
      url_contratar: c.webOferta || "",
      notas: String(c.caracteristicas ?? "").replace(/\s+/g, " ").trim().slice(0, 700),
      origen: "cnmc",
      info: {
        cnmc_id: o.id,
        incluye_bono_social: A["Término fijo"] === undefined,
        servicio_sin_precio: servicio.servicio_sin_precio,
        horario_propio: /\b(?!24)\d{1,2}\s*horas\b/i.test(o.oferta), // "10 horas": horario que elige el cliente
        verde: Boolean(o.verde),
        servicios_adicionales: Boolean(o.serviciosAdicionales),
        penalizacion: c.condicionesPenalizacion ?? null,
        validez: c.periodoValidez ?? null,
        limitaciones: c.limitaciones ?? o.validez ?? null,
        potencia_max_kw: c.potenciaMaximaElectricidad ?? null,
        consumo_max_kwh: c.consumoMaximoElectricidad ?? null,
        revision: c.periocidadRevisionPrecios ?? null,
        condiciones_revision: c.condicionesRevisionPrecios ? String(c.condicionesRevisionPrecios).slice(0, 500) : null,
        contratacion: { internet: Boolean(c.ofertaInternet), telefono: Boolean(c.ofertaTel), oficina: Boolean(c.ofertaOficina) },
        url_contrato: c.webContrato || null,
        promo_primer_anio_eur: promo > 0 ? promo : 0,
        descuento_energia: null,
      },
    });
    process.stdout.write(".");
  } catch (e) {
    descartadas.push({ id: o.id, comercializadora: o.comercializadora, oferta: o.oferta, problemas: [e.message] });
  }
}
console.log();

// ---------- 3. Guardar ----------
const dir = new URL("../data/cnmc/", import.meta.url);
mkdirSync(dir, { recursive: true });
writeFileSync(new URL(`ofertas-${hoy}.json`, dir), JSON.stringify({ fecha: hoy, fuente: "https://comparador.cnmc.gob.es", ofertas: brutas }, null, 1));

const fichero = new URL("../data/tarifas.json", import.meta.url);
const actual = JSON.parse(readFileSync(fichero, "utf8"));
// Se conservan la PVPC y las tarifas añadidas a mano que no vienen de la CNMC.
// Las tarifas a mano viven en data/tarifas-manuales.json; aquí solo se conserva la PVPC.
const manuales = actual.tarifas.filter((t) => t.tipo === "pvpc");
tarifas.sort((a, b) => a.comercializadora.localeCompare(b.comercializadora) || a.nombre.localeCompare(b.nombre));
writeFileSync(
  fichero,
  JSON.stringify({
    _nota: "Precios SIN impuestos. Las tarifas cnmc-* se generan con scripts/importar-cnmc.mjs a partir del comparador oficial de la CNMC (precios del segundo año, sin promociones). Las demás se mantienen a mano. Una tarifa con más de 45 días sin comprobar se marca 'por revisar'.",
    actualizado: hoy,
    tarifas: [...manuales, ...tarifas],
  }, null, 1) + "\n",
);
writeFileSync(new URL(`descartadas-${hoy}.json`, dir), JSON.stringify(descartadas, null, 1));
console.log(`${tarifas.length} tarifas de ${new Set(tarifas.map((t) => t.comercializadora)).size} comercializadoras → data/tarifas.json`);
console.log(`${descartadas.length} descartadas (ver data/cnmc/descartadas-${hoy}.json)`);

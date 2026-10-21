// Descarga de la API pública REData de Red Eléctrica:
//  - PVPC 2.0TD hora a hora (indicador 1001) → data/precios/AAAA-MM-DD.json (campo "precios")
//  - Precio del mercado diario OMIE (spot, indicador 600) → mismo fichero (campo "spot")
//  - Componentes mensuales del precio final de la demanda (ajustes, capacidad…) → data/mercado-ajustes.json
// El spot y los ajustes sirven para calcular las tarifas indexadas.
//
// Uso: node scripts/fetch-precios.mjs [días hacia atrás=30]
// En producción lo hace el Worker con un cron (apps/worker); este script sirve para el build
// estático y para rellenar el archivo histórico.
//
// Nunca se escribe un día incompleto: si REData aún no ha publicado mañana, no hay fichero.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const DIAS = Number(process.argv[2] ?? 30);
const DIR = new URL("../data/precios/", import.meta.url);
const AJUSTES = new URL("../data/mercado-ajustes.json", import.meta.url);
mkdirSync(DIR, { recursive: true });

const fechaMadrid = (d) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid" }).format(d);
const sumar = (iso, n) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function redata(ruta, desde, hasta, trunc) {
  const url = `https://apidatos.ree.es/es/datos/mercados/${ruta}?start_date=${desde}T00:00&end_date=${hasta}T23:59&time_trunc=${trunc}`;
  for (let intento = 1; intento <= 3; intento++) {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (res.ok) return res.json();
    await espera(1500 * intento);
  }
  throw new Error(`REData no responde: ${ruta} ${desde}…${hasta}`);
}

/** Agrupa los valores por fecha local y hora de reloj (promedia cuartos de hora y la hora repetida de octubre). */
export function agrupar(valores) {
  const dias = new Map();
  for (const v of valores) {
    const fecha = v.datetime.slice(0, 10);
    const hora = Number(v.datetime.slice(11, 13));
    const dia = dias.get(fecha) ?? new Map();
    const prev = dia.get(hora);
    dia.set(hora, prev ? { suma: prev.suma + v.value, n: prev.n + 1 } : { suma: v.value, n: 1 });
    dias.set(fecha, dia);
  }
  return dias;
}

const aKwh = (horas) =>
  Array.from({ length: 24 }, (_, h) => {
    const x = horas?.get(h);
    return x ? Math.round((x.suma / x.n / 1000) * 1e5) / 1e5 : null; // €/MWh → €/kWh
  });

const hoy = fechaMadrid(new Date());
const manana = sumar(hoy, 1);
const inicio = sumar(hoy, -DIAS);
let escritos = 0;

// ---------- Precios horarios (bloques de 20 días: límite de REData) ----------
for (let desde = inicio; desde <= manana; desde = sumar(desde, 20)) {
  let hasta = sumar(desde, 19);
  if (hasta > manana) hasta = manana;
  const json = await redata("precios-mercados-tiempo-real", desde, hasta, "hour");
  const serie = (id, tipo) => json.included?.find((i) => i.id === id || i.type === tipo)?.attributes.values ?? [];
  const pvpc = agrupar(serie("1001", "PVPC"));
  const spot = agrupar(serie("600", "Precio mercado spot"));
  for (const [fecha, horas] of pvpc) {
    // Un día "completo" tiene sus 24 horas de reloj (23 el día del cambio de marzo).
    if (horas.size < 23) {
      console.warn(`${fecha}: solo ${horas.size} horas, no se guarda`);
      continue;
    }
    const spotDia = spot.get(fecha);
    writeFileSync(
      new URL(`${fecha}.json`, DIR),
      JSON.stringify({
        fecha,
        unidad: "€/kWh",
        indicador: "PVPC 2.0TD (1001), peajes y cargos incluidos, sin impuestos",
        indicador_spot: "Precio del mercado diario (600), media horaria",
        fuente: "Red Eléctrica · REData",
        fuente_url: "https://www.ree.es/es/apidatos",
        descargado: new Date().toISOString(),
        precios: aKwh(horas),
        spot: spotDia && spotDia.size >= 23 ? aKwh(spotDia) : null,
      }, null, 1),
    );
    escritos++;
  }
  await espera(300);
}
console.log(`Precios guardados: ${escritos} días (hasta ${manana})`);

// ---------- Componentes mensuales del precio final de la demanda ----------
// "ajuste" = precio total − mercado diario: servicios de ajuste, pagos por capacidad, intradiario…
const ajustes = existsSync(AJUSTES) ? JSON.parse(readFileSync(AJUSTES, "utf8")) : { meses: {} };
const mesInicio = inicio.slice(0, 7) + "-01";
const json = await redata("componentes-precio-energia-cierre-desglose", mesInicio, hoy, "month");
const grupo = (tipo) => json.included?.find((i) => i.type === tipo)?.attributes.content ?? [];
const valores = (c) => Object.fromEntries((c?.attributes.values ?? []).map((v) => [v.datetime.slice(0, 7), v.value]));
const total = valores(grupo("Precio total")[0]);
const diario = valores(grupo("Mercados").find((c) => c.type === "Mercado diario"));
for (const [mes, t] of Object.entries(total)) {
  if (diario[mes] === undefined) continue;
  ajustes.meses[mes] = { total_eur_mwh: t, diario_eur_mwh: diario[mes], ajuste_eur_kwh: Math.round(((t - diario[mes]) / 1000) * 1e6) / 1e6 };
}
ajustes._nota = "Componentes mensuales del precio final de la demanda nacional (REData, componentes-precio-energia-cierre-desglose). ajuste_eur_kwh = precio total − mercado diario: servicios de ajuste, pagos por capacidad, intradiario y otros. Es una media nacional: se usa como aproximación del coste de ajustes de las tarifas indexadas.";
ajustes.fuente = "https://www.ree.es/es/apidatos";
ajustes.actualizado = hoy;
writeFileSync(AJUSTES, JSON.stringify(ajustes, null, 1) + "\n");
console.log(`Ajustes mensuales: ${Object.keys(ajustes.meses).length} meses`);

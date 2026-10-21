// Histórico mensual del precio de la luz desde que existe la 2.0TD (junio de 2021):
// PVPC media aritmética y por periodos (punta, llano, valle) y mercado diario OMIE.
// Guarda data/historico-mensual.json (pocas decenas de KB: no hace falta un fichero por día).
// Uso: node scripts/historico.mjs [desde=2021-06-01]

import { readFileSync, writeFileSync } from "node:fs";

const DESDE = process.argv[2] ?? "2021-06-01";
const festivos = new Set(JSON.parse(readFileSync(new URL("../data/festivos.json", import.meta.url), "utf8")).fechas);
// Festivos nacionales fijos de años anteriores (los del fichero empiezan en 2025).
for (const y of [2021, 2022, 2023, 2024]) for (const md of ["01-01", "01-06", "05-01", "08-15", "10-12", "11-01", "12-06", "12-08", "12-25"]) festivos.add(`${y}-${md}`);

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const sumar = (iso, n) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};
const hoy = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid" }).format(new Date());
const periodo = (fecha, hora) => {
  const [y, m, d] = fecha.split("-").map(Number);
  const dia = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  if (dia === 0 || dia === 6 || festivos.has(fecha) || hora < 8) return 3;
  return (hora >= 10 && hora < 14) || (hora >= 18 && hora < 22) ? 1 : 2;
};

const meses = new Map(); // mes → { pvpc: {s,n}, p1, p2, p3, omie }
const acum = (o, k, v) => {
  o[k] ??= { s: 0, n: 0 };
  o[k].s += v;
  o[k].n++;
};

for (let a = DESDE; a <= hoy; a = sumar(a, 20)) {
  let b = sumar(a, 19);
  if (b > hoy) b = hoy;
  const url = `https://apidatos.ree.es/es/datos/mercados/precios-mercados-tiempo-real?start_date=${a}T00:00&end_date=${b}T23:59&time_trunc=hour`;
  let j = null;
  for (let i = 1; i <= 4 && !j; i++) {
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (r.ok) j = await r.json();
    else await espera(2000 * i);
  }
  if (!j) {
    console.warn(`Sin datos ${a}…${b}`);
    continue;
  }
  const serie = (id, tipo) => j.included?.find((x) => x.id === id || x.type === tipo)?.attributes.values ?? [];
  // OMIE cuartohorario desde octubre de 2025: se promedia por hora antes de acumular.
  const omieHora = new Map();
  for (const v of serie("600", "Precio mercado spot")) {
    const k = v.datetime.slice(0, 13);
    const x = omieHora.get(k) ?? { s: 0, n: 0 };
    x.s += v.value;
    x.n++;
    omieHora.set(k, x);
  }
  for (const [k, x] of omieHora) acum((meses.get(k.slice(0, 7)) ?? meses.set(k.slice(0, 7), {}).get(k.slice(0, 7))), "omie", x.s / x.n / 1000);
  for (const v of serie("1001", "PVPC")) {
    const fecha = v.datetime.slice(0, 10);
    const hora = Number(v.datetime.slice(11, 13));
    const mes = fecha.slice(0, 7);
    const o = meses.get(mes) ?? meses.set(mes, {}).get(mes);
    acum(o, "pvpc", v.value / 1000);
    acum(o, `p${periodo(fecha, hora)}`, v.value / 1000);
  }
  process.stdout.write(".");
  await espera(250);
}

const r5 = (x) => (x ? Math.round((x.s / x.n) * 1e5) / 1e5 : null);
const salida = {
  _nota: "Medias mensuales en €/kWh, sin impuestos. pvpc: media aritmética de las 24 horas (PVPC 2.0TD, peajes y cargos incluidos). p1/p2/p3: media de las horas de punta, llano y valle. omie: media aritmética del mercado diario. Fuente: Red Eléctrica (REData).",
  fuente: "https://www.ree.es/es/apidatos",
  actualizado: hoy,
  meses: Object.fromEntries([...meses.entries()].sort((x, y) => x[0].localeCompare(y[0])).map(([m, o]) => [m, { pvpc: r5(o.pvpc), p1: r5(o.p1), p2: r5(o.p2), p3: r5(o.p3), omie: r5(o.omie) }])),
};
writeFileSync(new URL("../data/historico-mensual.json", import.meta.url), JSON.stringify(salida, null, 1) + "\n");
console.log(`\n${Object.keys(salida.meses).length} meses → data/historico-mensual.json`);

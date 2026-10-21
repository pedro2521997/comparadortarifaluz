// Descarga el PVPC 2.0TD hora a hora (indicador 1001) de la API pública REData de Red Eléctrica
// y guarda un JSON por día en data/precios/AAAA-MM-DD.json.
//
// Uso: node scripts/fetch-precios.mjs [días hacia atrás=30]
// En producción lo hace el Worker con un cron (apps/worker); este script sirve para el build
// estático y para rellenar el archivo histórico.
//
// Nunca se escribe un día incompleto: si REData aún no ha publicado mañana, no hay fichero.

import { mkdirSync, writeFileSync } from "node:fs";

const DIAS = Number(process.argv[2] ?? 30);
const DIR = new URL("../data/precios/", import.meta.url);
mkdirSync(DIR, { recursive: true });

const fechaMadrid = (d) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid" }).format(d);
const sumar = (iso, n) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

async function pvpc(desde, hasta) {
  const url = `https://apidatos.ree.es/es/datos/mercados/precios-mercados-tiempo-real?start_date=${desde}T00:00&end_date=${hasta}T23:59&time_trunc=hour`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`REData ${res.status} ${desde}…${hasta}`);
  const json = await res.json();
  const serie = json.included?.find((i) => i.id === "1001" || i.type === "PVPC");
  if (!serie) throw new Error("REData: no viene la serie PVPC");
  return serie.attributes.values;
}

/** Agrupa los valores por fecha local y hora de reloj (el día de 25 horas promedia la hora repetida). */
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

const hoy = fechaMadrid(new Date());
const manana = sumar(hoy, 1);
const inicio = sumar(hoy, -DIAS);
let escritos = 0;

// REData limita el rango por petición: se pide en bloques de 20 días.
for (let desde = inicio; desde <= manana; desde = sumar(desde, 20)) {
  let hasta = sumar(desde, 19);
  if (hasta > manana) hasta = manana;
  const valores = await pvpc(desde, hasta);
  for (const [fecha, horas] of agrupar(valores)) {
    // Un día "completo" tiene sus 24 horas de reloj (23 el día del cambio de marzo).
    const completo = horas.size >= 23;
    if (!completo) {
      console.warn(`${fecha}: solo ${horas.size} horas, no se guarda`);
      continue;
    }
    const precios = Array.from({ length: 24 }, (_, h) => {
      const x = horas.get(h);
      return x ? Math.round((x.suma / x.n / 1000) * 1e5) / 1e5 : null; // €/MWh → €/kWh
    });
    writeFileSync(
      new URL(`${fecha}.json`, DIR),
      JSON.stringify({
        fecha,
        unidad: "€/kWh",
        indicador: "PVPC 2.0TD (1001), peajes y cargos incluidos, sin impuestos",
        fuente: "Red Eléctrica · REData",
        fuente_url: "https://www.ree.es/es/apidatos",
        descargado: new Date().toISOString(),
        precios,
      }, null, 1),
    );
    escritos++;
  }
}
console.log(`Precios guardados: ${escritos} días (hasta ${manana})`);

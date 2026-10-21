// Carga de precios PVPC en el navegador.
// Orden: Worker (/api/precios, producción) → fichero mensual estático del build → REData directo.
// Solo se devuelve un día si está completo; si no, null ("aún no publicado").

export type Precios = (number | null)[];

const cacheMes = new Map<string, Promise<Record<string, Precios> | null>>();

function mesEstatico(mes: string) {
  if (!cacheMes.has(mes)) {
    cacheMes.set(
      mes,
      fetch(`/datos/pvpc/${mes}.json`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    );
  }
  return cacheMes.get(mes)!;
}

async function deWorker(fecha: string): Promise<Precios | null> {
  try {
    const r = await fetch(`/api/precios/${fecha}`);
    if (!r.ok || !r.headers.get("content-type")?.includes("json")) return null;
    const j = await r.json();
    return Array.isArray(j.precios) ? j.precios : null;
  } catch {
    return null;
  }
}

/** Agrupa valores de REData por fecha local y hora de reloj (€/MWh → €/kWh). */
function agrupar(valores: { value: number; datetime: string }[]): Record<string, Precios> {
  const acc: Record<string, { s: number; n: number }[]> = {};
  for (const v of valores) {
    const f = v.datetime.slice(0, 10);
    const h = Number(v.datetime.slice(11, 13));
    acc[f] ??= [];
    const x = acc[f][h];
    acc[f][h] = x ? { s: x.s + v.value, n: x.n + 1 } : { s: v.value, n: 1 };
  }
  const out: Record<string, Precios> = {};
  for (const [f, horas] of Object.entries(acc)) {
    const llenas = horas.filter(Boolean).length;
    if (llenas < 23) continue; // día incompleto: no publicado
    out[f] = Array.from({ length: 24 }, (_, h) => (horas[h] ? Math.round((horas[h].s / horas[h].n / 1000) * 1e5) / 1e5 : null));
  }
  return out;
}

export async function deRedata(desde: string, hasta: string): Promise<Record<string, Precios>> {
  const url = `https://apidatos.ree.es/es/datos/mercados/precios-mercados-tiempo-real?start_date=${desde}T00:00&end_date=${hasta}T23:59&time_trunc=hour`;
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`REData ${r.status}`);
  const j = await r.json();
  const serie = j.included?.find((i: { id: string; type: string }) => i.id === "1001" || i.type === "PVPC");
  return serie ? agrupar(serie.attributes.values) : {};
}

export async function cargarDia(fecha: string): Promise<Precios | null> {
  const w = await deWorker(fecha);
  if (w) return w;
  const mes = await mesEstatico(fecha.slice(0, 7));
  if (mes?.[fecha]) return mes[fecha];
  try {
    return (await deRedata(fecha, fecha))[fecha] ?? null;
  } catch {
    return null;
  }
}

const sumar = (iso: string, n: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

/**
 * Precios de un rango de fechas para el comparador (€/kWh por hora de reloj).
 * Usa los ficheros mensuales y rellena lo que falte con REData en bloques de 20 días.
 */
export async function cargarRango(desde: string, hasta: string): Promise<Record<string, number[]>> {
  const out: Record<string, number[]> = {};
  const meses = new Set<string>();
  for (let f = desde; f <= hasta; f = sumar(f, 1)) meses.add(f.slice(0, 7));
  for (const m of meses) {
    const datos = await mesEstatico(m);
    if (datos) for (const [f, p] of Object.entries(datos)) if (f >= desde && f <= hasta) out[f] = p as number[];
  }
  const faltan: string[] = [];
  for (let f = desde; f <= hasta; f = sumar(f, 1)) if (!out[f]) faltan.push(f);
  for (let i = 0; i < faltan.length; ) {
    const a = faltan[i];
    let b = a;
    while (i < faltan.length && faltan[i] <= sumar(a, 19)) b = faltan[i++];
    try {
      Object.assign(out, await deRedata(a, b));
    } catch {
      /* Sin conexión con REData: el motor valorará esas horas con la media y lo avisará. */
    }
  }
  return out;
}

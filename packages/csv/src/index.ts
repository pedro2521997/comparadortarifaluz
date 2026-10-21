// Lector de ficheros de consumo horario (Datadis y distribuidoras).
// Se ejecuta en el navegador: el fichero nunca sale del ordenador del usuario.
//
// Detecta automáticamente: separador (; , tab), columnas (CUPS, fecha, hora, kWh), coma decimal,
// convención de hora (1–24 de Datadis o 0–23), cuartohorario, Wh frente a kWh y las horas
// 23/25 de los cambios de horario. Si no reconoce el formato, devuelve las columnas para que
// el usuario indique cuál es cada una. Nunca falla en silencio.

export interface Lectura {
  fecha: string;
  hora: number;
  kwh: number;
}

export interface Mapeo {
  separador: string;
  filaCabecera: number;
  colFecha: number;
  /** -1 si la hora va dentro de la columna de fecha */
  colHora: number;
  colKwh: number;
  colCups: number;
  unidad: "kWh" | "Wh";
}

export type Resultado =
  | {
      ok: true;
      lecturas: Lectura[];
      cups: string | null;
      desde: string;
      hasta: string;
      mapeo: Mapeo;
      avisos: string[];
    }
  | {
      ok: false;
      /** Motivo legible para el usuario */
      error: string;
      /** Si se pudo leer la tabla, cabecera y filas de muestra para el mapeo manual */
      cabecera?: string[];
      muestra?: string[][];
      mapeoParcial?: Partial<Mapeo>;
    };

const normalizar = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/["']/g, "").trim();

export function detectarSeparador(linea: string): string {
  const cuenta = (c: string) => linea.split(c).length - 1;
  const opciones = [";", "\t", ","].map((c) => [c, cuenta(c)] as const);
  opciones.sort((a, b) => b[1] - a[1]);
  return opciones[0][1] > 0 ? opciones[0][0] : ";";
}

/** Divide una línea respetando comillas dobles. */
export function dividir(linea: string, sep: string): string[] {
  const out: string[] = [];
  let actual = "";
  let comillas = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (c === '"') {
      if (comillas && linea[i + 1] === '"') {
        actual += '"';
        i++;
      } else comillas = !comillas;
    } else if (c === sep && !comillas) {
      out.push(actual.trim());
      actual = "";
    } else actual += c;
  }
  out.push(actual.trim());
  return out;
}

/** "0,123" · "0.123" · "1.234,5" · "1,234.5" → número */
export function numero(s: string): number {
  let t = s.replace(/\s/g, "").replace(/"/g, "");
  if (t === "") return NaN;
  const coma = t.lastIndexOf(",");
  const punto = t.lastIndexOf(".");
  if (coma >= 0 && punto >= 0) {
    t = coma > punto ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  } else if (coma >= 0) {
    t = t.replace(",", ".");
  }
  return Number(t);
}

/** Fecha en formatos dd/mm/aaaa, aaaa/mm/dd, aaaa-mm-dd, dd-mm-aaaa (con o sin hora detrás). */
export function fechaISO(s: string): string | null {
  const t = s.trim().replace(/"/g, "");
  let m = t.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (m) return iso(+m[3], +m[2], +m[1]);
  m = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})(?!\d)/);
  if (m) return iso(2000 + +m[3], +m[2], +m[1]);
  return null;
}

function iso(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Hora como número decimal: "01:00" → 1, "1" → 1, "00:15" → 0.25, "2024/01/01 13:00" → 13. */
export function horaDecimal(s: string): number | null {
  const t = s.trim().replace(/"/g, "");
  const conFecha = t.match(/\d[-/.]\d{1,2}[-/.]\d{2,4}[ T]+(\d{1,2})(?::(\d{2}))?/);
  if (conFecha) return +conFecha[1] + (conFecha[2] ? +conFecha[2] / 60 : 0);
  const m = t.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?(?:\s*-.*)?$/);
  if (!m) return null;
  return +m[1] + (m[2] ? +m[2] / 60 : 0);
}

const PISTAS = {
  cups: ["cups"],
  fecha: ["fecha", "date", "dia", "day"],
  hora: ["hora", "hour", "periodo horario"],
  kwh: ["consumo", "ae_kwh", "kwh", "energia activa", "energia", "ae", "valor", "consumption"],
};

const DESCARTAR_KWH = ["metodo", "real", "estimad", "generacion", "excedent", "as_", "reactiva", "export"];

export function detectarColumnas(cabecera: string[]): Partial<Mapeo> {
  const norm = cabecera.map(normalizar);
  const buscar = (pistas: string[], excluir: (c: string) => boolean = () => false) => {
    for (const p of pistas) {
      const i = norm.findIndex((c) => (c === p || c.includes(p)) && !excluir(c));
      if (i >= 0) return i;
    }
    return -1;
  };
  const colCups = buscar(PISTAS.cups);
  const colFecha = buscar(PISTAS.fecha, (c) => c.includes("hora") && !c.includes("fecha"));
  let colHora = buscar(PISTAS.hora, (c) => c.includes("fecha"));
  const colKwh = buscar(PISTAS.kwh, (c) => DESCARTAR_KWH.some((d) => c.includes(d)) || c === norm[colFecha]);
  if (colHora === colFecha) colHora = -1;
  const unidad: "kWh" | "Wh" =
    colKwh >= 0 && /(^|[^k])wh/.test(norm[colKwh]) && !norm[colKwh].includes("kwh") ? "Wh" : "kWh";
  return { colCups, colFecha, colHora, colKwh, unidad };
}

function lineas(texto: string): string[] {
  return texto.replace(/^﻿/, "").split(/\r\n|\n|\r/).filter((l) => l.trim() !== "");
}

/** Busca la fila de cabecera: la primera de las 10 primeras con letras y separador. */
function filaCabecera(ls: string[], sep: string): number {
  for (let i = 0; i < Math.min(10, ls.length); i++) {
    const celdas = dividir(ls[i], sep);
    if (celdas.length >= 2 && celdas.some((c) => /[a-zA-Z]{3,}/.test(c)) && celdas.some((c) => fechaISO(c) === null)) {
      const det = detectarColumnas(celdas);
      if ((det.colFecha ?? -1) >= 0 || (det.colKwh ?? -1) >= 0) return i;
    }
  }
  return 0;
}

/** Lee el fichero detectando el formato. */
export function leerConsumos(texto: string): Resultado {
  const ls = lineas(texto);
  if (ls.length < 2) return { ok: false, error: "El fichero está vacío o solo tiene una línea." };
  const sep = detectarSeparador(ls.slice(0, 5).join("\n"));
  const fila = filaCabecera(ls, sep);
  const cabecera = dividir(ls[fila], sep);
  const det = detectarColumnas(cabecera);
  const muestra = ls.slice(fila + 1, fila + 6).map((l) => dividir(l, sep));
  const mapeo: Mapeo = {
    separador: sep,
    filaCabecera: fila,
    colFecha: det.colFecha ?? -1,
    colHora: det.colHora ?? -1,
    colKwh: det.colKwh ?? -1,
    colCups: det.colCups ?? -1,
    unidad: det.unidad ?? "kWh",
  };
  if (mapeo.colFecha < 0 || mapeo.colKwh < 0) {
    return {
      ok: false,
      error: "No reconocemos las columnas de este fichero. Indica cuál es la fecha, la hora y el consumo.",
      cabecera,
      muestra,
      mapeoParcial: mapeo,
    };
  }
  const r = leerConMapeo(texto, mapeo);
  if (!r.ok) return { ...r, cabecera, muestra, mapeoParcial: mapeo };
  return r;
}

/** Lee el fichero con un mapeo de columnas conocido (automático o indicado por el usuario). */
export function leerConMapeo(texto: string, mapeo: Mapeo): Resultado {
  const ls = lineas(texto).slice(mapeo.filaCabecera + 1);
  const avisos: string[] = [];
  let cups: string | null = null;
  let descartadas = 0;

  // 1. Filas crudas: fecha + hora decimal + kWh
  const crudas: { fecha: string; h: number; kwh: number }[] = [];
  for (const linea of ls) {
    const c = dividir(linea, mapeo.separador);
    const fecha = fechaISO(c[mapeo.colFecha] ?? "");
    const h = mapeo.colHora >= 0 ? horaDecimal(c[mapeo.colHora] ?? "") : horaDecimal(c[mapeo.colFecha] ?? "");
    let kwh = numero(c[mapeo.colKwh] ?? "");
    if (!fecha || h === null || !Number.isFinite(kwh)) {
      descartadas++;
      continue;
    }
    if (mapeo.unidad === "Wh") kwh /= 1000;
    if (kwh < 0) {
      descartadas++;
      continue;
    }
    if (cups === null && mapeo.colCups >= 0 && c[mapeo.colCups]) cups = c[mapeo.colCups].replace(/"/g, "");
    crudas.push({ fecha, h, kwh });
  }
  if (crudas.length === 0) {
    return { ok: false, error: "No hemos podido leer ninguna fila con fecha, hora y consumo válidos." };
  }
  if (descartadas > 0) avisos.push(`Se han ignorado ${descartadas} filas que no tenían fecha, hora o consumo válidos.`);

  // 2. Convención de hora: si aparece la hora 0 y nunca la 24, la hora es la de inicio (0–23);
  //    si no, es la de fin, como en Datadis (1–24, y 25 el día del cambio de octubre).
  const cuartohoraria = crudas.some((r) => r.h % 1 !== 0);
  const hayCero = crudas.some((r) => r.h === 0);
  const hayVeinticuatro = crudas.some((r) => r.h >= 24);
  const inicio = cuartohoraria ? hayCero : hayCero && !hayVeinticuatro;
  if (cuartohoraria) avisos.push("El fichero es cuartohorario; se ha agrupado por horas.");

  // 3. Índice de hora dentro del día (0..n-1) y agregación
  const porDia = new Map<string, Map<number, number>>();
  for (const r of crudas) {
    let idx = cuartohoraria
      ? Math.floor(inicio ? r.h : r.h - 0.25)
      : inicio ? r.h : r.h - 1;
    if (idx < 0) idx = 0;
    const dia = porDia.get(r.fecha) ?? new Map<number, number>();
    dia.set(idx, (dia.get(idx) ?? 0) + r.kwh);
    porDia.set(r.fecha, dia);
  }

  // 4. Índice → hora de reloj, con los días de 23 y 25 horas
  const lecturas: Lectura[] = [];
  let dias25 = 0;
  let dias23 = 0;
  for (const [fecha, horas] of [...porDia.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const max = Math.max(...horas.keys());
    const largo = max >= 24;
    const corto = esDiaCorto(fecha) && max <= 22;
    if (largo) dias25++;
    if (corto) dias23++;
    for (const [idx, kwh] of [...horas.entries()].sort((a, b) => a[0] - b[0])) {
      let hora = idx;
      if (largo) hora = idx <= 2 ? idx : idx - 1; // se repite la hora de 2 a 3
      else if (corto) hora = idx < 2 ? idx : idx + 1; // no existe la hora de 2 a 3
      lecturas.push({ fecha, hora: Math.min(hora, 23), kwh: Math.round(kwh * 1e6) / 1e6 });
    }
  }
  if (dias25) avisos.push("Se ha tenido en cuenta la hora 25 del cambio de horario de octubre.");
  if (dias23) avisos.push("Se ha tenido en cuenta el día de 23 horas del cambio de horario de marzo.");

  const fechas = [...porDia.keys()].sort();
  return { ok: true, lecturas, cups, desde: fechas[0], hasta: fechas[fechas.length - 1], mapeo, avisos };
}

/** Último domingo de marzo: día de 23 horas en España peninsular. */
function esDiaCorto(fecha: string): boolean {
  const [y, m, d] = fecha.split("-").map(Number);
  if (m !== 3 || d < 25) return false;
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay() === 0;
}

/** Oculta el CUPS salvo los 4 primeros y 4 últimos caracteres. */
export function ocultarCups(cups: string): string {
  return cups.length > 10 ? `${cups.slice(0, 4)}…${cups.slice(-4)}` : cups;
}

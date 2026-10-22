// Lectura de facturas de luz en PDF (ya convertidas a texto). Todo es heurístico: cada comercializadora
// maqueta la factura a su manera, pero el modelo de factura regulado obliga a usar los mismos conceptos
// («Por potencia contratada», «Por energía consumida», «Impuesto electricidad», «Alquiler equipos de
// medida», «IVA», «Total»). Lo que no encontramos se deja vacío para que el usuario lo complete.

export type Periodo = "p1" | "p2" | "p3";

export interface DatosFactura {
  comercializadora?: string;
  cups?: string;
  cupsValido?: boolean;
  /** AAAA-MM-DD, ambas incluidas */
  desde?: string;
  hasta?: string;
  dias?: number;
  pvpc: boolean;
  potencia: { p1?: number; p2?: number };
  /** €/kW·día, sin impuestos */
  precioPotencia: { p1?: number; p2?: number };
  kwh: { p1?: number; p2?: number; p3?: number; total?: number };
  /** €/kWh, sin impuestos */
  precioEnergia: { p1?: number; p2?: number; p3?: number };
  importes: {
    potencia?: number;
    energia?: number;
    bonoSocial?: number;
    impuestoElectrico?: number;
    alquiler?: number;
    servicios?: number;
    descuentos?: number;
    iva?: number;
    total?: number;
  };
  /** Servicios añadidos que hemos visto (mantenimiento, asistencia, seguros…) */
  servicios: { concepto: string; importe: number }[];
  consumoAnual?: number;
}

// ---------- Texto ----------

export interface TrozoTexto {
  str: string;
  x: number;
  y: number;
  pagina: number;
}

/** Reconstruye líneas a partir de los trozos de texto de pdf.js (misma página y misma altura). */
export function lineasDesdeTrozos(trozos: TrozoTexto[]): string[] {
  const filas: { pagina: number; y: number; t: TrozoTexto[] }[] = [];
  for (const t of trozos) {
    if (!t.str.trim()) continue;
    const fila = filas.find((f) => f.pagina === t.pagina && Math.abs(f.y - t.y) < 3);
    if (fila) fila.t.push(t);
    else filas.push({ pagina: t.pagina, y: t.y, t: [t] });
  }
  // pdf.js mide la altura desde abajo: de arriba abajo es y descendente.
  filas.sort((a, b) => a.pagina - b.pagina || b.y - a.y);
  return filas.map((f) =>
    f.t
      .sort((a, b) => a.x - b.x)
      .map((t) => t.str.trim())
      .join(" ")
      .replace(/\s+/g, " "),
  );
}

/** Número en formato español o inglés: «1.234,56», «3,45», «0.150000», «1 234,5». */
export function numero(s: string): number {
  let t = s.replace(/\s/g, "").replace(/[€]/g, "");
  const neg = /^-|^\(.*\)$/.test(t);
  t = t.replace(/[()\-+]/g, "");
  if (t.includes(",") && t.includes(".")) {
    t = t.lastIndexOf(",") > t.lastIndexOf(".") ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  } else if (t.includes(",")) {
    t = t.replace(",", ".");
  } else if (/^[1-9]\d{0,2}(\.\d{3})+$/.test(t)) {
    // «2.640» son miles: en las facturas los decimales van con coma, y los precios con punto empiezan
    // por «0.» o llevan más de tres decimales. Un «3.450 kW» se corrige donde se lee la potencia.
    t = t.replace(/\./g, "");
  }
  const n = parseFloat(t);
  return neg ? -n : n;
}

// Sin espacio como separador de miles: en «P3 120 kWh» leería 3120. Nunca empieza a mitad de un número o palabra.
const NUM = String.raw`(?<![\w.,])(?:-?\d{1,3}(?:\.\d{3})+(?:,\d+)?|-?\d+(?:[.,]\d+)?)`;

const sinAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// ---------- CUPS ----------

const LETRAS = "TRWAGMYFPDXBNJZSQVHLCKE";

export function cupsValido(cups: string): boolean {
  const m = /^ES(\d{16})([A-Z]{2})/.exec(cups);
  if (!m) return false;
  const n = Number(BigInt(m[1]) % 529n);
  return LETRAS[Math.floor(n / 23)] + LETRAS[n % 23] === m[2];
}

function buscarCups(texto: string): string | undefined {
  const re = /ES\s?(\d[\d\s]{14,22}\d)\s?([A-Z]{2})(\s?[0-9][A-Z])?/g;
  let primero: string | undefined;
  for (const m of texto.matchAll(re)) {
    const cifras = m[1].replace(/\s/g, "");
    if (cifras.length !== 16) continue;
    const c = `ES${cifras}${m[2]}${(m[3] ?? "").trim()}`;
    if (cupsValido(c)) return c;
    primero ??= c;
  }
  return primero;
}

// ---------- Fechas ----------

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const FECHA = String.raw`\d{1,2}[/.\-]\d{1,2}[/.\-]\d{2,4}|\d{1,2} de [a-záéíóú]+ de \d{4}`;

function fechaIso(s: string): string | undefined {
  let d: number, m: number, y: number;
  const num = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/.exec(s.trim());
  if (num) {
    [d, m, y] = [Number(num[1]), Number(num[2]), Number(num[3])];
    if (y < 100) y += 2000;
  } else {
    const txt = /^(\d{1,2}) de ([a-záéíóú]+) de (\d{4})$/i.exec(s.trim());
    if (!txt) return;
    d = Number(txt[1]);
    m = MESES.indexOf(sinAcentos(txt[2]).replace("setiembre", "septiembre")) + 1;
    y = Number(txt[3]);
  }
  if (!(m >= 1 && m <= 12 && d >= 1 && d <= 31 && y > 2000)) return;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const diasEntre = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

function buscarPeriodo(lineas: string[]): Pick<DatosFactura, "desde" | "hasta" | "dias"> {
  const re = new RegExp(`(${FECHA})\\s*(?:-|–|a|al|hasta(?: el)?)\\s*(${FECHA})`, "i");
  // Primero las líneas que hablan del periodo; si no, cualquier par de fechas seguidas.
  const candidatas = [...lineas.filter((l) => /periodo|facturad|consumo|del /i.test(l)), ...lineas];
  for (const l of candidatas) {
    const m = re.exec(l);
    if (!m) continue;
    const desde = fechaIso(m[1]);
    const hasta = fechaIso(m[2]);
    if (!desde || !hasta || hasta <= desde || diasEntre(desde, hasta) > 400) continue;
    const dm = /\(?\s*(\d{1,3})\s*d[ií]as\s*\)?/i.exec(l) ?? lineas.map((x) => /(\d{1,3})\s*d[ií]as/i.exec(x)).find(Boolean);
    const explicitos = dm ? Number(dm[1]) : undefined;
    const incl = diasEntre(desde, hasta) + 1;
    const dias = explicitos && Math.abs(explicitos - incl) <= 1 ? explicitos : incl;
    return { desde, hasta, dias };
  }
  return {};
}

// ---------- Comercializadora ----------

const COMERCIALIZADORAS: [RegExp, string][] = [
  [/curenerg[ií]a/i, "Curenergía (PVPC de Iberdrola)"],
  [/energ[ií]a xxi/i, "Energía XXI (PVPC de Endesa)"],
  [/comercializadora regulada/i, "Comercializadora Regulada (PVPC de Naturgy)"],
  [/baser/i, "Baser COR (PVPC de TotalEnergies)"],
  [/r[eé]gsiti|regsiti/i, "Régsiti (PVPC de Repsol)"],
  [/iberdrola/i, "Iberdrola"],
  [/endesa/i, "Endesa"],
  [/naturgy/i, "Naturgy"],
  [/repsol/i, "Repsol"],
  [/totalenergies|total energies/i, "TotalEnergies"],
  [/octopus/i, "Octopus Energy"],
  [/holaluz/i, "Holaluz"],
  [/lucera/i, "Lucera"],
  [/factor energ[ií]a/i, "Factor Energía"],
  [/gana energ[ií]a/i, "Gana Energía"],
  [/pepe ?energy/i, "Pepeenergy"],
  [/audax/i, "Audax Renovables"],
  [/podo\b/i, "Podo"],
  [/imagina energ[ií]a/i, "Imagina Energía"],
  [/aldro/i, "Aldro Energía"],
  [/visalia/i, "Visalia"],
  [/fenie/i, "Fenie Energía"],
  [/som energia/i, "Som Energia"],
  [/edp\b/i, "EDP"],
  [/plenitude/i, "Plenitude"],
  [/nexus energ[ií]a/i, "Nexus Energía"],
];

function buscarComercializadora(lineas: string[]): string | undefined {
  // En la cabecera suele estar la comercializadora; más abajo aparecen la distribuidora y otras marcas.
  for (const zona of [lineas.slice(0, 40), lineas]) {
    for (const [re, nombre] of COMERCIALIZADORAS) if (zona.some((l) => re.test(l) && !/distribu/i.test(l))) return nombre;
  }
}

// ---------- Números con unidad ----------

/** Cantidades seguidas de una unidad en una línea. `unidad` es una expresión regular sin grupos de captura. */
function conUnidad(linea: string, unidad: string): number[] {
  const re = new RegExp(`(${NUM})\\s*(?:${unidad})`, "gi");
  return [...linea.matchAll(re)].map((m) => numero(m[1])).filter((n) => Number.isFinite(n));
}

const KWH = String.raw`kwh(?![a-z])`;
const EUR_KWH = String.raw`(?:€|eur|euros?)\s*/\s*kwh`;
const EUR_KW = String.raw`(?:€|eur|euros?)\s*/\s*kw(?!h)(?:\s*(?:y\s*|·|/|x\s*)?(?:d[ií]a|año|ano|mes))?`;

/** Importes en euros (no precios unitarios): «12,34 €», «12,34 EUR», «€ 12,34». */
function importes(linea: string): number[] {
  const limpia = linea.replace(new RegExp(`(${NUM})\\s*${EUR_KWH}`, "gi"), " ").replace(new RegExp(`(${NUM})\\s*${EUR_KW}`, "gi"), " ");
  const a = [...limpia.matchAll(new RegExp(`(${NUM})\\s*(?:€|eur(?:os)?\\b)(?!\\s*/)`, "gi"))].map((m) => numero(m[1]));
  const b = [...limpia.matchAll(new RegExp(`€\\s*(${NUM})`, "g"))].map((m) => numero(m[1]));
  return [...a, ...b].filter((n) => Number.isFinite(n));
}

const ETIQUETAS: Record<Periodo, RegExp> = {
  p1: /\bp1\b|punta/i,
  p2: /\bp2\b|llano/i,
  p3: /\bp3\b|valle/i,
};

/** Periodos que nombra una línea, en el orden en que aparecen. */
function periodosEn(l: string): Periodo[] {
  return (Object.keys(ETIQUETAS) as Periodo[])
    .map((p) => ({ p, i: l.search(ETIQUETAS[p]) }))
    .filter((x) => x.i >= 0)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.p);
}

// ---------- Lectura ----------

export function leerFactura(lineasOTexto: string[] | string): DatosFactura {
  const lineas = (Array.isArray(lineasOTexto) ? lineasOTexto : lineasOTexto.split(/\r?\n/)).map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  const texto = lineas.join("\n");
  const d: DatosFactura = {
    pvpc: /\bpvpc\b|precio voluntario para el peque[nñ]o consumidor/i.test(texto),
    potencia: {},
    precioPotencia: {},
    kwh: {},
    precioEnergia: {},
    importes: {},
    servicios: [],
  };
  d.comercializadora = buscarComercializadora(lineas);
  d.cups = buscarCups(texto);
  if (d.cups) d.cupsValido = cupsValido(d.cups);
  Object.assign(d, buscarPeriodo(lineas));

  // Potencia contratada (kW) y su precio (€/kW·día).
  const lPotencia = lineas.filter((l) => /potencia/i.test(l));
  for (const l of [...lPotencia.filter((x) => /contratad/i.test(x)), ...lPotencia]) {
    const kws = conUnidad(l.replace(new RegExp(`(${NUM})\\s*${EUR_KW}`, "gi"), " "), String.raw`kw(?!h)`)
      .map((n) => (n > 50 ? n / 1000 : n))
      .filter((n) => n > 0.5 && n <= 30);
    if (!kws.length) continue;
    const ps = periodosEn(l).filter((p) => p !== "p3");
    if (ps.length >= 2 && kws.length >= 2) {
      d.potencia.p1 ??= kws[0];
      d.potencia.p2 ??= kws[1];
    } else if (ps[0] === "p2") d.potencia.p2 ??= kws[0];
    else if (ps[0] === "p1") d.potencia.p1 ??= kws[0];
    else if (kws.length >= 2) {
      d.potencia.p1 ??= kws[0];
      d.potencia.p2 ??= kws[1];
    } else d.potencia.p1 ??= kws[0];
    if (d.potencia.p1 && d.potencia.p2) break;
  }
  if (d.potencia.p1 && !d.potencia.p2) d.potencia.p2 = d.potencia.p1;
  for (const l of lineas.filter((x) => /potencia/i.test(x) || new RegExp(EUR_KW, "i").test(x))) {
    for (const m of l.matchAll(new RegExp(`(${NUM})\\s*(${EUR_KW})`, "gi"))) {
      let v = numero(m[1]);
      if (/a[nñ]o/i.test(m[2])) v /= 365;
      else if (/mes/i.test(m[2])) v /= 30.4;
      if (!(v > 0 && v < 1)) continue;
      const p = periodosEn(l.slice(0, m.index! + 1)).filter((x) => x !== "p3").at(-1) ?? (d.precioPotencia.p1 === undefined ? "p1" : "p2");
      d.precioPotencia[p as "p1" | "p2"] ??= v;
    }
  }

  // Energía: kWh y €/kWh por periodo.
  for (const l of lineas) {
    if (/lectura|contador n|n[uú]mero de contador/i.test(l) && !/consumo/i.test(l)) continue;
    const ps = periodosEn(l);
    if (!ps.length || /potencia/i.test(l)) continue;
    const cantidades = conUnidad(l.replace(new RegExp(`(${NUM})\\s*${EUR_KWH}`, "gi"), " "), KWH).filter((n) => n >= 0 && n < 20000);
    const precios = conUnidad(l, EUR_KWH).filter((n) => n > 0 && n < 1);
    if (ps.length > 1 && cantidades.length === ps.length) ps.forEach((p, i) => (d.kwh[p] ??= cantidades[i]));
    else if (ps.length === 1 && cantidades.length) d.kwh[ps[0]] ??= cantidades[0];
    if (ps.length > 1 && precios.length === ps.length) ps.forEach((p, i) => (d.precioEnergia[p] ??= precios[i]));
    else if (ps.length === 1 && precios.length) d.precioEnergia[ps[0]] ??= precios[0];
  }
  // Tarifa de precio único: un solo €/kWh sin periodo.
  if (!d.precioEnergia.p1) {
    const l = lineas.find((x) => /energ[ií]a/i.test(x) && !/potencia|impuesto/i.test(x) && conUnidad(x, EUR_KWH).some((n) => n > 0 && n < 1));
    if (l) {
      const v = conUnidad(l, EUR_KWH).find((n) => n > 0 && n < 1)!;
      d.precioEnergia = { p1: v, p2: v, p3: v };
    }
  }
  const lTotal = lineas.find((l) => /consumo total|total consumo|energ[ií]a consumida|consumo (del|de este|en el) periodo|consumo facturado/i.test(l) && conUnidad(l, KWH).length);
  if (lTotal) d.kwh.total = conUnidad(lTotal.replace(new RegExp(`(${NUM})\\s*${EUR_KWH}`, "gi"), " "), KWH)[0];
  const suma = (d.kwh.p1 ?? 0) + (d.kwh.p2 ?? 0) + (d.kwh.p3 ?? 0);
  if (d.kwh.total === undefined && d.kwh.p1 !== undefined && d.kwh.p3 !== undefined) d.kwh.total = suma;
  const lAnual = lineas.find((l) => /(ultimos|últimos) (12|doce) meses|consumo anual|consumo (del|en el) [uú]ltimo a[nñ]o/i.test(l) && conUnidad(l, KWH).length);
  if (lAnual) d.consumoAnual = Math.max(...conUnidad(lAnual, KWH));

  // Importes del resumen. El primer renglón que encaja suele ser el del resumen de la primera página.
  const importe = (re: RegExp, excluir?: RegExp, ultimo = true) => {
    for (const l of lineas) {
      if (!re.test(l) || (excluir && excluir.test(l))) continue;
      const xs = importes(l);
      if (xs.length) return ultimo ? xs[xs.length - 1] : xs[0];
    }
  };
  d.importes.potencia = importe(/(por|t[eé]rmino( fijo)?( de)?) potencia|^potencia( contratada)?\b|facturaci[oó]n (por|de la) potencia/i, /€\s*\/\s*kwh|impuesto/i);
  d.importes.energia = importe(/(por|t[eé]rmino( variable)?( de)?) energ[ií]a|^energ[ií]a( consumida| activa)?\b|facturaci[oó]n (por|de la) energ[ií]a/i, /impuesto|potencia|reactiva/i);
  d.importes.bonoSocial = importe(/bono social/i, /descuento/i);
  d.importes.impuestoElectrico = importe(/impuesto (especial )?(sobre la |de la )?electricidad|impuesto el[eé]ctrico|\biee\b/i);
  d.importes.alquiler = importe(/alquiler|equipos? de medida/i);
  d.importes.iva = importe(/\bi\.?v\.?a\.?\b|\bigic\b|\bipsi\b/i, /(sin|antes de|no incluye|base imponible)\b.*$/i);
  d.importes.total =
    importe(/total (importe )?(de la )?factura|importe total|total a pagar|importe a pagar|total factura/i) ?? importe(/^total\b/i, /base|kwh|potencia|energ/i);
  const desc = importe(/descuento|bonificaci[oó]n|promoci[oó]n/i, /bono social/i);
  if (desc !== undefined) d.importes.descuentos = -Math.abs(desc);

  // Servicios añadidos: suelen esconder lo que más se puede ahorrar.
  for (const l of lineas) {
    if (!/mantenimiento|asistencia|servicio|seguro|protecci[oó]n|pack\b|urgencias|reparaci/i.test(l)) continue;
    if (/atenci[oó]n al cliente|servicio de atenci|tel[eé]fono|www\.|@|aver[ií]as/i.test(l)) continue;
    const xs = importes(l).filter((n) => n > 0 && n < 100);
    if (!xs.length) continue;
    const concepto = l.replace(new RegExp(`(${NUM})\\s*(€|eur(os)?)`, "gi"), "").replace(/\s+/g, " ").trim().slice(0, 80);
    if (!d.servicios.some((s) => s.concepto === concepto)) d.servicios.push({ concepto, importe: xs[xs.length - 1] });
  }
  if (d.servicios.length) d.importes.servicios = d.servicios.reduce((a, s) => a + s.importe, 0);
  return d;
}

/** Campos encontrados, para decirle al usuario qué hemos leído y qué falta. */
export function camposEncontrados(d: DatosFactura) {
  return {
    cups: Boolean(d.cups),
    periodo: Boolean(d.desde && d.hasta),
    potencia: d.potencia.p1 !== undefined,
    kwh: d.kwh.p1 !== undefined || d.kwh.total !== undefined,
    precios: d.precioEnergia.p1 !== undefined && d.precioPotencia.p1 !== undefined,
    total: d.importes.total !== undefined,
  };
}

// Gasolineras baratas por región y ciudad en los países con mapa (salvo España, que tiene sus páginas propias
// con datos del Ministerio en lib/gasolineras.ts): Francia por departamento y commune, Portugal por distrito y
// concelho. Salen de los mismos ficheros que los mapas (data/estaciones/<CC>.json) y solo en el idioma del país.

import { PAISES, type Pais } from "./datos";
import { slugTexto } from "./carburantes";
import { GASOLINA, LIMITES, estaciones, urlMapa, type Comb, type Fila } from "./mapa";
import { TEXTOS_Z, type TextosZonas } from "./textos-zonas";

export interface Region { slug: string; nombre: string; codigo: string; filas: Fila[] }
export interface Ciudad { slug: string; nombre: string; region: Region; filas: Fila[] }
export interface PaisZonas {
  cc: string;
  p: Pais;
  T: TextosZonas;
  combustibles: Comb[];
  /** Carburantes en el orden en que se enseñan: la gasolina más vendida, el gasóleo y el resto. */
  orden: Comb[];
  actualizado: string;
  filas: Fila[];
  regiones: Region[];
  /** Ciudades con página propia (al menos 2 gasolineras). */
  ciudades: Ciudad[];
  /** Todas las ciudades, también las de una sola gasolinera (para las tablas de cada región). */
  todas: Ciudad[];
}

/** Departamentos de Francia metropolitana (el flujo de precios no trae ultramar). */
const DEPARTAMENTOS: Record<string, string> = {
  "01": "Ain", "02": "Aisne", "03": "Allier", "04": "Alpes-de-Haute-Provence", "05": "Hautes-Alpes", "06": "Alpes-Maritimes", "07": "Ardèche", "08": "Ardennes", "09": "Ariège",
  "10": "Aube", "11": "Aude", "12": "Aveyron", "13": "Bouches-du-Rhône", "14": "Calvados", "15": "Cantal", "16": "Charente", "17": "Charente-Maritime", "18": "Cher", "19": "Corrèze",
  "2A": "Corse-du-Sud", "2B": "Haute-Corse", "21": "Côte-d'Or", "22": "Côtes-d'Armor", "23": "Creuse", "24": "Dordogne", "25": "Doubs", "26": "Drôme", "27": "Eure", "28": "Eure-et-Loir", "29": "Finistère",
  "30": "Gard", "31": "Haute-Garonne", "32": "Gers", "33": "Gironde", "34": "Hérault", "35": "Ille-et-Vilaine", "36": "Indre", "37": "Indre-et-Loire", "38": "Isère", "39": "Jura",
  "40": "Landes", "41": "Loir-et-Cher", "42": "Loire", "43": "Haute-Loire", "44": "Loire-Atlantique", "45": "Loiret", "46": "Lot", "47": "Lot-et-Garonne", "48": "Lozère", "49": "Maine-et-Loire",
  "50": "Manche", "51": "Marne", "52": "Haute-Marne", "53": "Mayenne", "54": "Meurthe-et-Moselle", "55": "Meuse", "56": "Morbihan", "57": "Moselle", "58": "Nièvre", "59": "Nord",
  "60": "Oise", "61": "Orne", "62": "Pas-de-Calais", "63": "Puy-de-Dôme", "64": "Pyrénées-Atlantiques", "65": "Hautes-Pyrénées", "66": "Pyrénées-Orientales", "67": "Bas-Rhin", "68": "Haut-Rhin", "69": "Rhône",
  "70": "Haute-Saône", "71": "Saône-et-Loire", "72": "Sarthe", "73": "Savoie", "74": "Haute-Savoie", "75": "Paris", "76": "Seine-Maritime", "77": "Seine-et-Marne", "78": "Yvelines", "79": "Deux-Sèvres",
  "80": "Somme", "81": "Tarn", "82": "Tarn-et-Garonne", "83": "Var", "84": "Vaucluse", "85": "Vendée", "86": "Vienne", "87": "Haute-Vienne", "88": "Vosges", "89": "Yonne",
  "90": "Territoire de Belfort", "91": "Essonne", "92": "Hauts-de-Seine", "93": "Seine-Saint-Denis", "94": "Val-de-Marne", "95": "Val-d'Oise",
};
/** Código del departamento a partir del código postal (Córcega: 200xx-201xx Corse-du-Sud, 202xx-206xx Haute-Corse). */
export const departamento = (cp: string) => (cp.startsWith("20") ? (cp < "20200" ? "2A" : "2B") : cp.slice(0, 2));

/** Región y ciudad de cada gasolinera: [código, nombre de la región, ciudad] o null si no se sabe. */
const DONDE: Record<string, (f: Fila) => [string, string, string] | null> = {
  FR: (f) => {
    const d = departamento(f[5]);
    return DEPARTAMENTOS[d] ? [d, DEPARTAMENTOS[d], f[4]] : null;
  },
  PT: (f) => {
    const [, , distrito, concelho] = f.slice(8) as unknown as [number, string, string?, string?];
    return distrito && concelho ? [slugTexto(distrito), distrito, concelho] : null;
  },
};

/** Países con páginas por región: tienen mapa, textos en su idioma y forma de saber la región. */
export const PAISES_Z = Object.keys(DONDE).filter((cc) => estaciones(cc) && TEXTOS_Z[cc.toLowerCase()] && estaciones(cc)!.e.some((f) => DONDE[cc](f)));

const cache = new Map<string, PaisZonas>();
export function zonas(cc: string): PaisZonas {
  if (cache.has(cc)) return cache.get(cc)!;
  const d = estaciones(cc)!;
  const p = PAISES.find((x) => x.cc === cc.toLowerCase())!;
  const T = TEXTOS_Z[p.cc]!;
  const regiones = new Map<string, Region>();
  const ciudades = new Map<string, Ciudad>();
  for (const f of d.e) {
    const donde = DONDE[cc](f);
    if (!donde) continue;
    const [codigo, nombre, ciudad] = donde;
    let r = regiones.get(codigo);
    if (!r) regiones.set(codigo, (r = { codigo, nombre, slug: T.slugRegion(nombre, codigo), filas: [] }));
    r.filas.push(f);
    const k = `${codigo}|${slugTexto(ciudad)}`;
    let c = ciudades.get(k);
    if (!c) ciudades.set(k, (c = { nombre: ciudad, slug: slugTexto(ciudad), region: r, filas: [] }));
    c.filas.push(f);
  }
  const g = GASOLINA[cc];
  const orden = [g, "diesel" as Comb, ...d.combustibles.filter((k) => k !== g && k !== "diesel")].filter((k) => d.combustibles.includes(k));
  const todas = [...ciudades.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, p.locale));
  const z: PaisZonas = {
    cc,
    p,
    T,
    combustibles: d.combustibles,
    orden,
    actualizado: d.actualizado,
    filas: d.e,
    regiones: [...regiones.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, p.locale)),
    ciudades: todas.filter((c) => c.filas.length >= 2),
    todas,
  };
  cache.set(cc, z);
  return z;
}

/** Páginas de un país para getStaticPaths (si no hay datos, ninguna). */
export function rutasZonas(cc: string) {
  if (!PAISES_Z.includes(cc)) return [];
  const z = zonas(cc);
  return [
    { params: { ruta: undefined }, props: { z } },
    ...z.regiones.map((r) => ({ params: { ruta: r.slug }, props: { z, r } })),
    ...z.ciudades.map((c) => ({ params: { ruta: `${c.region.slug}/${c.slug}` }, props: { z, r: c.region, c } })),
  ];
}

export const urlZonas = (z: PaisZonas) => `/${z.p.cc}/${z.T.slug}/`;
export const urlRegion = (z: PaisZonas, r: Region) => `${urlZonas(z)}${r.slug}/`;
export const urlCiudad = (z: PaisZonas, c: Ciudad) => `${urlZonas(z)}${c.region.slug}/${c.slug}/`;
/** Zonas del país de una sección de la web (/fr/ → Francia), si las tiene. */
export const zonasDe = (p: Pais) => (PAISES_Z.includes(p.cc.toUpperCase()) ? zonas(p.cc.toUpperCase()) : null);

/** El mapa del país encuadrado en unas gasolineras (?b=oeste,sur,este,norte). */
export function urlEnMapaZ(z: PaisZonas, filas: Fila[]): string {
  const base = urlMapa(z.p);
  if (!filas.length) return base;
  const r = (x: number) => Math.round(x * 1000) / 1000;
  const b = [Math.min(...filas.map((f) => f[1])), Math.min(...filas.map((f) => f[0])), Math.max(...filas.map((f) => f[1])), Math.max(...filas.map((f) => f[0]))];
  // Una sola gasolinera: un poco de margen alrededor para que se vea dónde está.
  const m = b[2] - b[0] < 0.01 ? 0.02 : 0;
  return `${base}?b=${[b[0] - m, b[1] - m, b[2] + m, b[3] + m].map(r).join(",")}`;
}

export interface Cifras { media: number; min: number; max: number; n: number }
export function cifras(z: PaisZonas, filas: Fila[], k: Comb): Cifras | null {
  const i = z.combustibles.indexOf(k);
  const v = filas.map((f) => f[6][i]).filter((x): x is number => x != null);
  if (i < 0 || !v.length) return null;
  return { media: v.reduce((a, b) => a + b, 0) / v.length, min: Math.min(...v), max: Math.max(...v), n: v.length };
}
export const precio = (z: PaisZonas, f: Fila, k: Comb) => f[6][z.combustibles.indexOf(k)] ?? null;
/** Las `n` más baratas de un carburante. */
export const baratas = (z: PaisZonas, filas: Fila[], k: Comb, n: number) =>
  filas.filter((f) => precio(z, f, k) !== null).sort((a, b) => precio(z, a, k)! - precio(z, b, k)!).slice(0, n);
/** Carburantes que vende alguna de estas gasolineras, en el orden del país. */
export const vendidos = (z: PaisZonas, filas: Fila[]) => z.orden.filter((k) => filas.some((f) => precio(z, f, k) !== null));

/** Para medias nacionales y «las más baratas del país»: sin Córcega (otros impuestos), como en el mapa. */
const [O, S, E, N] = [0, 1, 2, 3];
export const continental = (z: PaisZonas) => {
  const l = LIMITES[z.cc];
  return z.filas.filter((f) => !(z.cc === "FR" && f[5].startsWith("20")) && (!l || (f[1] >= l[O] && f[1] <= l[E] && f[0] >= l[S] && f[0] <= l[N])));
};

/** Las ciudades con página más cercanas a una (por la posición media de sus gasolineras). */
export function cercanas(z: PaisZonas, c: Ciudad, n = 8): Ciudad[] {
  const centro = (x: Ciudad) => [x.filas.reduce((a, f) => a + f[0], 0) / x.filas.length, x.filas.reduce((a, f) => a + f[1], 0) / x.filas.length];
  const [la, lo] = centro(c);
  const k = Math.cos((la * Math.PI) / 180);
  return z.ciudades
    .filter((x) => x !== c)
    .map((x) => {
      const [a, b] = centro(x);
      return { x, d: Math.hypot(a - la, (b - lo) * k) };
    })
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map((y) => y.x);
}

/** Precio en €/l con el formato del país («1,749 €/l»). */
export const eurZ = (z: PaisZonas, x: number) => `${new Intl.NumberFormat(z.p.locale, { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(x)} €/l`;
/** Diferencia en céntimos («4,2»). */
export const cts = (z: PaisZonas, x: number) => new Intl.NumberFormat(z.p.locale, { maximumFractionDigits: 1 }).format(Math.abs(x * 100));
export const fechaZ = (z: PaisZonas, iso: string) => new Intl.DateTimeFormat(z.p.locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso.slice(0, 10)}T12:00:00Z`));
export const fechaCorta = (z: PaisZonas, iso: string) => new Intl.DateTimeFormat(z.p.locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso.slice(0, 10)}T12:00:00Z`));

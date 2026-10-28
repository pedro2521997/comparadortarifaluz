// Marcas de gasolineras para los iconos del mapa y de las fichas: cada una con su nombre bien escrito, unas
// letras y sus colores. No son los logotipos (son marcas registradas): es una insignia con los colores de la marca
// para reconocerla de un vistazo. Las que no están salen con la inicial en gris.

export interface Marca {
  id: string;
  nombre: string;
  /** Letras de la insignia (1-3) */
  t: string;
  bg: string;
  fg: string;
}

// [palabras con las que empieza o que contiene el rótulo (en mayúsculas, sin tildes), nombre, letras, fondo, texto]
const LISTA: [string[], string, string, string, string][] = [
  [["REPSOL"], "Repsol", "R", "#F06C00", "#ffffff"],
  [["CAMPSA"], "Campsa", "C", "#C8102E", "#ffffff"],
  [["PETRONOR"], "Petronor", "P", "#007A3D", "#ffffff"],
  [["MOEVE"], "Moeve", "M", "#00453F", "#C6F432"],
  [["CEPSA"], "Cepsa", "C", "#E2231A", "#ffffff"],
  [["GALP"], "Galp", "G", "#FF5A00", "#ffffff"],
  [["BALLENOIL"], "Ballenoil", "B", "#0067B1", "#ffffff"],
  [["PLENERGY", "PLENOIL"], "Plenergy", "P", "#1F9E4A", "#ffffff"],
  [["SHELL"], "Shell", "S", "#FFD100", "#DD1D21"],
  [["PETROPRIX"], "Petroprix", "PX", "#E30613", "#ffffff"],
  [["BP"], "BP", "bp", "#009B3A", "#FFE600"],
  [["CARREFOUR"], "Carrefour", "C", "#004E9F", "#ffffff"],
  [["AVIA"], "Avia", "A", "#E2001A", "#ffffff"],
  [["Q8"], "Q8", "Q8", "#0A3D91", "#FFD200"],
  [["ESCLATOIL"], "Esclatoil", "E", "#E4032E", "#ffffff"],
  [["BONAREA"], "bonÀrea", "bÀ", "#5E9732", "#ffffff"],
  [["VALCARCE"], "Valcarce", "V", "#0055A4", "#ffffff"],
  [["AGLA"], "Agla", "A", "#00539F", "#ffffff"],
  [["ALCAMPO", "AUCHAN"], "Alcampo", "A", "#E30613", "#ffffff"],
  [["ENI", "AGIP"], "Eni", "eni", "#FFD100", "#1a1a1a"],
  [["GASEXPRESS"], "GasExpress", "GX", "#1B75BB", "#ffffff"],
  [["EROSKI"], "Eroski", "E", "#E2001A", "#ffffff"],
  [["BEROIL"], "Beroil", "B", "#003F87", "#ffffff"],
  [["MEROIL"], "Meroil", "M", "#D52B1E", "#ffffff"],
  [["TAMOIL"], "Tamoil", "T", "#F18A00", "#ffffff"],
  [["DISA"], "Disa", "D", "#004A99", "#ffffff"],
  [["NATURGY"], "Naturgy", "N", "#004571", "#F29100"],
  [["IDS"], "IDS", "IDS", "#1D4F91", "#ffffff"],
  [["PETROCAT"], "Petrocat", "PC", "#F7A600", "#1a1a1a"],
  [["AUTONETOIL", "AUTONET OIL"], "Autonet&Oil", "AO", "#E30613", "#ffffff"],
  [["EASYGAS"], "Easygas", "EG", "#00A0DF", "#ffffff"],
  [["GM OIL", "GMOIL"], "GM Oil", "GM", "#0D2C6C", "#ffffff"],
  [["PETROMIRALLES"], "Petromiralles", "PM", "#003E7E", "#ffffff"],
  [["SUPECO"], "Supeco", "S", "#E2001A", "#ffffff"],
  [["E LECLERC", "LECLERC"], "E.Leclerc", "L", "#0066B3", "#ffffff"],
  [["INTERMARCHE"], "Intermarché", "I", "#E2001A", "#ffffff"],
  [["TOTALENERGIES", "TOTAL"], "TotalEnergies", "T", "#ED0000", "#ffffff"],
  [["ESSO"], "Esso", "E", "#E31837", "#ffffff"],
  [["PRIO"], "Prio", "P", "#00A651", "#ffffff"],
  [["LIDL"], "Lidl", "L", "#0050AA", "#FFF000"],
  [["ALDI"], "Aldi", "A", "#00005F", "#ffffff"],
  [["MAKRO"], "Makro", "M", "#003D7D", "#FFD400"],
  [["COSTCO"], "Costco", "C", "#E31837", "#ffffff"],
  [["IP"], "IP", "IP", "#FFD100", "#004A99"],
];

export const OTRA: Marca = { id: "x", nombre: "", t: "", bg: "#475569", fg: "#ffffff" };

const norm = (s: string) =>
  ` ${s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()} `;

const MARCAS: { claves: string[]; m: Marca }[] = LISTA.map(([claves, nombre, t, bg, fg]) => ({ claves: claves.map((c) => ` ${c} `), m: { id: norm(claves[0]).trim().replace(/ /g, "-").toLowerCase(), nombre, t, bg, fg } }));

/** Marca de un rótulo («BP ROMICA» → BP; «ESTACIÓN DE SERVICIO REPSOL» → Repsol), o null si no es ninguna conocida. */
export function marca(rotulo: string): Marca | null {
  const n = norm(rotulo);
  if (n.length < 3) return null;
  for (const { claves, m } of MARCAS) if (claves.some((c) => n.includes(c))) return m;
  return null;
}

/** Insignia para un rótulo: la de su marca o una genérica con la inicial. */
export function insignia(rotulo: string): Marca {
  const m = marca(rotulo);
  if (m) return m;
  const inicial = norm(rotulo).trim().charAt(0);
  return { ...OTRA, id: inicial ? `x-${inicial.toLowerCase()}` : "x", t: inicial };
}

/** Nombre para enseñar: el de la marca si el rótulo es solo la marca («REPSOL» → «Repsol»), si no el rótulo tal cual. */
export function nombreMarca(rotulo: string): string {
  const m = marca(rotulo);
  return m && norm(rotulo) === norm(m.nombre) ? m.nombre : rotulo;
}

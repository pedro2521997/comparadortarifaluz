// Perfil de consumo guardado SOLO en el navegador del usuario (localStorage) para pasarlo
// del comparador a la calculadora solar. Nunca se envía a ningún servidor.

export interface PerfilConsumo {
  /** kWh al año (extrapolado si el fichero cubre menos de un año) */
  anualKwh: number;
  /** kWh medios por mes (0–11) y hora (0–23) */
  mesHora: number[][];
  desde: string;
  hasta: string;
  /** Precio medio de la energía que pagas (€/kWh sin impuestos), si se conoce */
  precioEnergia?: number;
  guardado: string;
}

const CLAVE = "lst-perfil-consumo";

export function guardarPerfil(p: PerfilConsumo) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(p));
  } catch {
    /* modo privado o almacenamiento bloqueado: la calculadora pedirá el dato a mano */
  }
}

export function leerPerfil(): PerfilConsumo | null {
  try {
    const t = localStorage.getItem(CLAVE);
    return t ? (JSON.parse(t) as PerfilConsumo) : null;
  } catch {
    return null;
  }
}

export function borrarPerfil() {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    /* nada que borrar */
  }
}

/** Construye el perfil mes × hora a partir de lecturas horarias. */
export function perfilDesdeLecturas(lecturas: { fecha: string; hora: number; kwh: number }[]): Omit<PerfilConsumo, "guardado" | "precioEnergia"> {
  const suma = Array.from({ length: 12 }, () => new Array(24).fill(0));
  const n = Array.from({ length: 12 }, () => new Array(24).fill(0));
  let total = 0;
  const dias = new Set<string>();
  for (const l of lecturas) {
    const m = Number(l.fecha.slice(5, 7)) - 1;
    suma[m][l.hora] += l.kwh;
    n[m][l.hora]++;
    total += l.kwh;
    dias.add(l.fecha);
  }
  // Meses sin datos: se rellenan con la media de los meses que sí hay.
  const conDatos = suma.map((_, m) => n[m].some((x) => x > 0));
  const mediaHora = new Array(24).fill(0).map((_, h) => {
    let s = 0, c = 0;
    for (let m = 0; m < 12; m++) if (n[m][h]) { s += suma[m][h] / n[m][h]; c++; }
    return c ? s / c : 0;
  });
  const mesHora = suma.map((fila, m) => fila.map((s, h) => (conDatos[m] && n[m][h] ? s / n[m][h] : mediaHora[h])));
  const ordenadas = [...dias].sort();
  return {
    anualKwh: (total / dias.size) * 365,
    mesHora,
    desde: ordenadas[0],
    hasta: ordenadas[ordenadas.length - 1],
  };
}

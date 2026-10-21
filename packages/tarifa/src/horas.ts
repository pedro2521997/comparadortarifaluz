// Utilidades para el precio por horas: mejores franjas y etiquetas barata / normal / cara.

export interface Franja {
  /** Hora de inicio (0–23) */
  inicio: number;
  /** Duración en horas */
  horas: number;
  /** Precio medio €/kWh en la franja */
  media: number;
}

/** Franja de `horas` seguidas con el precio medio más bajo (o más alto si `cara`). */
export function mejorFranja(precios: number[], horas: number, cara = false): Franja | null {
  if (precios.length < horas || horas < 1) return null;
  let mejor: Franja | null = null;
  for (let i = 0; i + horas <= precios.length; i++) {
    const media = precios.slice(i, i + horas).reduce((a, b) => a + b, 0) / horas;
    if (!mejor || (cara ? media > mejor.media : media < mejor.media)) mejor = { inicio: i, horas, media };
  }
  return mejor;
}

export type Nivel = "barata" | "normal" | "cara";

/** Clasifica cada hora por terciles del propio día. */
export function nivelesDelDia(precios: number[]): Nivel[] {
  const ordenados = [...precios].sort((a, b) => a - b);
  const t1 = ordenados[Math.floor(ordenados.length / 3)];
  const t2 = ordenados[Math.floor((ordenados.length * 2) / 3)];
  return precios.map((p) => (p < t1 ? "barata" : p >= t2 ? "cara" : "normal"));
}

export const hh = (h: number) => `${String(h % 24).padStart(2, "0")}:00`;

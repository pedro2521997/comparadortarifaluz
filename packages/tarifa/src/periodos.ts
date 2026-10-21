// Periodos de la tarifa 2.0TD (península, Baleares y Canarias).
// Ceuta y Melilla tienen otro horario [verificar] y aún no se soportan.

export type PeriodoEnergia = 1 | 2 | 3;

/** Día de la semana de una fecha ISO (0 = domingo) sin depender de la zona horaria. */
export function diaSemana(fecha: string): number {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function esFinDeSemanaOFestivo(fecha: string, festivos: ReadonlySet<string>): boolean {
  const dia = diaSemana(fecha);
  return dia === 0 || dia === 6 || festivos.has(fecha);
}

/**
 * Periodo de energía para la hora de reloj que empieza en `hora` (0–23).
 * P1 punta: 10–14 y 18–22 · P2 llano: 8–10, 14–18 y 22–24 · P3 valle: 0–8, fines de semana y festivos.
 */
export function periodoEnergia(fecha: string, hora: number, festivos: ReadonlySet<string>): PeriodoEnergia {
  if (esFinDeSemanaOFestivo(fecha, festivos) || hora < 8) return 3;
  if ((hora >= 10 && hora < 14) || (hora >= 18 && hora < 22)) return 1;
  return 2;
}

/** Periodo de potencia: P1 de 8 a 24 h en laborables, P2 el resto. */
export function periodoPotencia(fecha: string, hora: number, festivos: ReadonlySet<string>): 1 | 2 {
  return esFinDeSemanaOFestivo(fecha, festivos) || hora < 8 ? 2 : 1;
}

export const NOMBRE_PERIODO: Record<PeriodoEnergia, string> = { 1: "punta", 2: "llano", 3: "valle" };

/** Suma `n` días a una fecha ISO. */
export function sumarDias(fecha: string, n: number): string {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Días entre dos fechas ISO, ambas incluidas. */
export function diasEntre(desde: string, hasta: string): number {
  const a = Date.parse(desde + "T00:00:00Z");
  const b = Date.parse(hasta + "T00:00:00Z");
  return Math.round((b - a) / 86_400_000) + 1;
}

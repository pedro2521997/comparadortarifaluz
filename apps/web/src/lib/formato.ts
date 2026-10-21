// Formato de números y fechas en español. Se usa en el servidor y en el navegador.

const nf = (min: number, max = min) =>
  new Intl.NumberFormat("es-ES", { minimumFractionDigits: min, maximumFractionDigits: max, useGrouping: true });

const euro0 = nf(0);
const euro2 = nf(2);
const precio3 = nf(3);
const kwh1 = nf(0, 1);

/** 1234.5 → "1.235 €" (sin decimales) */
export const eur = (n: number) => `${euro0.format(Math.round(n))} €`;
/** 12.345 → "12,35 €" */
export const eur2 = (n: number) => `${euro2.format(n)} €`;
/** Precio de la energía: 0.12345 → "0,123 €/kWh" */
export const ekwh = (n: number) => `${precio3.format(n)} €/kWh`;
export const kwh = (n: number) => `${kwh1.format(n)} kWh`;
export const num = (n: number, dec = 0) => nf(0, dec).format(n);
export const pct = (n: number) => `${nf(0, 0).format(n * 100)} %`;

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function partes(fecha: string) {
  const [y, m, d] = fecha.split("-").map(Number);
  const dia = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { y, m, d, dia };
}

/** "2026-10-21" → "miércoles, 21 de octubre de 2026" */
export function fechaLarga(fecha: string): string {
  const { y, m, d, dia } = partes(fecha);
  return `${DIAS[dia]}, ${d} de ${MESES[m - 1]} de ${y}`;
}
/** "2026-10-21" → "21 de octubre de 2026" */
export function fechaMedia(fecha: string): string {
  const { y, m, d } = partes(fecha);
  return `${d} de ${MESES[m - 1]} de ${y}`;
}
/** "2026-10-21" → "21/10/2026" */
export function fechaCorta(fecha: string): string {
  const { y, m, d } = partes(fecha);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}
export function nombreMes(mes: string): string {
  const [y, m] = mes.split("-").map(Number);
  return `${MESES[m - 1]} de ${y}`;
}

/** Fecha de hoy en España peninsular (YYYY-MM-DD). */
export function hoyMadrid(ahora = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid" }).format(ahora);
}
export function horaMadrid(ahora = new Date()): number {
  return Number(new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", hourCycle: "h23" }).format(ahora));
}
export function sumarDias(fecha: string, n: number): string {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** "14" → "14:00" */
export const hh = (h: number) => `${String(h % 24).padStart(2, "0")}:00`;
/** Franja "de 14:00 a 16:00" */
export const franja = (inicio: number, horas: number) => `de ${hh(inicio)} a ${hh(inicio + horas)}`;

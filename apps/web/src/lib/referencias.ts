// Precios de referencia de la luz sacados del catálogo (medianas), para las calculadoras que necesitan
// un precio por defecto cuando el usuario no sabe el suyo.

import { tarifas, factorImpuestos } from "./datos";
import { hoyMadrid } from "./formato";

const mediana = (xs: number[]) => {
  const s = xs.filter((x) => Number.isFinite(x) && x > 0).sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};
const r4 = (x: number) => Math.round(x * 10000) / 10000;

const fijas = tarifas.filter((t) => t.tipo === "fijo" && t.energia);
const porPeriodos = tarifas.filter((t) => t.tipo === "periodos" && t.energia);

export const REFERENCIA = {
  /** €/kWh sin impuestos: mediana de las tarifas de precio único */
  precioUnico: r4(mediana(fijas.map((t) => t.energia!.p1))),
  /** €/kWh sin impuestos: medianas de punta, llano y valle de las tarifas por periodos */
  punta: r4(mediana(porPeriodos.map((t) => t.energia!.p1))),
  llano: r4(mediana(porPeriodos.map((t) => t.energia!.p2))),
  valle: r4(mediana(porPeriodos.map((t) => t.energia!.p3))),
  /** Impuesto eléctrico e IVA de hoy */
  factor: factorImpuestos(hoyMadrid()),
  tarifasUnico: fijas.length,
  tarifasPeriodos: porPeriodos.length,
};

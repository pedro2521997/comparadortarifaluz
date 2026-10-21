// Interpreta el servicio obligatorio de una oferta de la CNMC (texto libre).
// Devuelve { servicio_mes, servicio_sin_precio }: € al mes SIN IVA, o la marca de que no publica precio.
export function servicioObligatorio(texto) {
  if (!texto) return { servicio_mes: 0, servicio_sin_precio: false };
  const t = String(texto).replace(/\s+/g, " ");
  // Primer importe en €/mes: las fichas lo dan sin impuestos y después, a veces, "con IVA".
  const m = t.match(/(\d+[.,]\d{1,2})\s*€\s*\/\s*mes/i);
  if (m) return { servicio_mes: Number(m[1].replace(",", ".")), servicio_sin_precio: false };
  return { servicio_mes: 0, servicio_sin_precio: true };
}

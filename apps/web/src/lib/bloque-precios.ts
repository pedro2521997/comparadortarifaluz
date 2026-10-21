// Bloque completo de precios de un día (resumen + mejores horas + gráfico).
// Se genera en el build y se regenera en el navegador si el dato del build ya no es el del día.

import { graficoHoras, mejoresHoras, resumen } from "./grafico";
import { ekwh, hh, fechaLarga } from "./formato";

/** "0,123" + unidad pequeña, para que el valor no se parta en el móvil. */
const v = (p: number) => `${ekwh(p).replace(" €/kWh", "")}<small> €/kWh</small>`;

export function bloquePrecios(fecha: string, precios: (number | null)[], ahora: number | null = null): string {
  const r = resumen(precios);
  const precioAhora = ahora !== null ? precios[ahora] : null;
  const statAhora =
    precioAhora != null
      ? `<div class="stat"><span class="stat__label">Ahora (${hh(ahora!)})</span><span class="stat__value">${v(precioAhora)}</span><span class="stat__sub">${precioAhora < r.media ? "Por debajo de la media del día" : "Por encima de la media del día"}</span></div>`
      : "";
  return `
<div class="grid grid--4 stats">
  ${statAhora}
  <div class="stat"><span class="stat__label">Hora más barata</span><span class="stat__value">${hh(r.min.h)}</span><span class="stat__sub num">${ekwh(r.min.p)}</span></div>
  <div class="stat"><span class="stat__label">Hora más cara</span><span class="stat__value">${hh(r.max.h)}</span><span class="stat__sub num">${ekwh(r.max.p)}</span></div>
  <div class="stat"><span class="stat__label">Media del día</span><span class="stat__value">${v(r.media)}</span><span class="stat__sub">Sin impuestos</span></div>
</div>
<h2 class="h-sec">Las mejores horas para…</h2>
${mejoresHoras(precios)}
<h2 class="h-sec">Precio hora a hora</h2>
<p class="leyenda"><span><span class="pill pill--barata">barata</span> tercio más barato del día</span><span><span class="pill">normal</span></span><span><span class="pill pill--cara">cara</span> tercio más caro</span></p>
${graficoHoras(precios, ahora)}
<p class="fuente"><span>PVPC 2.0TD del ${fechaLarga(fecha)}, peajes y cargos incluidos, sin impuestos.</span><span>Fuente: <a href="https://www.ree.es/es/apidatos" rel="noopener">Red Eléctrica (REData)</a></span></p>`;
}

export function bloqueNoPublicado(fecha: string, manana: boolean): string {
  return `<div class="notice notice--warn" role="status">
<p><strong>Aún no publicado.</strong> Red Eléctrica todavía no ha publicado el precio del ${fechaLarga(fecha)}.</p>
${manana ? "<p>El precio de mañana se publica cada tarde, normalmente a partir de las 20:15. Vuelve a mirar más tarde.</p>" : "<p>Puede ser un fallo temporal de la fuente. No mostramos datos de otro día como si fueran de hoy.</p>"}
<p><a href="${manana ? "/precio-luz-hoy/" : "/precio-luz/"}">${manana ? "Ver el precio de hoy" : "Ver el archivo de precios"}</a></p>
</div>`;
}

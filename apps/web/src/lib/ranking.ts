// Tabla de ranking de tarifas. Funciones puras que devuelven HTML, para usarlas igual en el build
// (página /tarifas/) y en el navegador (comparador). Accesible: el color nunca es la única señal.

import type { Comparacion, Factura, Tarifa } from "@lst/tarifa";
import { eur2, eur, num, fechaCorta } from "./formato";

export interface Fila extends Comparacion {
  /** Total extrapolado a un año (365 días) */
  anual: number;
  /** Media mensual (30,4 días) */
  mensual: number;
  /** Precio medio que pagas por kWh, todo incluido */
  eurKwh: number;
  /** Otros conceptos: bono social, impuesto eléctrico, alquiler, cuota, IVA y promociones */
  otros: number;
  /** Diferencia anual con la referencia (tu tarifa o la más barata); positivo = más cara */
  dif: number;
  /** Puesto en el ranking completo (si se muestra una parte) */
  pos?: number;
}

export type ColumnaOrden = "total" | "potencia" | "energia" | "otros" | "eurKwh" | "nombre" | "fecha";

export interface OpcionesTabla {
  idActual?: string | null;
  /** Texto de la referencia de la diferencia: "tu tarifa" o "la más barata" */
  referencia: string;
  orden: ColumnaOrden;
  asc: boolean;
  abiertas?: ReadonlySet<string>;
  hoy: string;
}

const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

// ---------- Nombres de comercializadora ----------

const MARCAS: [RegExp, string][] = [
  [/DOMESTICA GAS Y ELECTRICIDAD/i, "Visalia"],
  [/^ENDESA/i, "Endesa"],
  [/^REPSOL/i, "Repsol"],
  [/^OCTOPUS/i, "Octopus Energy"],
  [/ENI PLENITUDE/i, "Plenitude"],
  [/CIDE HCENERG/i, "CHC Energía"],
  [/ENERGYA VM/i, "Energya VM"],
  [/ENERGYASSET/i, "EnergyAsset"],
  [/FENIE/i, "Fenie Energía"],
  [/NEXUS/i, "Nexus Energía"],
  [/GESTERNOVA/i, "Gesternova"],
  [/ESTABANELL/i, "Estabanell"],
  [/HIDROELECTRICA DE SILLEDA/i, "Hidroeléctrica de Silleda"],
  [/^MET ENERG/i, "MET Energía"],
  [/AGRI-ENERG/i, "Agri-Energía"],
  [/INER ENERGIA CASTILLA/i, "Iner Castilla-La Mancha"],
  [/INER EUSKADI/i, "Iner Euskadi"],
  [/ENERGIA NUFRI/i, "Energía Nufri"],
  [/MASNORTE/i, "Masnorte"],
  [/ADX RENOVABLES/i, "ADX Renovables"],
  [/BIROU GAS/i, "Birou Gas"],
  [/CATGAS/i, "Catgas Energía"],
  [/CORPORACI[OÓ]N ALIMENTARIA GUISSONA/i, "Guissona (bonÀrea)"],
  [/ELEK COMERCIALIZADORA/i, "Elek"],
  [/NOBE SOLUCIONES/i, "Nobe Energía"],
  [/QUANTUM LUX/i, "Quantum Lux"],
  [/^niba$/i, "niba"],
  [/Comercializadora de referencia/i, "Tarifa regulada"],
];

/** Nombre comercial corto: "DOMESTICA GAS Y ELECTRICIDAD SLU" → "Visalia". */
export function marca(comercializadora: string): string {
  for (const [re, nombre] of MARCAS) if (re.test(comercializadora)) return nombre;
  const limpio = comercializadora.replace(/,?\s*\b(S\.?A\.?U?\.?|S\.?L\.?U?\.?|SLU|SAU)\s*$/i, "").trim();
  return limpio === limpio.toUpperCase() ? limpio.toLowerCase().replace(/(^|\s)\p{L}/gu, (m) => m.toUpperCase()) : limpio;
}

const iniciales = (s: string) =>
  s.replace(/\(.*\)/, "").split(/[\s-]+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

/** Nombre del plan en un formato legible (muchos vienen en mayúsculas). */
export function nombrePlan(nombre: string): string {
  const letras = nombre.replace(/[^\p{L}]/gu, "");
  if (letras && letras === letras.toUpperCase() && letras.length > 4) {
    return nombre.toLowerCase().replace(/(^|[\s(-])\p{L}/gu, (m) => m.toUpperCase()).replace(/\b(\d)\.0td\b/gi, "$1.0TD").replace(/\bTd\b/g, "TD");
  }
  return nombre;
}

// ---------- Cálculo de filas ----------

export function aFilas(lista: Comparacion[], idActual?: string | null): Fila[] {
  // Referencia: tu tarifa o, si no, la más barata con el precio completo y comprobado.
  const fiable = (c: Comparacion) => !c.incompleta && !(c.porRevisar && c.tarifa.tipo !== "pvpc");
  const candidatas = lista.filter(fiable).length ? lista.filter(fiable) : lista;
  const ref = (idActual && lista.find((c) => c.tarifa.id === idActual)) || [...candidatas].sort((a, b) => a.factura.total - b.factura.total)[0];
  return lista.map((c) => {
    const f = c.factura;
    const anual = (f.total / f.dias) * 365;
    const anualRef = ref ? (ref.factura.total / ref.factura.dias) * 365 : anual;
    return {
      ...c,
      anual,
      mensual: (f.total / f.dias) * 30.4,
      eurKwh: f.kwh > 0 ? f.total / f.kwh : 0,
      otros: f.total - f.potencia - f.energia,
      dif: anual - anualRef,
    };
  });
}

export function ordenar(filas: Fila[], col: ColumnaOrden, asc: boolean): Fila[] {
  const v = (x: Fila): number | string => {
    switch (col) {
      case "potencia": return x.factura.potencia;
      case "energia": return x.factura.energia;
      case "otros": return x.otros;
      case "eurKwh": return x.eurKwh;
      case "nombre": return `${marca(x.tarifa.comercializadora)} ${x.tarifa.nombre}`.toLowerCase();
      case "fecha": return x.tarifa.fecha_comprobacion ?? "";
      default: return x.factura.total;
    }
  };
  const s = asc ? 1 : -1;
  // Por precio, las que tienen el precio por revisar o incompleto siempre van detrás.
  const detras = (x: Fila) => Number((x.porRevisar && x.tarifa.tipo !== "pvpc") || x.incompleta);
  return [...filas].sort((a, b) => {
    if (col === "total") {
      const d = detras(a) - detras(b);
      if (d) return d;
    }
    const va = v(a), vb = v(b);
    const c = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
    return c * s || a.factura.total - b.factura.total;
  });
}

// ---------- HTML ----------

function tipoTexto(t: Tarifa): string {
  if (t.tipo === "pvpc") return "Regulada (PVPC)";
  if (t.tipo === "fijo") return "Precio único";
  return "3 periodos";
}

function precios(t: Tarifa): string {
  if (t.tipo === "pvpc" || !t.energia || !t.potencia) return `<span class="rk-mini">Precio hora a hora</span>`;
  const e = t.energia;
  const en = t.tipo === "fijo" ? `${num(e.p1, 4)}` : `${num(e.p1, 4)} · ${num(e.p2, 4)} · ${num(e.p3, 4)}`;
  return `<span class="rk-mini"><span title="Energía €/kWh${t.tipo === "fijo" ? "" : ": punta · llano · valle"}">${en} <abbr title="euros por kWh">€/kWh</abbr></span><span title="Potencia €/kW y día: P1 · P2">${num(t.potencia.p1, 6)} · ${num(t.potencia.p2, 6)} <abbr title="euros por kW y día">€/kW·día</abbr></span></span>`;
}

export function insignias(t: Tarifa, porRevisar: boolean, esActual: boolean, incompleta = false): string {
  const i = t.info ?? {};
  const b: string[] = [];
  if (esActual) b.push(`<span class="pill pill--canopy">Tu tarifa</span>`);
  if (porRevisar && t.tipo !== "pvpc" && t.id !== "otra") b.push(`<span class="pill pill--aviso">Por revisar</span>`);
  if (incompleta) b.push(`<span class="pill pill--aviso">Servicio sin precio publicado</span>`);
  if (t.comision) b.push(`<span class="pill pill--aviso">Enlace con comisión</span>`);
  if (t.permanencia_meses > 0) b.push(`<span class="pill">Permanencia</span>`);
  if (t.servicios_obligatorios.length || i.servicios_adicionales) b.push(`<span class="pill">Con servicios</span>`);
  if (i.descuento_energia || i.promo_primer_anio_eur) b.push(`<span class="pill pill--barata">Promo 1.er año</span>`);
  if (i.horario_propio) b.push(`<span class="pill pill--aviso">Horario propio</span>`);
  if (i.verde) b.push(`<span class="pill">100 % renovable</span>`);
  return b.join("");
}

function difHtml(f: Fila, esActual: boolean, referencia: string): string {
  if (esActual) return `<span class="rk-ref">Referencia</span>`;
  if (Math.abs(f.dif) < 0.5) return `<span class="rk-ref">Igual que ${referencia}</span>`;
  const mas = f.dif > 0;
  return `<span class="rk-dif ${mas ? "rk-dif--mas" : "rk-dif--menos"}"><span class="rk-dif__t">${mas ? "Más cara" : "Más barata"}</span> <strong>${eur(Math.abs(f.dif))}</strong>/año <span class="rk-mini">${eur2(Math.abs(f.dif) / 12)}/mes</span></span>`;
}

function desglose(f: Factura): string {
  const fila = (t: string, v: number) => `<tr><td>${t}</td><td class="r num">${eur2(v)}</td></tr>`;
  return `<table class="desglose"><caption class="sr-only">Desglose de la factura</caption><tbody>
    ${fila("Potencia", f.potencia)}
    ${fila("Energía", f.energia)}
    ${f.cuotaFija ? fila("Cuota fija", f.cuotaFija) : ""}
    ${f.servicios ? fila("Servicios obligatorios", f.servicios) : ""}
    ${f.bonoSocial ? fila("Financiación del bono social", f.bonoSocial) : `<tr><td>Financiación del bono social</td><td class="r">incluida en el precio</td></tr>`}
    ${fila("Impuesto eléctrico", f.iee)}
    ${fila("Alquiler del contador", f.alquiler)}
    ${fila("IVA", f.iva)}
    ${f.promociones ? fila("Promoción primer año", -f.promociones) : ""}
    <tr class="total"><td>Total (${f.dias} días, ${num(f.kwh)} kWh)</td><td class="r num">${eur2(f.total)}</td></tr>
  </tbody></table>`;
}

function condiciones(t: Tarifa): string {
  const i = t.info ?? {};
  const li: string[] = [];
  if (t.tipo !== "pvpc" && t.energia && t.potencia) {
    li.push(`<strong>Energía:</strong> ${t.tipo === "fijo" ? `${num(t.energia.p1, 6)} €/kWh las 24 horas` : `punta ${num(t.energia.p1, 6)}, llano ${num(t.energia.p2, 6)} y valle ${num(t.energia.p3, 6)} €/kWh`}.`);
    li.push(`<strong>Potencia:</strong> P1 ${num(t.potencia.p1, 6)} y P2 ${num(t.potencia.p2, 6)} €/kW·día (${num(t.potencia.p1 * 365, 2)} y ${num(t.potencia.p2 * 365, 2)} €/kW·año).`);
  }
  if (t.servicio_mes) li.push(`<strong>Servicio obligatorio:</strong> ${eur2(t.servicio_mes)} al mes sin IVA (incluido en el cálculo).`);
  if (t.info?.servicio_sin_precio) li.push(`<strong>Servicio obligatorio sin precio publicado:</strong> el total de la tabla no lo incluye, por eso va al final.`);
  if (t.cuota_fija_mes) li.push(`<strong>Cuota fija:</strong> ${eur2(t.cuota_fija_mes)} al mes.`);
  li.push(`<strong>Permanencia:</strong> ${t.permanencia_meses ? `sí${i.penalizacion ? `. ${esc(i.penalizacion)}` : ""}` : "no"}.`);
  if (t.servicios_obligatorios.length) li.push(`<strong>Servicios obligatorios:</strong> ${t.servicios_obligatorios.map(esc).join(", ")}.`);
  else if (i.servicios_adicionales) li.push(`<strong>Servicios adicionales:</strong> la oferta incluye o exige algún servicio (mantenimiento, asistencia…). Revisa la ficha.`);
  if (i.descuento_energia) li.push(`<strong>Promoción:</strong> ${Math.round(i.descuento_energia.pct * 100)} % de descuento en la energía durante ${i.descuento_energia.meses} meses.`);
  if (i.promo_primer_anio_eur) li.push(`<strong>Promoción:</strong> unos ${eur(i.promo_primer_anio_eur)} de ahorro el primer año según la CNMC.`);
  if (i.validez) li.push(`<strong>Validez:</strong> ${esc(i.validez)}.`);
  if (i.limitaciones) li.push(`<strong>Para quién:</strong> ${esc(i.limitaciones)}.`);
  if (i.potencia_max_kw) li.push(`<strong>Potencia máxima:</strong> ${num(i.potencia_max_kw)} kW.`);
  if (i.consumo_max_kwh && i.consumo_max_kwh < 50000) li.push(`<strong>Consumo máximo:</strong> ${num(i.consumo_max_kwh)} kWh al año.`);
  if (i.revision) li.push(`<strong>Revisión de precios:</strong> ${esc(i.revision)}.`);
  if (i.contratacion) {
    const c = [i.contratacion.internet && "internet", i.contratacion.telefono && "teléfono", i.contratacion.oficina && "oficina"].filter(Boolean);
    if (c.length) li.push(`<strong>Contratación:</strong> ${c.join(", ")}.`);
  }
  if (i.horario_propio) li.push(`<strong>Ojo:</strong> las horas baratas las eliges tú; lo calculamos con los periodos 2.0TD estándar, así que es aproximado.`);
  const origen = t.origen === "cnmc" ? "comparador oficial de la CNMC" : t.origen === "regulada" ? "Red Eléctrica y BOE" : "web de la comercializadora";
  const fuente = t.url_fuente
    ? `Fuente: <a href="${esc(t.url_fuente)}" rel="noopener" target="_blank">${origen}</a>${t.fecha_comprobacion ? `, comprobado el ${fechaCorta(t.fecha_comprobacion)}` : ", sin comprobar"}.`
    : "";
  return `<ul class="rk-cond">${li.map((x) => `<li>${x}</li>`).join("")}</ul>
    ${t.notas ? `<details class="rk-letra"><summary>Letra pequeña de la oferta</summary><p class="small">${esc(t.notas)}</p></details>` : ""}
    <p class="caption">${fuente}</p>`;
}

function detalle(f: Fila, esActual: boolean): string {
  const t = f.tarifa;
  const i = t.info ?? {};
  const contratar = !esActual && t.url_contratar
    ? `<a class="btn btn--small" href="${esc(t.url_contratar)}" rel="noopener${t.comision ? " sponsored" : ""}" target="_blank">Ver la oferta en ${esc(marca(t.comercializadora))}</a>${t.comision ? ` <span class="caption">Enlace con comisión: si contratas, nos pagan. No cambia el orden.</span>` : ""}`
    : "";
  return `<div class="rk-detalle">
    <div>${desglose(f.factura)}${f.factura.avisos.length ? `<ul class="small rk-avisos">${f.factura.avisos.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>` : ""}</div>
    <div><p class="rk-legal">${esc(t.comercializadora)}</p>${condiciones(t)}
      <p class="btn-row" style="margin-top:12px">${contratar}${i.url_contrato ? `<a class="btn btn--ghost btn--small" href="${esc(i.url_contrato)}" rel="noopener" target="_blank">Condiciones del contrato</a>` : ""}</p></div>
  </div>`;
}

const COLS: { k: ColumnaOrden | null; t: string; c?: string }[] = [
  { k: null, t: "#" },
  { k: "nombre", t: "Tarifa" },
  { k: null, t: "Tipo y precios" },
  { k: "potencia", t: "Potencia", c: "r" },
  { k: "energia", t: "Energía", c: "r" },
  { k: "otros", t: "Impuestos y otros", c: "r" },
  { k: "total", t: "Total del periodo", c: "r" },
  { k: null, t: "Comparada con", c: "" },
  { k: "eurKwh", t: "€/kWh medio", c: "r" },
  { k: "total", t: "Media al mes", c: "r" },
];

export function tablaRanking(filas: Fila[], o: OpcionesTabla): string {
  const abiertas = o.abiertas ?? new Set<string>();
  const cab = COLS.map((c, i) => {
    const titulo = i === 7 ? `Comparada con ${o.referencia}` : c.t;
    if (!c.k) return `<th scope="col" class="${c.c ?? ""}">${titulo}</th>`;
    const activa = c.k === o.orden && (i !== 9 || o.orden !== "total");
    const aria = activa ? (o.asc ? "ascending" : "descending") : "none";
    return `<th scope="col" class="${c.c ?? ""}" aria-sort="${aria}"><button type="button" class="rk-ord" data-orden="${c.k}">${titulo}<span class="rk-flecha" aria-hidden="true">${activa ? (o.asc ? "▲" : "▼") : "↕"}</span></button></th>`;
  }).join("");

  const cuerpo = filas.map((f, i) => {
    const t = f.tarifa;
    const esActual = t.id === o.idActual;
    const abierta = abiertas.has(t.id);
    const m = marca(t.comercializadora);
    return `<tr class="rk-fila${esActual ? " rk-fila--actual" : ""}${(f.porRevisar && t.tipo !== "pvpc") || f.incompleta ? " rk-fila--revisar" : ""}" data-id="${esc(t.id)}">
      <td class="rk-pos" data-label="Puesto"><span>${f.pos ?? i + 1}º</span></td>
      <th scope="row" class="rk-tarifa" data-label="Tarifa"><div class="rk-tarifa__in">
        <span class="rk-logo" aria-hidden="true">${esc(iniciales(m))}</span>
        <span class="rk-nombre"><span class="rk-marca">${esc(m)}</span><span class="rk-plan">${esc(nombrePlan(t.nombre))}</span><span class="rk-badges">${insignias(t, f.porRevisar, esActual, f.incompleta)}</span></span>
      </div></th>
      <td data-label="Tipo y precios"><span class="rk-tipo">${tipoTexto(t)}</span>${precios(t)}</td>
      <td class="r num" data-label="Potencia">${eur2(f.factura.potencia)}</td>
      <td class="r num" data-label="Energía">${eur2(f.factura.energia)}</td>
      <td class="r num" data-label="Impuestos y otros">${eur2(f.otros)}</td>
      <td class="r num rk-total" data-label="Total del periodo"><strong>${eur2(f.factura.total)}</strong><span class="rk-mini">${eur(f.anual)}/año</span></td>
      <td data-label="Comparada con ${esc(o.referencia)}">${difHtml(f, esActual, o.referencia)}</td>
      <td class="r num" data-label="€/kWh medio">${num(f.eurKwh, 3)}</td>
      <td class="r num rk-mes" data-label="Media al mes"><strong>${eur2(f.mensual)}</strong>
        <button type="button" class="rk-ver" aria-expanded="${abierta}" aria-controls="rk-d-${esc(t.id)}" data-ver="${esc(t.id)}">${abierta ? "Ocultar" : "Ver detalle"}</button></td>
    </tr>
    <tr class="rk-det" id="rk-d-${esc(t.id)}"${abierta ? "" : " hidden"}><td colspan="${COLS.length}">${abierta ? detalle(f, esActual) : ""}</td></tr>`;
  }).join("");

  return `<div class="rk-scroll"><table class="rk-tabla">
    <caption class="sr-only">Ranking de tarifas, ordenado por ${o.orden === "total" ? "precio total" : o.orden}</caption>
    <thead>
      <tr class="rk-grupos" aria-hidden="true"><th colspan="3">Tarifa</th><th colspan="4" class="r">Factura del periodo</th><th>Ahorro</th><th colspan="2" class="r">Media</th></tr>
      <tr>${cab}</tr>
    </thead>
    <tbody>${cuerpo}</tbody>
  </table></div>`;
}

export function detalleHtml(f: Fila, idActual: string | null | undefined): string {
  return detalle(f, f.tarifa.id === idActual);
}

/** CSV del ranking (separador ;, coma decimal) para descargar. */
export function csvRanking(filas: Fila[]): string {
  const n = (x: number, d = 2) => x.toFixed(d).replace(".", ",");
  const cab = ["Puesto", "Comercializadora", "Tarifa", "Tipo", "Energía P1 €/kWh", "Energía P2 €/kWh", "Energía P3 €/kWh", "Potencia P1 €/kW·día", "Potencia P2 €/kW·día", "Potencia €", "Energía €", "Impuestos y otros €", "Total €", "Total anual €", "Media mensual €", "€/kWh medio", "Diferencia anual €", "Permanencia", "Fuente", "Comprobado"];
  const filasCsv = filas.map((f, i) => {
    const t = f.tarifa;
    return [i + 1, t.comercializadora, t.nombre, tipoTexto(t), t.energia ? n(t.energia.p1, 6) : "", t.energia ? n(t.energia.p2, 6) : "", t.energia ? n(t.energia.p3, 6) : "", t.potencia ? n(t.potencia.p1, 6) : "", t.potencia ? n(t.potencia.p2, 6) : "", n(f.factura.potencia), n(f.factura.energia), n(f.otros), n(f.factura.total), n(f.anual), n(f.mensual), n(f.eurKwh, 4), n(f.dif), t.permanencia_meses ? "Sí" : "No", t.url_fuente, t.fecha_comprobacion ?? ""]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";");
  });
  return "﻿" + [cab.join(";"), ...filasCsv].join("\r\n");
}

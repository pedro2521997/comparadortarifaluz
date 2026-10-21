// Comparador de tarifas con el fichero de consumos. Todo ocurre en el navegador.

import { leerConsumos, leerConMapeo, ocultarCups, type Mapeo, type Lectura } from "@lst/csv";
import {
  compararTarifas,
  calcularFactura,
  repartoPorPeriodos,
  picosDeConsumo,
  desplazarPuntaAValle,
  type Tarifa,
  type Regulados,
  type Comparacion,
  type Factura,
} from "@lst/tarifa";
import { cargarRango } from "../lib/precios-cliente";
import { eur, eur2, kwh, pct, fechaCorta, num, ekwh, sumarDias } from "../lib/formato";
import { guardarPerfil, perfilDesdeLecturas } from "../lib/consumo-local";

interface Datos {
  tarifas: Tarifa[];
  regulados: Regulados;
  festivos: string[];
  hoy: string;
}

const datos: Datos = JSON.parse(document.getElementById("datos-comparador")!.textContent!);
const festivos = new Set(datos.festivos);
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const input = $<HTMLInputElement>("fichero");
const zona = $<HTMLLabelElement>("dropzone");
const estado = $<HTMLDivElement>("estado-fichero");
const mapeoBox = $<HTMLDivElement>("mapeo");
const form = $<HTMLFormElement>("form-datos");
const botonCalcular = $<HTMLButtonElement>("calcular");
const ayudaCalcular = $<HTMLParagraphElement>("calcular-ayuda");
const selActual = $<HTMLSelectElement>("actual");
const otra = $<HTMLFieldSetElement>("otra");
const resultado = $<HTMLDivElement>("resultado");

let lecturas: Lectura[] | null = null;
let textoFichero = "";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

// ---------- Lectura del fichero ----------

function mostrarEstado(html: string, tipo: "ok" | "warn" | "error") {
  const clase = tipo === "ok" ? "notice" : tipo === "warn" ? "notice notice--warn" : "notice notice--error";
  estado.innerHTML = `<div class="${clase}">${html}</div>`;
}

function aceptarLecturas(l: Lectura[], cups: string | null, desde: string, hasta: string, avisos: string[]) {
  lecturas = l;
  const total = l.reduce((a, x) => a + x.kwh, 0);
  const dias = Math.round((Date.parse(hasta) - Date.parse(desde)) / 86_400_000) + 1;
  const avisosHtml = avisos.length ? `<ul class="small">${avisos.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>` : "";
  const corto = dias < 28 ? `<p class="small"><strong>Ojo:</strong> el fichero cubre solo ${dias} días. Para comparar bien, mejor un año entero.</p>` : "";
  mostrarEstado(
    `<p><strong>Fichero leído:</strong> ${num(l.length)} horas del ${fechaCorta(desde)} al ${fechaCorta(hasta)} (${dias} días), ${kwh(total)} en total${cups ? ` · CUPS ${esc(ocultarCups(cups))}` : ""}.</p>${corto}${avisosHtml}`,
    dias < 28 ? "warn" : "ok",
  );
  mapeoBox.hidden = true;
  botonCalcular.disabled = false;
  ayudaCalcular.textContent = "El cálculo se hace en tu navegador. Tarda unos segundos si hay que traer los precios PVPC.";
}

function procesar(texto: string) {
  textoFichero = texto;
  const r = leerConsumos(texto);
  if (r.ok) return aceptarLecturas(r.lecturas, r.cups, r.desde, r.hasta, r.avisos);
  lecturas = null;
  botonCalcular.disabled = true;
  if (r.cabecera) {
    mostrarEstado(`<p><strong>No reconocemos este formato automáticamente.</strong> ${esc(r.error)}</p>`, "warn");
    pedirMapeo(r.cabecera, r.muestra ?? [], r.mapeoParcial ?? {});
  } else {
    mostrarEstado(`<p><strong>No hemos podido leer el fichero.</strong> ${esc(r.error)}</p><p class="small">Si es de una distribuidora que no reconocemos, escríbenos y nos mandas un ejemplo anonimizado.</p>`, "error");
  }
}

function pedirMapeo(cabecera: string[], muestra: string[][], parcial: Partial<Mapeo>) {
  const opciones = (sel: number, vacia: string | null) =>
    (vacia !== null ? `<option value="-1">${vacia}</option>` : "") +
    cabecera.map((c, i) => `<option value="${i}" ${i === sel ? "selected" : ""}>${esc(c || `Columna ${i + 1}`)} (p. ej. «${esc(muestra[0]?.[i] ?? "")}»)</option>`).join("");
  mapeoBox.hidden = false;
  mapeoBox.innerHTML = `
  <div class="card stack" style="--stack:12px;margin-top:16px">
    <h3>¿Qué es cada columna?</h3>
    <div class="mapeo-grid">
      <div class="field"><label for="m-fecha">Fecha</label><select id="m-fecha">${opciones(parcial.colFecha ?? 0, null)}</select></div>
      <div class="field"><label for="m-hora">Hora</label><select id="m-hora">${opciones(parcial.colHora ?? -1, "Va junto a la fecha")}</select></div>
      <div class="field"><label for="m-kwh">Consumo</label><select id="m-kwh">${opciones(parcial.colKwh ?? Math.min(2, cabecera.length - 1), null)}</select></div>
      <div class="field"><label for="m-unidad">Unidad</label><select id="m-unidad"><option value="kWh">kWh</option><option value="Wh">Wh</option></select></div>
    </div>
    <button type="button" class="btn btn--small" id="m-aplicar">Leer con estas columnas</button>
  </div>`;
  $("m-aplicar").addEventListener("click", () => {
    const val = (id: string) => Number(($(id) as HTMLSelectElement).value);
    const r = leerConMapeo(textoFichero, {
      separador: parcial.separador ?? ";",
      filaCabecera: parcial.filaCabecera ?? 0,
      colFecha: val("m-fecha"),
      colHora: val("m-hora"),
      colKwh: val("m-kwh"),
      colCups: parcial.colCups ?? -1,
      unidad: ($("m-unidad") as HTMLSelectElement).value as "kWh" | "Wh",
    });
    if (r.ok) aceptarLecturas(r.lecturas, r.cups, r.desde, r.hasta, r.avisos);
    else mostrarEstado(`<p><strong>Sigue sin cuadrar.</strong> ${esc(r.error)}</p>`, "error");
  });
}

function leerArchivo(f: File) {
  if (f.size > 30 * 1024 * 1024) return mostrarEstado("<p>El fichero es demasiado grande (más de 30 MB).</p>", "error");
  mostrarEstado(`<p>Leyendo ${esc(f.name)}…</p>`, "ok");
  const lector = new FileReader();
  lector.onload = () => {
    let texto = String(lector.result ?? "");
    // Algunos ficheros vienen en Windows-1252: si hay caracteres de reemplazo, se relee.
    if (texto.includes("�")) {
      const r2 = new FileReader();
      r2.onload = () => procesar(String(r2.result ?? ""));
      r2.readAsText(f, "windows-1252");
      return;
    }
    procesar(texto);
  };
  lector.onerror = () => mostrarEstado("<p>No se ha podido abrir el fichero.</p>", "error");
  lector.readAsText(f, "utf-8");
}

input.addEventListener("change", () => input.files?.[0] && leerArchivo(input.files[0]));
for (const ev of ["dragenter", "dragover"]) zona.addEventListener(ev, (e) => { e.preventDefault(); zona.classList.add("is-over"); });
for (const ev of ["dragleave", "drop"]) zona.addEventListener(ev, () => zona.classList.remove("is-over"));
zona.addEventListener("drop", (e) => {
  e.preventDefault();
  const f = (e as DragEvent).dataTransfer?.files?.[0];
  if (f) leerArchivo(f);
});

// Fichero de ejemplo: un hogar tipo de 2–3 personas, un año, con formato Datadis.
$("ejemplo").addEventListener("click", () => {
  const fin = sumarDias(datos.hoy, -2);
  const inicio = sumarDias(fin, -364);
  const lineas = ["CUPS;Fecha;Hora;Consumo_kWh;Metodo_obtencion"];
  let semilla = 7;
  const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
  const base = [0.18, 0.15, 0.14, 0.13, 0.13, 0.14, 0.2, 0.42, 0.38, 0.25, 0.22, 0.24, 0.3, 0.45, 0.52, 0.35, 0.26, 0.28, 0.36, 0.48, 0.66, 0.72, 0.55, 0.32];
  for (let f = inicio; f <= fin; f = sumarDias(f, 1)) {
    const mes = Number(f.slice(5, 7));
    const estacion = [1.35, 1.3, 1.1, 0.95, 0.9, 1.05, 1.25, 1.25, 1.0, 0.95, 1.1, 1.35][mes - 1];
    const [y, m, d] = f.split("-");
    for (let h = 1; h <= 24; h++) {
      const v = base[h - 1] * estacion * (0.75 + azar() * 0.5);
      lineas.push(`ES0021000000000000EJ0F;${y}/${m}/${d};${String(h).padStart(2, "0")}:00;${v.toFixed(3).replace(".", ",")};Real`);
    }
  }
  procesar(lineas.join("\n"));
  $<HTMLInputElement>("p1").value = "4.6";
  $<HTMLInputElement>("p2").value = "4.6";
});

selActual.addEventListener("change", () => {
  otra.hidden = selActual.value !== "otra";
});

// ---------- Cálculo ----------

function tarifaOtra(): Tarifa | null {
  const v = (id: string) => parseFloat(($(id) as HTMLInputElement).value.replace(",", "."));
  const e1 = v("o-e1");
  const p1 = v("o-p1");
  if (!Number.isFinite(e1) || !Number.isFinite(p1)) return null;
  const e2 = Number.isFinite(v("o-e2")) ? v("o-e2") : e1;
  const e3 = Number.isFinite(v("o-e3")) ? v("o-e3") : e1;
  const p2 = Number.isFinite(v("o-p2")) ? v("o-p2") : p1;
  return {
    id: "otra", comercializadora: "Tu tarifa", nombre: "Tu tarifa actual", tipo: e1 === e2 && e2 === e3 ? "fijo" : "periodos",
    potencia: { p1, p2 }, energia: { p1: e1, p2: e2, p3: e3 },
    cuota_fija_mes: Number.isFinite(v("o-cuota")) ? v("o-cuota") : 0,
    permanencia_meses: 0, servicios_obligatorios: [], url_fuente: "", fecha_comprobacion: datos.hoy, comision: false, url_contratar: "",
  };
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!lecturas) return;
  const p1 = parseFloat($<HTMLInputElement>("p1").value);
  const p2 = parseFloat($<HTMLInputElement>("p2").value);
  if (!(p1 > 0 && p2 > 0)) return;

  let catalogo = [...datos.tarifas];
  let idActual = selActual.value;
  if (idActual === "otra") {
    const t = tarifaOtra();
    if (!t) {
      resultado.hidden = false;
      resultado.innerHTML = `<div class="notice notice--error"><p>Escribe al menos el precio de la energía en punta y el de la potencia P1 de tu tarifa.</p></div>`;
      return;
    }
    catalogo = [t, ...catalogo];
  }

  botonCalcular.disabled = true;
  botonCalcular.textContent = "Calculando…";
  resultado.hidden = false;
  resultado.innerHTML = `<div class="notice" role="status"><p>Trayendo los precios PVPC de Red Eléctrica para tus fechas…</p></div>`;

  const desde = lecturas.reduce((a, l) => (l.fecha < a ? l.fecha : a), lecturas[0].fecha);
  const hasta = lecturas.reduce((a, l) => (l.fecha > a ? l.fecha : a), lecturas[0].fecha);
  let pvpc: Record<string, number[]> | undefined;
  try {
    pvpc = await cargarRango(desde, hasta);
    if (Object.keys(pvpc).length === 0) pvpc = undefined;
  } catch {
    pvpc = undefined;
  }

  const ctx = { regulados: datos.regulados, festivos, pvpc };
  const comparacion = compararTarifas(lecturas, catalogo, { p1, p2 }, ctx, datos.hoy);
  pintar(comparacion, idActual, { p1, p2 }, ctx, Boolean(pvpc));

  botonCalcular.disabled = false;
  botonCalcular.textContent = "Volver a calcular";
  resultado.scrollIntoView({ block: "start" });
  resultado.focus({ preventScroll: true });
});

function badges(c: Comparacion, esActual: boolean) {
  const b: string[] = [];
  if (esActual) b.push(`<span class="pill pill--canopy">Tu tarifa</span>`);
  if (c.tarifa.tipo === "pvpc") b.push(`<span class="pill">Regulada · precio por horas</span>`);
  else if (c.tarifa.tipo === "fijo") b.push(`<span class="pill">Precio único</span>`);
  else b.push(`<span class="pill">3 periodos</span>`);
  if (c.porRevisar && c.tarifa.id !== "otra") b.push(`<span class="pill pill--aviso">Precio por revisar</span>`);
  if (c.tarifa.comision) b.push(`<span class="pill pill--aviso">Enlace con comisión</span>`);
  return b.join("");
}

function desglose(f: Factura) {
  const fila = (t: string, v: number) => `<tr><td>${t}</td><td class="r num">${eur2(v)}</td></tr>`;
  return `<table class="desglose"><tbody>
    ${fila("Potencia", f.potencia)}
    ${fila("Energía", f.energia)}
    ${f.cuotaFija ? fila("Cuota fija", f.cuotaFija) : ""}
    ${fila("Financiación del bono social", f.bonoSocial)}
    ${fila("Impuesto eléctrico", f.iee)}
    ${fila("Alquiler del contador", f.alquiler)}
    ${fila("IVA", f.iva)}
    <tr class="total"><td>Total</td><td class="r num">${eur2(f.total)}</td></tr>
  </tbody></table>`;
}

function letraPequena(t: Tarifa) {
  const items = [
    t.permanencia_meses ? `Permanencia de ${t.permanencia_meses} meses.` : "Sin permanencia.",
    t.servicios_obligatorios.length ? `Servicios obligatorios: ${t.servicios_obligatorios.map(esc).join(", ")}.` : "Sin servicios obligatorios.",
    t.tipo !== "pvpc" && t.energia ? `Energía: ${ekwh(t.energia.p1)}${t.tipo === "periodos" ? ` punta, ${ekwh(t.energia.p2)} llano, ${ekwh(t.energia.p3)} valle` : ""}. Potencia: ${num(t.potencia!.p1, 4)} €/kW·día P1, ${num(t.potencia!.p2, 4)} P2.` : "",
    t.notas ? esc(t.notas) : "",
    t.url_fuente ? `Fuente: <a href="${esc(t.url_fuente)}" rel="noopener">${esc(new URL(t.url_fuente).hostname)}</a> · ${t.fecha_comprobacion ? `comprobado el ${fechaCorta(t.fecha_comprobacion)}` : "<strong>sin comprobar todavía</strong>"}.` : "",
  ].filter(Boolean);
  return `<ul class="small">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
}

function pintar(lista: Comparacion[], idActual: string, potencias: { p1: number; p2: number }, ctx: Parameters<typeof calcularFactura>[3], hayPvpc: boolean) {
  const actual = lista.find((c) => c.tarifa.id === idActual) ?? null;
  const mejor = lista.find((c) => c.tarifa.id !== idActual) ?? lista[0];
  const f0 = lista[0].factura;
  const avisoRevisar = mejor.porRevisar && mejor.tarifa.id !== "otra"
    ? `<p class="notice notice--warn small" style="margin-bottom:16px">Ojo: el precio de <strong>${esc(mejor.tarifa.nombre)}</strong> aún no lo hemos comprobado en la web de la comercializadora. Confírmalo antes de contratar.</p>`
    : "";
  const anual = (x: number) => (x / f0.dias) * 365;
  const mensual = (x: number) => (x / f0.dias) * 30.4;

  let cabecera: string;
  if (actual && mejor.factura.total < actual.factura.total) {
    const ahorro = actual.factura.total - mejor.factura.total;
    cabecera = `<p class="answer">Ahorrarías <strong>${eur(anual(ahorro))}</strong> al año</p>
      <p class="lead">Con <strong>${esc(mejor.tarifa.comercializadora)} · ${esc(mejor.tarifa.nombre)}</strong> habrías pagado ${eur2(mejor.factura.total)} entre el ${fechaCorta(f0.desde)} y el ${fechaCorta(f0.hasta)}, ${eur2(ahorro)} menos que con tu tarifa (${eur2(actual.factura.total)}).</p>`;
  } else if (actual) {
    cabecera = `<p class="answer">Tu tarifa ya es <strong>la más barata</strong> de las que comparamos</p>
      <p class="lead">Con tu consumo habrías pagado ${eur2(actual.factura.total)} entre el ${fechaCorta(f0.desde)} y el ${fechaCorta(f0.hasta)}. Revisa los extras de abajo: aún puedes ahorrar cambiando hábitos o potencia.</p>`;
  } else {
    cabecera = `<p class="answer">La más barata para ti: <strong>${eur(anual(mejor.factura.total))}</strong> al año</p>
      <p class="lead">Con <strong>${esc(mejor.tarifa.comercializadora)} · ${esc(mejor.tarifa.nombre)}</strong> habrías pagado ${eur2(mejor.factura.total)} entre el ${fechaCorta(f0.desde)} y el ${fechaCorta(f0.hasta)} (unos ${eur(mensual(mejor.factura.total))} al mes).</p>`;
  }

  const ranking = lista.map((c, i) => {
    const esActual = c.tarifa.id === idActual;
    const dif = actual && !esActual ? c.factura.total - actual.factura.total : null;
    const difHtml = dif === null ? "" : `<span class="tar__dif ${dif > 0 ? "tar__dif--mas" : "tar__dif--menos"}">${dif > 0 ? "+" : "−"}${eur(Math.abs(anual(dif)))}/año</span>`;
    const contratar = c.tarifa.url_contratar && !esActual
      ? `<p style="margin-top:12px"><a class="btn btn--ghost btn--small" href="${esc(c.tarifa.url_contratar)}" rel="noopener${c.tarifa.comision ? " sponsored" : ""}" target="_blank">Contratar en la web de ${esc(c.tarifa.comercializadora)}</a>${c.tarifa.comision ? ` <span class="caption">Enlace con comisión: si contratas, nos pagan. No cambia el orden.</span>` : ""}</p>`
      : "";
    return `<li class="tar ${esActual ? "tar--actual" : ""}">
      <div class="tar__top">
        <span class="tar__pos" aria-label="Posición ${i + 1}">${i + 1}</span>
        <div><div class="tar__nombre">${esc(c.tarifa.nombre)}</div><div class="tar__com">${esc(c.tarifa.comercializadora)}</div><div class="tar__badges">${badges(c, esActual)}</div></div>
        <div class="tar__total"><strong>${eur2(c.factura.total)}</strong><span>en ${c.factura.dias} días · ${eur(anual(c.factura.total))}/año</span><br/>${difHtml}</div>
      </div>
      <details><summary>Ver el cálculo y la letra pequeña</summary>
        <div class="tar__detalle">${desglose(c.factura)}<div>${letraPequena(c.tarifa)}${c.factura.avisos.length ? `<ul class="small">${c.factura.avisos.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>` : ""}</div></div>
        ${contratar}
      </details>
    </li>`;
  }).join("");

  // ---------- Extras con los mismos datos ----------
  const l = lecturas!;
  const rep = repartoPorPeriodos(l, festivos);
  const picos = picosDeConsumo(l);
  const sobra = potencias.p1 > picos.sugerida + 0.3;
  // €/kW·día de P1 + P2 de la tarifa de referencia (con la PVPC, los peajes regulados).
  const pot = (actual?.tarifa ?? mejor.tarifa).potencia ?? datos.regulados.pvpc_potencia_eur_kw_dia[datos.regulados.pvpc_potencia_eur_kw_dia.length - 1];
  const precioPotencia = pot.p1 + pot.p2;
  const tarifaBase = actual?.tarifa ?? mejor.tarifa;
  const base = actual?.factura ?? mejor.factura;
  let desplazarHtml: string;
  if (tarifaBase.tipo === "fijo") {
    const porPeriodos = lista.find((c) => c.tarifa.tipo !== "fijo");
    desplazarHtml = `<p>Con un precio único da igual a qué hora consumas. ${porPeriodos ? `Si movieras consumo a las horas valle, te interesaría una tarifa por periodos o la PVPC.` : ""}</p>`;
  } else {
    const movido = calcularFactura(desplazarPuntaAValle(l, festivos, 0.1), tarifaBase, potencias, ctx);
    const ahorro = base.total - movido.total;
    desplazarHtml = `<p class="answer" style="font-size:32px"><strong>${eur(anual(ahorro))}</strong> al año</p><p class="muted">Lo que ahorrarías con <strong>${esc(tarifaBase.nombre)}</strong> si pasaras un 10 % del consumo de las horas punta (10–14 h y 18–22 h) a la madrugada: poner la lavadora o el lavavajillas con inicio diferido, por ejemplo.</p>`;
  }

  // Perfil para la calculadora solar (solo en este navegador).
  const perfil = perfilDesdeLecturas(l);
  const precioEnergia = base.energia / Math.max(1, base.kwh);
  guardarPerfil({ ...perfil, precioEnergia, guardado: new Date().toISOString() });

  const extras = `
  <div class="extras grid grid--3">
    <div class="card stack" style="--stack:12px">
      <span class="eyebrow">Tu reparto por periodos</span>
      <h3>¿Cuándo consumes?</h3>
      <div class="reparto" role="img" aria-label="Punta ${pct(rep.porcentaje[1])}, llano ${pct(rep.porcentaje[2])}, valle ${pct(rep.porcentaje[3])}">
        <span class="r-p1" style="width:${rep.porcentaje[1] * 100}%">${rep.porcentaje[1] > 0.12 ? pct(rep.porcentaje[1]) : ""}</span>
        <span class="r-p2" style="width:${rep.porcentaje[2] * 100}%">${rep.porcentaje[2] > 0.12 ? pct(rep.porcentaje[2]) : ""}</span>
        <span class="r-p3" style="width:${rep.porcentaje[3] * 100}%">${rep.porcentaje[3] > 0.12 ? pct(rep.porcentaje[3]) : ""}</span>
      </div>
      <ul class="small">
        <li><strong>Punta:</strong> ${kwh(rep.kwh[1])} (${pct(rep.porcentaje[1])})</li>
        <li><strong>Llano:</strong> ${kwh(rep.kwh[2])} (${pct(rep.porcentaje[2])})</li>
        <li><strong>Valle:</strong> ${kwh(rep.kwh[3])} (${pct(rep.porcentaje[3])})</li>
      </ul>
      <p class="small muted">${rep.porcentaje[3] > 0.45 ? "Consumes mucho en valle: las tarifas de tres periodos te favorecen." : rep.porcentaje[1] > 0.35 ? "Mucho consumo en punta: un precio único o mover consumo a la noche te conviene." : "Reparto equilibrado: compara bien precio único y tres periodos."} <a href="/guias/periodos-2-0td/">Qué son los periodos</a></p>
    </div>
    <div class="card stack" style="--stack:12px">
      <span class="eyebrow">Potencia contratada</span>
      <h3>${sobra ? "Parece que te sobra potencia" : "Tu potencia parece ajustada"}</h3>
      <p>Tu hora de más consumo fue el ${fechaCorta(picos.maximo.fecha)} a las ${String(picos.maximo.hora).padStart(2, "0")}:00, con una media de <strong>${num(picos.maximo.kw, 2)} kW</strong>. Tienes contratados ${num(potencias.p1, 2)} kW.</p>
      ${sobra ? `<p>Podrías mirar bajar a unos <strong>${num(picos.sugerida, 1)} kW</strong>, lo que ahorraría unos <strong>${eur((potencias.p1 - picos.sugerida) * precioPotencia * 365 * 1.27)}</strong> al año en el término de potencia.</p>` : ""}
      <p class="small muted">Ojo: el fichero da la media de cada hora; los picos de unos segundos (horno + lavadora + vitro) son mayores. Por eso dejamos un 30 % de margen. <a href="/guias/potencia-contratada/">Cómo saber si te sobra potencia</a></p>
    </div>
    <div class="card stack" style="--stack:12px">
      <span class="eyebrow">Mover consumo a la noche</span>
      <h3>Si cambias de hora la lavadora…</h3>
      ${desplazarHtml}
    </div>
  </div>
  <div class="card card--roomy solar-cta" style="margin-top:24px">
    <div>
      <span class="eyebrow eyebrow--violet">Placas solares</span>
      <h3 style="margin-top:8px">¿Te compensan las placas con este consumo?</h3>
      <p class="muted" style="margin-top:8px">Hemos guardado tu perfil de consumo (${kwh(perfil.anualKwh)} al año) <strong>solo en este navegador</strong> para que la calculadora lo use hora a hora.</p>
    </div>
    <a class="btn" href="/placas-solares/?consumo=fichero">Calcular con mi consumo</a>
  </div>`;

  resultado.innerHTML = `
    <div class="res-cab">
      <span class="eyebrow">Resultado</span>
      ${cabecera}
      ${avisoRevisar}
      <p class="caption">Estimación con tu consumo real, los precios de cada tarifa sin impuestos y los impuestos vigentes cada día. No es una oferta vinculante. ${hayPvpc ? "" : "<strong>No hemos podido traer los precios PVPC, así que la tarifa regulada no aparece.</strong>"} <a href="/como-funciona/">Cómo lo calculamos</a></p>
    </div>
    <h2 style="margin-top:48px;font-size:32px">Todas las tarifas, de más barata a más cara</h2>
    <p class="muted" style="margin-top:8px">Ordenadas solo por lo que habrías pagado. Las tarifas con el precio por revisar van al final hasta que las comprobamos.</p>
    <ol class="ranking">${ranking}</ol>
    <h2 style="margin-top:64px;font-size:32px">Lo que dice tu fichero</h2>
    ${extras}`;
}

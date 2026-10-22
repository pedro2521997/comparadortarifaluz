// Comparador de tarifas. Dos formas de dar el consumo: el fichero horario de la distribuidora
// (lo más preciso) o los datos de la factura con un perfil tipo. Todo ocurre en el navegador.

import { leerConsumos, leerConMapeo, ocultarCups, type Mapeo, type Lectura } from "@lst/csv";
import {
  compararTarifas,
  calcularFactura,
  repartoPorPeriodos,
  picosDeConsumo,
  desplazarPuntaAValle,
  generarLecturas,
  escalarConsumo,
  type Tarifa,
  type Regulados,
  type Comparacion,
  type TipoPerfil,
  type PeriodoEnergia,
} from "@lst/tarifa";
import { cargarRango, cargarMercado, type DatosMercado } from "../lib/precios-cliente";
import { eur, eur2, kwh, pct, fechaCorta, num, sumarDias } from "../lib/formato";
import { guardarPerfil, perfilDesdeLecturas } from "../lib/consumo-local";
import { marca, nombrePlan } from "../lib/ranking";
import { montarRanking } from "./ranking-ui";
import { compartir } from "../lib/compartir";
import { ficheroEjemplo, ficheroDeSesion, guardarSesion } from "./fichero-ui";

interface Datos {
  tarifas: Tarifa[];
  regulados: Regulados;
  festivos: string[];
  hoy: string;
  /** Último día con precios PVPC en el build (para el modo factura) */
  ultimoPvpc: string;
}

const datos: Datos = JSON.parse(document.getElementById("datos-comparador")!.textContent!);
const festivos = new Set(datos.festivos);
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const valor = (id: string) => parseFloat(($(id) as HTMLInputElement).value.replace(",", "."));

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

let lecturasFichero: Lectura[] | null = null;
let textoFichero = "";
let modo: "fichero" | "factura" = "fichero";
let ranking: ReturnType<typeof montarRanking> | null = null;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

// ---------- Modo: fichero o factura ----------

function ponerModo(m: typeof modo) {
  modo = m;
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-modo]")) b.setAttribute("aria-selected", String(b.dataset.modo === m));
  $("panel-fichero").hidden = m !== "fichero";
  $("panel-factura").hidden = m !== "factura";
  actualizarBoton();
}
for (const b of document.querySelectorAll<HTMLButtonElement>("[data-modo]")) b.addEventListener("click", () => ponerModo(b.dataset.modo as typeof modo));

function actualizarBoton() {
  const listo = modo === "factura" || Boolean(lecturasFichero);
  botonCalcular.disabled = !listo;
  ayudaCalcular.textContent = listo
    ? modo === "factura"
      ? "Repartimos tu consumo en las horas del último año con un perfil tipo y los precios reales de cada hora."
      : "El cálculo se hace en tu navegador. Tarda unos segundos si hay que traer los precios PVPC."
    : "Primero sube tu fichero, prueba con el de ejemplo o usa los datos de tu factura.";
}

// Para estimar el consumo desde lo que se paga: precios medianos del mercado (€/kW·día y €/kWh con impuestos).
const PRECIO_KW_DIA = 0.12;
const FACTOR_IMP = 1.27;
const PRECIO_KWH_IMP = 0.15 * FACTOR_IMP;

// Factura: consumo anual, por periodos o lo que se paga
for (const r of document.querySelectorAll<HTMLInputElement>("input[name=fact-dato]")) {
  r.addEventListener("change", () => {
    const dato = document.querySelector<HTMLInputElement>("input[name=fact-dato]:checked")!.value;
    $("fact-anual").hidden = dato !== "anual";
    $("fact-periodos").hidden = dato !== "periodos";
    $("fact-euros").hidden = dato !== "euros";
  });
}

function lecturasFactura(): { lecturas: Lectura[]; descripcion: string } | { error: string } {
  const dato = document.querySelector<HTMLInputElement>("input[name=fact-dato]:checked")!.value;
  const porPeriodos = dato === "periodos";
  const tipo = $<HTMLSelectElement>("perfil").value as TipoPerfil;
  const hasta = datos.ultimoPvpc < datos.hoy ? datos.ultimoPvpc : sumarDias(datos.hoy, -1);
  const desde = sumarDias(hasta, -364);
  if (porPeriodos) {
    const p = { 1: valor("fp-p1"), 2: valor("fp-p2"), 3: valor("fp-p3") } as Record<PeriodoEnergia, number>;
    const dias = valor("fp-dias");
    if (![p[1], p[2], p[3]].every((x) => x >= 0) || !(p[1] + p[2] + p[3] > 0) || !(dias >= 7)) {
      return { error: "Escribe los kWh de punta, llano y valle de tu factura y los días que cubre." };
    }
    const anual = ((p[1] + p[2] + p[3]) / dias) * 365;
    return {
      lecturas: generarLecturas({ desde, hasta, anualKwh: anual, tipo, festivos, porPeriodo: p }),
      descripcion: `${kwh(anual)} al año estimados con tu factura (${pct(p[1] / (p[1] + p[2] + p[3]))} en punta, ${pct(p[3] / (p[1] + p[2] + p[3]))} en valle)`,
    };
  }
  if (dato === "euros") {
    const euros = valor("fe-eur");
    if (!(euros >= 10 && euros <= 1000)) return { error: "Escribe lo que pagas al mes, en euros (entre 10 y 1.000)." };
    // Estimación inversa con una factura típica: parte fija (potencia, contador, bono social) y el resto, energía.
    const fijoMes = (valor("p1") || 3.45) * PRECIO_KW_DIA * 30.4 * FACTOR_IMP + 1.2;
    const anual = Math.max(300, Math.round((((euros - fijoMes) / PRECIO_KWH_IMP) * 12) / 50) * 50);
    return {
      lecturas: generarLecturas({ desde, hasta, anualKwh: anual, tipo, festivos }),
      descripcion: `unos ${kwh(anual)} al año estimados a partir de ${eur(euros)} al mes`,
    };
  }
  const anual = valor("fa-kwh");
  if (!(anual >= 100 && anual <= 100000)) return { error: "Escribe tu consumo anual en kWh (entre 100 y 100.000)." };
  return {
    lecturas: generarLecturas({ desde, hasta, anualKwh: anual, tipo, festivos }),
    descripcion: `${kwh(anual)} al año con el perfil «${$<HTMLSelectElement>("perfil").selectedOptions[0].text}»`,
  };
}

// ---------- Lectura del fichero ----------

function mostrarEstado(html: string, tipo: "ok" | "warn" | "error") {
  const clase = tipo === "ok" ? "notice" : tipo === "warn" ? "notice notice--warn" : "notice notice--error";
  estado.innerHTML = `<div class="${clase}">${html}</div>`;
}

function aceptarLecturas(l: Lectura[], cups: string | null, desde: string, hasta: string, avisos: string[], guardar = true) {
  lecturasFichero = l;
  if (guardar) guardarSesion({ lecturas: l, cups, desde, hasta, avisos });
  const total = l.reduce((a, x) => a + x.kwh, 0);
  const dias = Math.round((Date.parse(hasta) - Date.parse(desde)) / 86_400_000) + 1;
  const avisosHtml = avisos.length ? `<ul class="small">${avisos.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>` : "";
  const corto = dias < 28 ? `<p class="small"><strong>Ojo:</strong> el fichero cubre solo ${dias} días. Para comparar bien, mejor un año entero.</p>` : "";
  mostrarEstado(
    `<p><strong>Fichero leído:</strong> ${num(l.length)} horas del ${fechaCorta(desde)} al ${fechaCorta(hasta)} (${dias} días), ${kwh(total)} en total${cups ? ` · CUPS ${esc(ocultarCups(cups))}` : ""}.</p>${corto}${avisosHtml}`,
    dias < 28 ? "warn" : "ok",
  );
  mapeoBox.hidden = true;
  const sel = $<HTMLSelectElement>("analisis");
  sel.disabled = dias <= 31;
  actualizarBoton();
}

function procesar(texto: string) {
  textoFichero = texto;
  const r = leerConsumos(texto);
  if (r.ok) return aceptarLecturas(r.lecturas, r.cups, r.desde, r.hasta, r.avisos);
  lecturasFichero = null;
  actualizarBoton();
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
    const texto = String(lector.result ?? "");
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

// Fichero de ejemplo: el mismo generador que el resto de herramientas.
$("ejemplo").addEventListener("click", () => {
  ponerModo("fichero");
  procesar(ficheroEjemplo());
  $<HTMLInputElement>("p1").value = "4.6";
  $<HTMLInputElement>("p2").value = "4.6";
});

selActual.addEventListener("change", () => {
  otra.hidden = selActual.value !== "otra";
});
$<HTMLInputElement>("habitos").addEventListener("input", (e) => {
  const v = Number((e.target as HTMLInputElement).value);
  $("habitos-v").textContent = v === 0 ? "sin cambios" : `${v > 0 ? "+" : ""}${v} %`;
});

// ---------- Cálculo ----------

function tarifaOtra(): Tarifa | null {
  const v = (id: string) => valor(id);
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
    origen: "usuario",
  };
}

/** Recorta las lecturas a los últimos N meses si se ha pedido. */
function recortar(l: Lectura[]): Lectura[] {
  const meses = Number($<HTMLSelectElement>("analisis").value);
  if (!meses) return l;
  const fin = l.reduce((a, x) => (x.fecha > a ? x.fecha : a), l[0].fecha);
  const desde = sumarDias(fin, -Math.round(meses * 30.44) + 1);
  return l.filter((x) => x.fecha >= desde);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  let lecturas: Lectura[];
  let descripcion: string;
  if (modo === "factura") {
    const r = lecturasFactura();
    if ("error" in r) {
      resultado.hidden = false;
      resultado.innerHTML = `<div class="notice notice--error"><p>${esc(r.error)}</p></div>`;
      return;
    }
    lecturas = r.lecturas;
    descripcion = r.descripcion;
  } else {
    if (!lecturasFichero) return;
    lecturas = recortar(lecturasFichero);
    descripcion = "tu fichero de consumos hora a hora";
  }
  const habitos = Number($<HTMLInputElement>("habitos").value);
  if (habitos) {
    lecturas = escalarConsumo(lecturas, 1 + habitos / 100);
    descripcion += ` con un ${habitos > 0 ? "+" : ""}${habitos} % de consumo`;
  }

  const p1 = valor("p1");
  const p2 = valor("p2");
  if (!(p1 > 0 && p2 > 0)) return;

  let catalogo = [...datos.tarifas];
  const idActual = selActual.value;
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
  resultado.innerHTML = `<div class="notice" role="status"><p>Trayendo los precios PVPC y del mercado mayorista de Red Eléctrica para tus fechas…</p></div>`;

  const desde = lecturas.reduce((a, l) => (l.fecha < a ? l.fecha : a), lecturas[0].fecha);
  const hasta = lecturas.reduce((a, l) => (l.fecha > a ? l.fecha : a), lecturas[0].fecha);
  let pvpc: Record<string, number[]> | undefined;
  try {
    pvpc = await cargarRango(desde, hasta);
    if (Object.keys(pvpc).length === 0) pvpc = undefined;
  } catch {
    pvpc = undefined;
  }

  let mercado: DatosMercado | undefined;
  try {
    mercado = await cargarMercado(desde, hasta);
    if (Object.keys(mercado.spot).length === 0) mercado = undefined;
  } catch {
    mercado = undefined;
  }

  const bono = $<HTMLSelectElement>("bono").value;
  const ctx = {
    regulados: datos.regulados,
    festivos,
    pvpc,
    mercado,
    zona: $<HTMLSelectElement>("zona").value as "peninsula" | "canarias" | "ceuta_melilla",
    bonoSocial: bono ? { descuento: Number(bono), limiteAnualKwh: Number($<HTMLSelectElement>("bono-lim").value) } : null,
  };
  const potencias = { p1, p2 };
  const lista = compararTarifas(lecturas, catalogo, potencias, ctx, datos.hoy);
  pintar(lista, idActual, lecturas, potencias, ctx, catalogo, Boolean(pvpc), descripcion);

  botonCalcular.disabled = false;
  botonCalcular.textContent = "Volver a calcular";
  resultado.scrollIntoView({ block: "start" });
  resultado.focus({ preventScroll: true });
});

function pintar(
  lista: Comparacion[],
  idActual: string,
  lecturas: Lectura[],
  potencias: { p1: number; p2: number },
  ctx: Parameters<typeof calcularFactura>[3],
  catalogo: Tarifa[],
  hayPvpc: boolean,
  descripcion: string,
) {
  const actual = lista.find((c) => c.tarifa.id === idActual) ?? null;
  // La mejor alternativa: la más barata con el precio comprobado (las "por revisar" van detrás).
  const mejor = lista.find((c) => c.tarifa.id !== idActual) ?? lista[0];
  const f0 = lista[0].factura;
  const anual = (x: number) => (x / f0.dias) * 365;
  const mensual = (x: number) => (x / f0.dias) * 30.4;
  const nombre = (t: Tarifa) => `${esc(marca(t.comercializadora))} · ${esc(nombrePlan(t.nombre))}`;
  const avisoRevisar = mejor.porRevisar && mejor.tarifa.id !== "otra"
    ? `<p class="notice notice--warn small" style="margin-bottom:16px">Ojo: el precio de <strong>${nombre(mejor.tarifa)}</strong> lleva más de 45 días sin comprobar. Confírmalo antes de contratar.</p>`
    : "";

  let cabecera: string;
  if (actual && mejor.factura.total < actual.factura.total) {
    const ahorro = actual.factura.total - mejor.factura.total;
    cabecera = `<p class="answer">Ahorrarías <strong>${eur(anual(ahorro))}</strong> al año</p>
      <p class="lead">Con <strong>${nombre(mejor.tarifa)}</strong> habrías pagado ${eur2(mejor.factura.total)} entre el ${fechaCorta(f0.desde)} y el ${fechaCorta(f0.hasta)}, ${eur2(ahorro)} menos que con tu tarifa (${eur2(actual.factura.total)}).</p>`;
  } else if (actual) {
    cabecera = `<p class="answer">Tu tarifa ya es <strong>la más barata</strong> de las que comparamos</p>
      <p class="lead">Con tu consumo habrías pagado ${eur2(actual.factura.total)} entre el ${fechaCorta(f0.desde)} y el ${fechaCorta(f0.hasta)}. Revisa los extras de abajo: aún puedes ahorrar cambiando hábitos o potencia.</p>`;
  } else {
    cabecera = `<p class="answer">La más barata para ti: <strong>${eur(anual(mejor.factura.total))}</strong> al año</p>
      <p class="lead">Con <strong>${nombre(mejor.tarifa)}</strong> habrías pagado ${eur2(mejor.factura.total)} entre el ${fechaCorta(f0.desde)} y el ${fechaCorta(f0.hasta)} (unos ${eur(mensual(mejor.factura.total))} al mes).</p>`;
  }

  // ---------- Extras con los mismos datos ----------
  const rep = repartoPorPeriodos(lecturas, festivos);
  const picos = picosDeConsumo(lecturas);
  const sobra = potencias.p1 > picos.sugerida + 0.3;
  const tarifaBase = actual?.tarifa ?? mejor.tarifa;
  const base = actual?.factura ?? mejor.factura;
  const pot = tarifaBase.potencia ?? datos.regulados.pvpc_potencia_eur_kw_dia[datos.regulados.pvpc_potencia_eur_kw_dia.length - 1];
  const precioPotencia = pot.p1 + pot.p2;
  let desplazarHtml: string;
  if (tarifaBase.tipo === "fijo") {
    desplazarHtml = `<p>Con un precio único da igual a qué hora consumas. Si puedes mover consumo a la noche, mira en la tabla las tarifas de 3 periodos o la PVPC.</p>`;
  } else {
    const movido = calcularFactura(desplazarPuntaAValle(lecturas, festivos, 0.1), tarifaBase, potencias, ctx);
    const ahorro = base.total - movido.total;
    desplazarHtml = `<p class="answer" style="font-size:32px"><strong>${eur(anual(ahorro))}</strong> al año</p><p class="muted">Lo que ahorrarías con <strong>${nombre(tarifaBase)}</strong> si pasaras un 10 % del consumo de las horas punta (10–14 h y 18–22 h) a la madrugada.</p>`;
  }

  const desdeFichero = modo === "fichero";
  if (desdeFichero) {
    const perfil = perfilDesdeLecturas(lecturas);
    guardarPerfil({ ...perfil, precioEnergia: base.energia / Math.max(1, base.kwh), guardado: new Date().toISOString() });
  }

  const extras = `
  <div class="extras grid grid--3">
    <div class="card stack" style="--stack:12px">
      <span class="eyebrow">${desdeFichero ? "Tu reparto por periodos" : "Reparto que hemos supuesto"}</span>
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
      ${desdeFichero ? `<h3>${sobra ? "Parece que te sobra potencia" : "Tu potencia parece ajustada"}</h3>
      <p>Tu hora de más consumo fue el ${fechaCorta(picos.maximo.fecha)} a las ${String(picos.maximo.hora).padStart(2, "0")}:00, con una media de <strong>${num(picos.maximo.kw, 2)} kW</strong>. Tienes contratados ${num(potencias.p1, 2)} kW.</p>
      ${sobra ? `<p>Podrías mirar bajar a unos <strong>${num(picos.sugerida, 1)} kW</strong>, lo que ahorraría unos <strong>${eur((potencias.p1 - picos.sugerida) * precioPotencia * 365 * 1.27)}</strong> al año en el término de potencia.</p>` : ""}
      <p class="small muted">El fichero da la media de cada hora; los picos de unos segundos son mayores. Por eso dejamos un 30 % de margen. <a href="/guias/potencia-contratada/">Cómo saber si te sobra potencia</a></p>`
      : `<h3>Cada kW cuesta unos ${eur(precioPotencia * 365 * 1.27)} al año</h3><p>Con tu fichero de consumos te diríamos si te sobra potencia. <a href="/guias/descargar-consumo-datadis/">Cómo descargarlo</a></p>`}
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
      <p class="muted" style="margin-top:8px">${desdeFichero ? `Hemos guardado tu perfil de consumo <strong>solo en este navegador</strong> para que la calculadora lo use hora a hora.` : "Con tu fichero de consumos el cálculo solar es mucho más preciso."}</p>
    </div>
    <a class="btn" href="/placas-solares/${desdeFichero ? "?consumo=fichero" : ""}">Calcular mis placas</a>
  </div>`;

  resultado.innerHTML = `
    <div class="res-cab">
      <span class="eyebrow">Resultado</span>
      ${cabecera}
      ${avisoRevisar}
      <p class="btn-row" style="margin:4px 0 12px"><button type="button" class="btn btn--ghost btn--small" id="compartir-res">Compartir el resultado</button><span class="caption" id="compartir-estado" aria-live="polite"></span></p>
      <p class="caption">Calculado con ${esc(descripcion)}, los precios de cada tarifa sin impuestos ni promociones y los impuestos vigentes cada día. ${ctx.bonoSocial ? "Con el descuento del bono social en la PVPC (las demás tarifas no lo tienen). " : ""}${ctx.zona === "canarias" ? "Con IGIC de Canarias. " : ctx.zona === "ceuta_melilla" ? "Con IPSI de Ceuta y Melilla. " : ""}Es una estimación, no una oferta vinculante. ${hayPvpc ? "" : "<strong>No hemos podido traer los precios PVPC, así que la tarifa regulada no aparece.</strong>"} ${ctx.mercado ? "" : "<strong>No hemos podido traer el precio del mercado, así que las tarifas indexadas no aparecen.</strong>"} <a href="/como-funciona/">Cómo lo calculamos</a></p>
    </div>
    <h2 class="res-h2">Ranking de ${lista.length} tarifas para tu consumo</h2>
    <p class="muted">Ordenadas por lo que habrías pagado. Filtra, reordena por columnas o abre el detalle de cada una.</p>
    <div id="ranking"></div>
    <h2 class="res-h2">Lo que dice ${desdeFichero ? "tu fichero" : "tu consumo"}</h2>
    ${extras}`;

  const ahorroAnual = actual && mejor.factura.total < actual.factura.total ? anual(actual.factura.total - mejor.factura.total) : 0;
  const textoCompartir = ahorroAnual > 0
    ? `He comparado ${lista.length} tarifas de luz con mi consumo real y podría ahorrar ${eur(ahorroAnual)} al año. Compara la tuya gratis:`
    : `He comparado ${lista.length} tarifas de luz con mi consumo real, gratis y sin registro. Compara la tuya:`;
  $("compartir-res").addEventListener("click", () => compartir(textoCompartir, `${location.origin}/comparador/`, $("compartir-estado")));

  ranking = montarRanking($("ranking"), { lecturas, potencias, ctx, tarifas: catalogo, hoy: datos.hoy, idActual: actual ? idActual : null });
  void ranking;
}

ponerModo("fichero");

// Fichero cargado antes en esta sesión (analizador, calculador…): se ofrece reutilizarlo.
const previo = ficheroDeSesion();
if (previo) {
  estado.innerHTML = `<div class="notice"><p>Ya cargaste ${previo.ejemplo ? "el fichero de ejemplo" : "un fichero"} en esta sesión (${fechaCorta(previo.desde)} – ${fechaCorta(previo.hasta)}).</p><p><button type="button" class="btn btn--small" id="usar-previo">Usar ese fichero</button></p></div>`;
  $("usar-previo").addEventListener("click", () => aceptarLecturas(previo.lecturas, previo.cups, previo.desde, previo.hasta, previo.avisos, false));
}

// Datos que llegan del lector de facturas (/entender-factura-luz/): modo factura ya relleno.
try {
  const f = JSON.parse(sessionStorage.getItem("lst-factura-leida") ?? "null") as {
    kwh: { p1: number; p2: number; p3: number }; dias: number; potencia: { p1: number; p2: number };
    precioEnergia?: { p1?: number; p2?: number; p3?: number }; precioPotencia?: { p1?: number; p2?: number }; pvpc?: boolean; servicios?: number;
  } | null;
  if (f && location.hash === "#factura") {
    sessionStorage.removeItem("lst-factura-leida");
    ponerModo("factura");
    const porPeriodos = document.querySelector<HTMLInputElement>('input[name=fact-dato][value="periodos"]')!;
    porPeriodos.checked = true;
    porPeriodos.dispatchEvent(new Event("change", { bubbles: true }));
    const poner = (id: string, v: number | undefined) => {
      if (v !== undefined && Number.isFinite(v)) $<HTMLInputElement>(id).value = String(+v.toFixed(6));
    };
    poner("fp-p1", f.kwh.p1);
    poner("fp-p2", f.kwh.p2);
    poner("fp-p3", f.kwh.p3);
    poner("fp-dias", f.dias);
    poner("p1", f.potencia.p1);
    poner("p2", f.potencia.p2);
    if (f.pvpc) selActual.value = "pvpc";
    else if (f.precioEnergia?.p1 && f.precioPotencia?.p1) {
      selActual.value = "otra";
      poner("o-e1", f.precioEnergia.p1);
      poner("o-e2", f.precioEnergia.p2 ?? f.precioEnergia.p1);
      poner("o-e3", f.precioEnergia.p3 ?? f.precioEnergia.p1);
      poner("o-p1", f.precioPotencia.p1);
      poner("o-p2", f.precioPotencia.p2 ?? f.precioPotencia.p1);
      // Servicios de la factura, pasados a €/mes.
      if (f.servicios) poner("o-cuota", (f.servicios / f.dias) * 30.4);
    }
    selActual.dispatchEvent(new Event("change"));
    $("panel-factura").insertAdjacentHTML("afterbegin", `<div class="notice"><p><strong>Hemos rellenado el comparador con los datos de tu factura.</strong> Revísalos y pulsa comparar.</p></div>`);
  }
} catch {
  // Sin almacenamiento de sesión: el comparador funciona igual, solo que vacío.
}

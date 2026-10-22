// Lector de facturas: el PDF se lee en el navegador con pdf.js, se sacan los datos con @lst/factura,
// el usuario los revisa y le explicamos cada concepto, comprobamos si cuadra y le enseñamos qué pagaría
// con otras tarifas. Nada sale del navegador.

import { leerFactura, lineasDesdeTrozos, cupsValido, conceptosEn, type DatosFactura, type TrozoTexto, type ConceptoDetectado, type TipoConcepto } from "@lst/factura";
import { calcularFactura, compararTarifas, generarLecturas, diasEntre, sumarDias, type Factura, type Regulados, type Tarifa, type Contexto } from "@lst/tarifa";
import { cargarRango, cargarMercado } from "../lib/precios-cliente";
import { eur, eur2, kwh, num, pct, fechaCorta } from "../lib/formato";
import { marca, nombrePlan, logoHtml } from "../lib/ranking";

interface Datos {
  tarifas: Tarifa[];
  regulados: Regulados;
  festivos: string[];
  hoy: string;
  medianaFijo: number;
}

const datos: Datos = JSON.parse(document.getElementById("datos-ef")!.textContent!);
const festivos = new Set(datos.festivos);
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const estado = $("ef-estado");
const form = $<HTMLFormElement>("ef-form");
const res = $("ef-res");

// ---------- Leer el PDF ----------

async function lineasPdf(fichero: File): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist");
  const { default: worker } = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await fichero.arrayBuffer()) }).promise;
  const trozos: TrozoTexto[] = [];
  // Las facturas tienen 2–4 páginas; más allá suele haber publicidad o condiciones.
  for (let i = 1; i <= Math.min(doc.numPages, 6); i++) {
    const contenido = await (await doc.getPage(i)).getTextContent();
    for (const it of contenido.items) if ("str" in it) trozos.push({ str: it.str, x: it.transform[4], y: it.transform[5], pagina: i });
  }
  return lineasDesdeTrozos(trozos);
}

async function procesar(fichero: File) {
  if (!/pdf$/i.test(fichero.type) && !/\.pdf$/i.test(fichero.name)) {
    estado.innerHTML = `<div class="notice notice--error"><p>Eso no parece un PDF. Descarga la factura en PDF desde el área de clientes de tu compañía.</p></div>`;
    return;
  }
  estado.innerHTML = `<div class="notice" role="status"><p>Leyendo tu factura en tu navegador…</p></div>`;
  let lineas: string[];
  try {
    lineas = await lineasPdf(fichero);
  } catch (e) {
    const clave = (e as Error).name === "PasswordException";
    estado.innerHTML = `<div class="notice notice--error"><p>${clave ? "El PDF está protegido con contraseña. Ábrelo, guárdalo sin contraseña (Imprimir → Guardar como PDF) y vuelve a subirlo." : "No hemos podido abrir el PDF. Prueba a descargarlo de nuevo o escribe los datos a mano."}</p></div>`;
    mostrarFormulario(null);
    return;
  }
  if (lineas.join("").replace(/\s/g, "").length < 200) {
    estado.innerHTML = `<div class="notice notice--warn"><p><strong>Tu PDF parece una foto o un escaneo</strong>: no tiene texto que podamos leer. Escribe abajo los datos que te pedimos, o descarga la factura original en PDF desde el área de clientes de tu compañía.</p></div>`;
    mostrarFormulario(null);
    return;
  }
  const d = leerFactura(lineas);
  const n = contar(d);
  conceptos = conceptosEn(lineas);
  estado.innerHTML = `<div class="notice"><p><strong>Hemos leído ${n.encontrados} de ${n.total} datos de tu factura${d.comercializadora ? ` de ${esc(d.comercializadora)}` : ""}</strong> y reconocido ${conceptos.length} conceptos, que te explicamos aquí abajo. Revisa los datos${n.encontrados < n.total ? " y completa los que faltan" : ""} para ver si tu factura cuadra y cuánto pagarías con otra tarifa.</p></div>`;
  pintarConceptos();
  mostrarFormulario(d);
}

// ---------- Conceptos reconocidos (sirven aunque no saquemos todos los datos) ----------

let conceptos: ConceptoDetectado[] = [];
const ORDEN_TIPO: TipoConcepto[] = ["aviso", "coste", "ahorro", "regulado", "impuesto", "dato"];
const NOMBRE_TIPO: Record<TipoConcepto, string> = {
  aviso: "Para revisar",
  coste: "Lo que pagas a tu compañía",
  ahorro: "Lo que te descuentan",
  regulado: "Costes regulados (iguales en todas las compañías)",
  impuesto: "Impuestos",
  dato: "Datos de tu contrato y tu consumo",
};

function pintarConceptos() {
  const caja = $("ef-conceptos");
  if (!conceptos.length) {
    caja.hidden = true;
    return;
  }
  caja.hidden = false;
  caja.innerHTML = `<h2 class="ef-h">Tu factura, línea a línea</h2>
    <p class="muted small">Lo que hemos reconocido en tu PDF, con la línea tal como aparece y qué significa.</p>
    ${ORDEN_TIPO.map((t) => {
      const lista = conceptos.filter((c) => c.tipo === t);
      if (!lista.length) return "";
      return `<h3 class="ef-tipo ef-tipo--${t}">${NOMBRE_TIPO[t]}</h3>
        <ul class="ef-lineas">${lista
          .map((c) => `<li>
            <div class="ef-concepto__cab"><strong>${esc(c.titulo)}</strong>${c.importe !== undefined && c.tipo !== "dato" ? `<span>${eur2(c.importe)}</span>` : ""}</div>
            <q class="ef-cita">${esc(c.linea)}</q>
            <p class="small">${esc(c.explicacion)}</p>
          </li>`)
          .join("")}</ul>`;
    }).join("")}`;
}

function contar(d: DatosFactura) {
  const campos = [d.desde, d.potencia.p1, d.kwh.p1 ?? d.kwh.total, d.precioEnergia.p1, d.precioPotencia.p1, d.importes.total, d.cups];
  return { encontrados: campos.filter((x) => x !== undefined).length, total: campos.length };
}

// ---------- Formulario de revisión ----------

const CAMPOS: [string, (d: DatosFactura) => number | string | undefined][] = [
  ["comercializadora", (d) => d.comercializadora],
  ["cups", (d) => d.cups],
  ["desde", (d) => d.desde],
  ["hasta", (d) => d.hasta],
  ["dias", (d) => d.dias],
  ["pot1", (d) => d.potencia.p1],
  ["pot2", (d) => d.potencia.p2],
  ["k1", (d) => d.kwh.p1],
  ["k2", (d) => d.kwh.p2],
  ["k3", (d) => d.kwh.p3],
  ["ktotal", (d) => d.kwh.total],
  ["e1", (d) => d.precioEnergia.p1],
  ["e2", (d) => d.precioEnergia.p2],
  ["e3", (d) => d.precioEnergia.p3],
  ["pp1", (d) => d.precioPotencia.p1],
  ["pp2", (d) => d.precioPotencia.p2],
  ["iPotencia", (d) => d.importes.potencia],
  ["iEnergia", (d) => d.importes.energia],
  ["iBono", (d) => d.importes.bonoSocial],
  ["iIee", (d) => d.importes.impuestoElectrico],
  ["iAlquiler", (d) => d.importes.alquiler],
  ["iServicios", (d) => d.importes.servicios],
  ["iDescuentos", (d) => d.importes.descuentos],
  ["iIva", (d) => d.importes.iva],
  ["total", (d) => d.importes.total],
];

let leida: DatosFactura | null = null;

function mostrarFormulario(d: DatosFactura | null) {
  leida = d;
  form.hidden = false;
  form.reset();
  for (const [id, f] of CAMPOS) {
    const el = $<HTMLInputElement>(`ef-${id}`);
    const v = d ? f(d) : undefined;
    el.value = v === undefined ? "" : typeof v === "number" ? String(+v.toFixed(6)) : v;
    el.closest(".field")?.classList.toggle("ef-leido", v !== undefined);
  }
  $<HTMLInputElement>("ef-pvpc").checked = Boolean(d?.pvpc);
  res.hidden = true;
  form.scrollIntoView({ block: "start", behavior: "smooth" });
}

const val = (id: string) => {
  const v = $<HTMLInputElement>(`ef-${id}`).value.trim().replace(",", ".");
  return v === "" ? undefined : Number(v);
};
const txt = (id: string) => $<HTMLInputElement>(`ef-${id}`).value.trim();

// ---------- Explicación ----------

const CLAVES = ["potencia", "energia", "bonoSocial", "impuestoElectrico", "alquiler", "servicios", "descuentos", "iva"] as const;
type Clave = (typeof CLAVES)[number];

const EXPLICA: Record<Clave, string> = {
  potencia: "Lo pagas por tener la luz disponible, consumas o no. Depende de los kW contratados y de los días.",
  energia: "Lo que has gastado: los kWh de cada periodo por su precio.",
  bonoSocial: "Aportación obligatoria para financiar el bono social de los hogares vulnerables. Es igual en todas las compañías.",
  impuestoElectrico: "Impuesto especial sobre la electricidad: un porcentaje de la potencia y la energía. Lo fija el Estado.",
  alquiler: "Alquiler del contador a la distribuidora. Es regulado y no depende de tu compañía.",
  servicios: "Servicios añadidos a la luz (mantenimiento, asistencia, seguros). No son obligatorios por ley: revisa si los necesitas.",
  descuentos: "Descuentos o promociones de tu compañía. Comprueba cuándo terminan.",
  iva: "IVA sobre todo lo anterior (IGIC en Canarias, IPSI en Ceuta y Melilla).",
};
const NOMBRES: Record<Clave, string> = {
  potencia: "Potencia contratada",
  energia: "Energía consumida",
  bonoSocial: "Financiación del bono social",
  impuestoElectrico: "Impuesto sobre la electricidad",
  alquiler: "Alquiler del contador",
  servicios: "Servicios añadidos",
  descuentos: "Descuentos",
  iva: "IVA",
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const desde = txt("desde");
  const hasta0 = txt("hasta");
  const total = val("total");
  const k = { p1: val("k1"), p2: val("k2"), p3: val("k3") };
  const ktotal = val("ktotal") ?? (k.p1 ?? 0) + (k.p2 ?? 0) + (k.p3 ?? 0);
  const p1 = val("pot1");
  if (!desde || !hasta0 || hasta0 < desde || !(ktotal > 0) || !(p1! > 0) || !(total! > 0)) {
    res.hidden = false;
    res.innerHTML = `<div class="notice notice--error"><p>Para explicarte la factura necesitamos al menos las fechas, los kWh, la potencia contratada y el total.</p></div>`;
    return;
  }
  const dias = val("dias") ?? diasEntre(desde, hasta0);
  const hasta = sumarDias(desde, dias - 1);
  const potencias = { p1: p1!, p2: val("pot2") ?? p1! };
  const pvpc = $<HTMLInputElement>("ef-pvpc").checked;
  const conPeriodos = k.p1 !== undefined && k.p3 !== undefined;
  const lecturas = generarLecturas({
    desde,
    hasta,
    anualKwh: (ktotal * 365) / dias,
    tipo: "estandar",
    festivos,
    porPeriodo: conPeriodos ? { 1: k.p1!, 2: k.p2 ?? 0, 3: k.p3! } : null,
  });
  const imp = {
    potencia: val("iPotencia"), energia: val("iEnergia"), bonoSocial: val("iBono"), impuestoElectrico: val("iIee"),
    alquiler: val("iAlquiler"), servicios: val("iServicios"), descuentos: val("iDescuentos"), iva: val("iIva"),
  };

  res.hidden = false;
  res.innerHTML = `<div class="notice" role="status"><p>Preparando la explicación…</p></div>`;

  // Tu tarifa, tal como sale en la factura.
  const e1 = val("e1"), pp1 = val("pp1");
  let tuya: Tarifa | null = null;
  if (pvpc) tuya = datos.tarifas.find((t) => t.tipo === "pvpc") ?? null;
  else if (e1 && pp1 !== undefined) {
    tuya = {
      id: "tuya", comercializadora: txt("comercializadora") || "Tu compañía", nombre: "Tu tarifa", tipo: val("e2") === undefined && val("e3") === undefined ? "fijo" : "periodos",
      potencia: { p1: pp1, p2: val("pp2") ?? pp1 }, energia: { p1: e1, p2: val("e2") ?? e1, p3: val("e3") ?? e1 },
      cuota_fija_mes: imp.servicios ? (imp.servicios / dias) * 30.4 : 0, permanencia_meses: 0, servicios_obligatorios: [], url_fuente: "", fecha_comprobacion: datos.hoy, comision: false, url_contratar: "",
    };
  }
  const ctx: Contexto = { regulados: datos.regulados, festivos };
  try {
    ctx.pvpc = await cargarRango(desde, hasta);
  } catch {
    /* sin PVPC: no se compara con ella */
  }
  try {
    ctx.mercado = await cargarMercado(desde, hasta);
  } catch {
    /* sin mercado: sin indexadas */
  }
  let calculada: Factura | null = null;
  try {
    if (tuya && (tuya.tipo !== "pvpc" || ctx.pvpc)) calculada = calcularFactura(lecturas, tuya, potencias, ctx);
  } catch {
    calculada = null;
  }
  let alternativas: ReturnType<typeof compararTarifas> = [];
  try {
    alternativas = compararTarifas(lecturas, datos.tarifas, potencias, ctx, datos.hoy).filter((c) => !c.porRevisar && !c.incompleta);
  } catch {
    alternativas = [];
  }

  pintar({ desde, hasta, dias, total: total!, ktotal, k, conPeriodos, potencias, pvpc, imp, calculada, alternativas, e1, servicios: leida?.servicios ?? [] });
  sessionStorage.setItem(
    "lst-factura-leida",
    JSON.stringify({
      kwh: conPeriodos ? k : { p1: ktotal * 0.3, p2: ktotal * 0.3, p3: ktotal * 0.4 }, dias, potencia: potencias, pvpc,
      precioEnergia: { p1: e1, p2: val("e2"), p3: val("e3") }, precioPotencia: { p1: pp1, p2: val("pp2") }, servicios: imp.servicios,
    }),
  );
});

interface Contexto2 {
  desde: string;
  hasta: string;
  dias: number;
  total: number;
  ktotal: number;
  k: { p1?: number; p2?: number; p3?: number };
  conPeriodos: boolean;
  potencias: { p1: number; p2: number };
  pvpc: boolean;
  imp: Record<string, number | undefined>;
  calculada: Factura | null;
  alternativas: ReturnType<typeof compararTarifas>;
  e1?: number;
  servicios: DatosFactura["servicios"];
}

function pintar(c: Contexto2) {
  const anual = (x: number) => (x * 365) / c.dias;
  const medio = c.total / c.ktotal;

  // Desglose: lo que viene en la factura y, si falta, lo que calculamos (marcado).
  const calc = c.calculada;
  const filas = CLAVES.map((clave) => {
      let v = c.imp[clave];
      let estimado = false;
      if (v === undefined && calc) {
        const deCalc: Record<string, number> = { potencia: calc.potencia, energia: calc.energia, bonoSocial: calc.bonoSocial, impuestoElectrico: calc.iee, alquiler: calc.alquiler, iva: calc.iva };
        if (deCalc[clave] !== undefined && deCalc[clave] > 0) {
          v = deCalc[clave];
          estimado = true;
        }
      }
      return v === undefined || v === 0 ? null : { clave, v, estimado };
    })
    .filter((x): x is { clave: Clave; v: number; estimado: boolean } => x !== null);
  const maxV = Math.max(...filas.map((f) => Math.abs(f.v)), 1);
  const desglose = filas
    .map((f) => `<li class="ef-concepto">
      <div class="ef-concepto__cab"><strong>${NOMBRES[f.clave]}</strong><span>${eur2(f.v)}${f.estimado ? ' <span class="pill">calculado</span>' : ""}</span></div>
      <span class="ef-barra"><span style="width:${(Math.abs(f.v) / maxV) * 100}%"></span></span>
      <p class="small muted">${EXPLICA[f.clave]}${detalleConcepto(f.clave, c)}</p>
    </li>`)
    .join("");

  // ¿Cuadra?
  let comprobacion = "";
  // Una regularización (ajuste de facturas anteriores) no sale de este periodo: la quitamos para comparar.
  const regularizacion = conceptos.find((x) => x.id === "regularizacion")?.importe ?? 0;
  if (calc) {
    const dif = calc.total + regularizacion - c.total;
    const rel = Math.abs(dif) / c.total;
    comprobacion =
      rel <= 0.02
        ? `<div class="notice"><p><strong>✓ Tu factura cuadra.</strong> Con tus precios y tu consumo nos sale ${eur2(calc.total)}${regularizacion ? ` más una regularización de ${eur2(regularizacion)}` : ""}, frente a los ${eur2(c.total)} que te cobran (${dif >= 0 ? "+" : "−"}${eur2(Math.abs(dif))}). Las diferencias de céntimos son redondeos.</p></div>`
        : `<div class="notice notice--warn"><p><strong>Nos sale ${eur2(calc.total)} y te cobran ${eur2(c.total)}</strong> (${pct(rel)} de diferencia). Antes de reclamar, revisa: que los precios sean los de este periodo (pueden haber cambiado a mitad), que no haya conceptos que no hemos leído (regularizaciones, otros servicios, descuentos), los días del periodo y si la factura es estimada.${c.pvpc ? " Con PVPC calculamos con un reparto horario tipo, así que puede haber una diferencia pequeña." : ""} <a href="/guias/cortes-y-reclamaciones/">Cómo reclamar</a></p></div>`;
  } else {
    comprobacion = `<div class="notice"><p>Para comprobar si tu factura cuadra, escribe el precio de la energía (€/kWh) y de la potencia (€/kW·día), o marca que tienes PVPC.</p></div>`;
  }

  // Lo que hemos visto.
  const obs: string[] = [];
  const serv = c.imp.servicios ?? 0;
  if (serv > 0) obs.push(`<strong>Pagas ${eur2(serv)} por servicios añadidos</strong>${c.servicios.length ? ` (${c.servicios.map((s) => esc(s.concepto)).join(", ")})` : ""}: unos ${eur(anual(serv))} al año. No son obligatorios; si no los usas, puedes darlos de baja (mira antes si tienen permanencia).`);
  if (c.e1 && !c.pvpc) {
    const ref = datos.medianaFijo;
    if (c.e1 > ref * 1.15) obs.push(`<strong>Tu precio de la energía (${num(c.e1, 3)} €/kWh) es alto</strong>: la mitad de las tarifas de precio fijo del mercado están por debajo de ${num(ref, 3)} €/kWh.`);
    else if (c.e1 < ref * 0.9) obs.push(`Tu precio de la energía (${num(c.e1, 3)} €/kWh) está por debajo de la media del mercado (${num(ref, 3)} €/kWh). Comprueba si es una promoción y cuándo acaba.`);
  }
  if (c.pvpc) obs.push(`Tienes la <strong>PVPC</strong>: el precio cambia cada hora. Poner la lavadora, el lavavajillas o el termo en las horas baratas baja la factura. <a href="/precio-luz-hoy/">Precio de hoy</a>`);
  if (c.conPeriodos && c.ktotal > 0) {
    const valle = (c.k.p3 ?? 0) / c.ktotal;
    const punta = (c.k.p1 ?? 0) / c.ktotal;
    obs.push(`Gastas el ${pct(punta)} en punta y el ${pct(valle)} en valle.${valle >= 0.45 ? " Consumes mucho en valle: te puede convenir una tarifa con el valle barato." : punta >= 0.35 ? " Mucho consumo en punta: una tarifa de precio único suele salir mejor que una de tres periodos." : ""}`);
  }
  const mes = (c.ktotal / c.dias) * 30.4;
  obs.push(`Consumes unos ${kwh(mes)} al mes${mes > 350 ? ", más que un hogar medio (200–300 kWh)" : mes < 150 ? ", menos que un hogar medio (200–300 kWh)" : ", como un hogar medio"}.`);
  const maxima = leida?.potenciaMaxima;
  if (maxima && maxima < Math.min(c.potencias.p1, c.potencias.p2) * 0.75) {
    obs.push(`<strong>Te sobra potencia:</strong> lo máximo que has usado en el último año son ${num(maxima, 2)} kW y tienes contratados ${num(c.potencias.p1, 2)} kW. Bajar potencia ahorra cada día. <a href="/herramientas/potencia/">Calcula cuánta necesitas</a>`);
  } else if (c.potencias.p1 >= 5.75) obs.push(`Tienes ${num(c.potencias.p1, 2)} kW contratados. Si no usas a la vez horno, vitro, lavadora y aire, quizá te sobra: <a href="/herramientas/potencia/">calcula tu potencia</a>.`);
  const cups = txt("cups").replace(/\s/g, "").toUpperCase();
  if (cups && !cupsValido(cups)) obs.push(`El CUPS «${esc(cups)}» no pasa la comprobación de letras de control: revisa que esté bien copiado. <a href="/herramientas/distribuidora/">Comprobar CUPS</a>`);

  // Alternativas.
  const referencia = calc?.total ?? c.total;
  // Las tres más baratas, una por compañía, para que se vea el mercado y no tres planes del mismo.
  const vistas = new Set<string>();
  const mejores = c.alternativas.filter((a) => !vistas.has(marca(a.tarifa.comercializadora)) && vistas.add(marca(a.tarifa.comercializadora))).slice(0, 3);
  const alt = mejores.length
    ? `<ol class="ef-alt">${mejores
        .map((a) => {
          const ahorro = anual(referencia - a.factura.total);
          return `<li><span class="ef-alt__n">${logoHtml(a.tarifa)}<span><strong>${esc(marca(a.tarifa.comercializadora))}</strong> · ${esc(nombrePlan(a.tarifa.nombre))}</span></span><span>${eur2(a.factura.total)}${ahorro > 5 ? ` <span class="pill pill--barata">−${eur(ahorro)}/año</span>` : ""}</span></li>`;
        })
        .join("")}</ol>
      <p class="caption">Misma factura (${c.dias} días, ${kwh(c.ktotal)}, ${num(c.potencias.p1, 2)} kW) calculada con cada tarifa, impuestos incluidos y sin promociones. El ahorro está pasado a un año.</p>`
    : `<p class="muted small">No hemos podido calcular las alternativas ahora mismo.</p>`;

  res.innerHTML = `
    <div class="card card--roomy">
      <span class="eyebrow">Tu factura, explicada</span>
      <p class="answer"><strong>${eur2(c.total)}</strong> por ${kwh(c.ktotal)}</p>
      <p class="lead">Del ${fechaCorta(c.desde)} al ${fechaCorta(c.hasta)} (${c.dias} días): sale a <strong>${num(medio, 3)} €/kWh</strong> todo incluido, unos ${eur(c.total / c.dias * 30.4)} al mes y ${eur(anual(c.total))} al año a este ritmo.</p>
    </div>
    ${comprobacion}
    <div class="ef-dos">
      <div class="card">
        <h2 class="ef-h">Qué pagas y por qué</h2>
        <ul class="ef-conceptos">${desglose}</ul>
      </div>
      <div class="stack" style="--stack:24px">
        <div class="card">
          <h2 class="ef-h">Lo que hemos visto</h2>
          <ul class="ef-obs">${obs.map((o) => `<li>${o}</li>`).join("")}</ul>
        </div>
        <div class="card">
          <h2 class="ef-h">¿Y con otra tarifa?</h2>
          ${alt}
          <p class="btn-row" style="margin-top:16px"><a class="btn btn--mint" href="/comparador/#factura">Comparar todas las tarifas con mi factura</a></p>
        </div>
      </div>
    </div>`;
  res.focus({ preventScroll: true });
  res.scrollIntoView({ block: "start" });
}

function detalleConcepto(clave: string, c: Contexto2): string {
  if (clave === "potencia") return ` Tienes ${num(c.potencias.p1, 2)} kW${c.potencias.p2 !== c.potencias.p1 ? ` en punta y ${num(c.potencias.p2, 2)} kW en valle` : ""} durante ${c.dias} días.`;
  if (clave === "energia") {
    if (c.conPeriodos) return ` Punta ${kwh(c.k.p1 ?? 0)}, llano ${kwh(c.k.p2 ?? 0)} y valle ${kwh(c.k.p3 ?? 0)}.`;
    return ` ${kwh(c.ktotal)} en total.`;
  }
  return "";
}

// ---------- Ejemplo ----------

/** Factura de ejemplo calculada con el motor, para enseñar cómo funciona sin subir nada. */
function facturaEjemplo(): string[] {
  const t = datos.tarifas.find((x) => x.tipo === "fijo" && x.potencia && x.energia && !x.servicios_obligatorios.length)!;
  const pot = t.potencia!;
  const ene = t.energia!;
  const fin = sumarDias(datos.hoy.slice(0, 8) + "01", -1);
  const ini = fin.slice(0, 8) + "01";
  const k = { 1: 61, 2: 64, 3: 96 } as const;
  const ls = generarLecturas({ desde: ini, hasta: fin, anualKwh: (221 * 365) / diasEntre(ini, fin), tipo: "estandar", festivos, porPeriodo: { ...k } });
  // Solo con sus precios (sin promociones ni condiciones), que es lo que la factura de ejemplo cuenta.
  const limpia: Tarifa = { ...t, tipo: "fijo", potencia: pot, energia: ene, cuota_fija_mes: 0, servicio_mes: undefined, servicios_obligatorios: [], info: undefined };
  const f = calcularFactura(ls, limpia, { p1: 3.45, p2: 3.45 }, { regulados: datos.regulados, festivos });
  const e = (n: number) => n.toFixed(2).replace(".", ",");
  const fecha = (s: string) => s.split("-").reverse().join("/");
  return [
    `${marca(t.comercializadora)} (factura de ejemplo)`,
    `Periodo de facturación: del ${fecha(ini)} al ${fecha(fin)} (${f.dias} días)`,
    `Por potencia contratada ${e(f.potencia)} €`,
    `Por energía consumida ${e(f.energia)} €`,
    `Financiación bono social ${e(f.bonoSocial)} €`,
    `Impuesto electricidad ${e(f.iee)} €`,
    `Alquiler equipos de medida y control ${e(f.alquiler)} €`,
    `IVA ${e(f.iva)} €`,
    `TOTAL IMPORTE FACTURA ${e(f.total)} €`,
    `CUPS: ES0021000012345678LB`,
    `Potencia contratada: punta 3,45 kW valle 3,45 kW`,
    `Potencia punta 3,45 kW x ${f.dias} días x ${pot.p1.toFixed(6).replace(".", ",")} €/kW día`,
    `Potencia valle 3,45 kW x ${f.dias} días x ${(pot.p2 ?? pot.p1).toFixed(6).replace(".", ",")} €/kW día`,
    `Energía consumida 221 kWh x ${(ene.p1 as number).toFixed(6).replace(".", ",")} €/kWh`,
    `Consumo punta 61 kWh`,
    `Consumo llano 64 kWh`,
    `Consumo valle 96 kWh`,
    `Consumo total 221 kWh`,
  ];
}

// ---------- Eventos ----------

const input = $<HTMLInputElement>("ef-fichero");
input.addEventListener("change", () => input.files?.[0] && procesar(input.files[0]));
const zona = document.querySelector<HTMLElement>(".dropzone")!;
zona.addEventListener("dragover", (e) => {
  e.preventDefault();
  zona.classList.add("is-over");
});
zona.addEventListener("dragleave", () => zona.classList.remove("is-over"));
zona.addEventListener("drop", (e) => {
  e.preventDefault();
  zona.classList.remove("is-over");
  const f = e.dataTransfer?.files[0];
  if (f) procesar(f);
});
$("ef-ejemplo").addEventListener("click", () => {
  const lineas = facturaEjemplo();
  const d = leerFactura(lineas);
  conceptos = conceptosEn(lineas);
  estado.innerHTML = `<div class="notice"><p><strong>Factura de ejemplo cargada.</strong> Así se ve una factura leída: los conceptos explicados aquí abajo y los datos para revisar. Pulsa «Explicar mi factura» para ver si cuadra.</p></div>`;
  pintarConceptos();
  mostrarFormulario(d);
});
$("ef-manual").addEventListener("click", () => {
  estado.innerHTML = "";
  conceptos = [];
  pintarConceptos();
  mostrarFormulario(null);
});

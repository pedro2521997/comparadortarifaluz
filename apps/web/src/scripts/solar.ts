// Calculadora solar: resultado primero; el formulario de estudio va después y nunca tapa el resultado.

import {
  produccionPvgis,
  produccionAproximada,
  consumoTipo,
  simular,
  escenario,
  tamanoRecomendado,
  type Matriz,
  type Ubicacion,
} from "../lib/solar";
import { leerPerfil, borrarPerfil } from "../lib/consumo-local";
import { eur, kwh, num, pct, fechaCorta } from "../lib/formato";

interface Datos {
  provincias: Record<string, { nombre: string; lat: number; lon: number }>;
  instalador: { nombre: string; zona: string[]; precios: { hastaKwp: number | null; eurPorKwp: number }[]; preciosProvisionales: boolean };
}

const datos: Datos = JSON.parse(document.getElementById("datos-solar")!.textContent!);
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const valor = (id: string) => parseFloat($<HTMLInputElement>(id).value.replace(",", ".")) || 0;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

const IMPUESTOS = 1.0511269632 * 1.21;
const MESES = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

// ---------- Origen del consumo ----------
const perfil = leerPerfil();
const origen = $("origen-consumo");
let usarFichero = Boolean(perfil);

function pintarOrigen() {
  if (perfil && usarFichero) {
    origen.innerHTML = `<div class="notice"><p><strong>Usamos tu fichero de consumos</strong> (${fechaCorta(perfil.desde)}–${fechaCorta(perfil.hasta)}, ${kwh(perfil.anualKwh)} al año). Es el cálculo más preciso. Está guardado solo en este navegador.</p>
      <p class="small"><button type="button" class="btn btn--ghost btn--small" id="no-fichero">Usar lo que pago al mes</button> <button type="button" class="btn btn--ghost btn--small" id="borrar-fichero">Borrar mis datos de este navegador</button></p></div>`;
    $("campo-factura").hidden = true;
    if (perfil.precioEnergia) $<HTMLInputElement>("precio").value = perfil.precioEnergia.toFixed(3);
    $("no-fichero").onclick = () => { usarFichero = false; pintarOrigen(); };
    $("borrar-fichero").onclick = () => { borrarPerfil(); location.replace(location.pathname); };
  } else {
    origen.innerHTML = `<p class="small muted">Para un cálculo más preciso, <a href="/comparador/">sube tu fichero de consumos en el comparador</a> y vuelve: lo usaremos hora a hora.</p>`;
    $("campo-factura").hidden = false;
  }
}
pintarOrigen();

// ---------- Ubicación ----------
function ubicacion(cp: string): (Ubicacion & { provincia: string }) | null {
  if (!/^\d{5}$/.test(cp)) return null;
  const p = datos.provincias[cp.slice(0, 2)];
  if (!p) return null;
  return { lat: p.lat, lon: p.lon, canarias: cp.startsWith("35") || cp.startsWith("38"), provincia: p.nombre };
}

function enZona(cp: string) {
  return datos.instalador.zona.some((z) => cp.startsWith(z));
}

function eurPorKwp(kwp: number) {
  return datos.instalador.precios.find((t) => t.hastaKwp === null || kwp <= t.hastaKwp)!.eurPorKwp;
}

const cacheProd = new Map<string, { matriz: Matriz; fuente: "pvgis" | "aprox" }>();
async function produccion(u: Ubicacion, inc: number, az: number) {
  const clave = `${u.lat},${u.lon},${inc},${az}`;
  if (cacheProd.has(clave)) return cacheProd.get(clave)!;
  let r: { matriz: Matriz; fuente: "pvgis" | "aprox" };
  try {
    r = { matriz: await produccionPvgis(u, inc, az), fuente: "pvgis" };
  } catch {
    r = { matriz: produccionAproximada(u, az), fuente: "aprox" };
  }
  cacheProd.set(clave, r);
  return r;
}

// ---------- Cálculo ----------
let ultimo: { cp: string; kwp: number; resumen: string } | null = null;
let estado: { prod: Matriz; fuente: string; consumo: Matriz; anual: number; maxKwp: number; u: Ubicacion & { provincia: string }; cp: string } | null = null;

$("form-solar").addEventListener("submit", async (e) => {
  e.preventDefault();
  const cp = $<HTMLInputElement>("cp").value.trim();
  const u = ubicacion(cp);
  const res = $("resultado-solar");
  res.hidden = false;
  if (!u) {
    res.innerHTML = `<div class="notice notice--error"><p>Escribe un código postal español de 5 cifras.</p></div>`;
    $("cp").focus();
    return;
  }
  const boton = $<HTMLButtonElement>("calcular-solar");
  boton.disabled = true;
  boton.textContent = "Calculando…";
  res.innerHTML = `<div class="notice" role="status"><p>Consultando la radiación solar de ${esc(u.provincia)} en PVGIS (Comisión Europea)…</p></div>`;

  const { matriz, fuente } = await produccion(u, Number($<HTMLSelectElement>("inclinacion").value), Number($<HTMLSelectElement>("orientacion").value));
  const teletrabajo = $<HTMLInputElement>("teletrabajo").checked;
  let consumo: Matriz;
  let anual: number;
  if (perfil && usarFichero) {
    consumo = perfil.mesHora; // el fichero ya refleja si hay alguien en casa de día
    anual = perfil.anualKwh;
  } else {
    const precio = valor("precio") || 0.13;
    const fijoMes = 3.45 * 0.085 * 30.4 + 1.5;
    const kwhMes = Math.max(60, (valor("factura") / IMPUESTOS - fijoMes) / precio);
    anual = kwhMes * 12;
    consumo = consumoTipo(anual, teletrabajo);
  }
  const maxKwp = Math.max(1, Math.floor((valor("tejado") / 5) * 2) / 2);
  estado = { prod: matriz, fuente, consumo, anual, maxKwp, u, cp };
  pintar(tamanoRecomendado(matriz, anual, maxKwp));

  boton.disabled = false;
  boton.textContent = "Volver a calcular";
  res.scrollIntoView({ block: "start" });
  res.focus({ preventScroll: true });
});

function pintar(kwp: number) {
  if (!estado) return;
  const { prod, fuente, consumo, anual, maxKwp, u, cp } = estado;
  const precios = { energia: valor("precio") || 0.13, excedente: valor("excedente"), impuestos: IMPUESTOS };
  const ayudas = valor("ayudas");
  const base = simular(prod, consumo, kwp, precios);
  const inversion = kwp * eurPorKwp(kwp);

  // Escenarios: prudente y favorable. Nunca una cifra única.
  const simP = simular(prod, consumo, kwp, { ...precios, energia: precios.energia * 0.85, excedente: precios.excedente * 0.8 }, 0.9);
  const simF = simular(prod, consumo, kwp, { ...precios, energia: precios.energia * 1.1 }, 1.05);
  const prudente = escenario(simP.ahorro, inversion * 1.1 - ayudas, 0.007, 1200);
  const favorable = escenario(simF.ahorro, inversion * 0.95 - ayudas, 0.004, 800);

  const pctAuto = base.autoconsumo / base.produccion;
  const pctCubre = base.autoconsumo / base.consumo;
  const maxMes = Math.max(...base.porMes.flatMap((m) => [m.produccion, m.consumo]));
  const amort = (e: typeof prudente) => (e.amortizacion === null ? "más de 25" : String(e.amortizacion));

  const avisoPiso = $<HTMLSelectElement>("vivienda").value === "piso"
    ? `<div class="notice notice--warn"><p>En un piso, las placas suelen ir en la cubierta común con <strong>autoconsumo colectivo</strong>: hace falta acuerdo de la comunidad y la producción se reparte. El cálculo te sirve de orientación para tu parte.</p></div>`
    : "";

  $("resultado-solar").innerHTML = `
  <div class="solar-res">
    <div class="card card--roomy stack" style="--stack:16px">
      <span class="eyebrow eyebrow--violet">Resultado para ${esc(u.provincia)}</span>
      <p class="answer">Ahorrarías entre <strong>${eur(simP.ahorro)}</strong> y <strong>${eur(simF.ahorro)}</strong> al año</p>
      <p class="lead">Con una instalación de <strong>${num(kwp, 1)} kWp</strong> (unas ${Math.round(kwp / 0.45)} placas) que produciría unos ${kwh(base.produccion)} al año. Usarías directamente el ${pct(pctAuto)} y cubriría el ${pct(pctCubre)} de tu consumo.</p>
      <div class="field" style="max-width:420px">
        <label for="kwp">Tamaño de la instalación: <strong id="kwp-v">${num(kwp, 1)} kWp</strong></label>
        <input id="kwp" type="range" min="1" max="${maxKwp}" step="0.5" value="${kwp}" />
        <span class="hint">Máximo para ${num(valor("tejado"))} m² de tejado: ${num(maxKwp, 1)} kWp. Recomendado: ${num(tamanoRecomendado(prod, anual, maxKwp), 1)} kWp.</span>
      </div>
    </div>
    ${avisoPiso}
    <div class="rango">
      <div class="stat"><span class="stat__label">Inversión estimada</span><span class="stat__value">${eur(inversion * 0.95)}–${eur(inversion * 1.1)}</span><span class="stat__sub">IVA incluido${ayudas ? `, antes de restar ${eur(ayudas)} de ayudas` : ""}</span></div>
      <div class="stat"><span class="stat__label">Se paga sola en</span><span class="stat__value">${amort(favorable)}–${amort(prudente)} años</span><span class="stat__sub">del favorable al prudente</span></div>
      <div class="stat"><span class="stat__label">Ahorro neto en 25 años</span><span class="stat__value">${eur(prudente.neto25)}–${eur(favorable.neto25)}</span><span class="stat__sub">ya descontada la inversión</span></div>
    </div>
    <div class="card">
      <h3>Producción y consumo, mes a mes</h3>
      <p class="leyenda" style="margin-top:8px"><span><span class="pill pill--barata">Producción</span></span><span><span class="pill pill--cara">Consumo</span></span></p>
      <div class="meses" role="img" aria-label="Producción frente a consumo por meses">
        ${base.porMes.map((m, i) => `<div class="meses__m"><div class="meses__barras"><span class="b-prod" style="height:${(m.produccion / maxMes) * 100}%" title="Producción ${kwh(m.produccion)}"></span><span class="b-cons" style="height:${(m.consumo / maxMes) * 100}%" title="Consumo ${kwh(m.consumo)}"></span></div><span class="meses__l">${MESES[i]}</span></div>`).join("")}
      </div>
      <details style="margin-top:16px"><summary>Ver los datos y cómo lo calculamos</summary>
        <div class="stack small" style="--stack:8px;padding-top:8px">
          <p><strong>Producción:</strong> ${fuente === "pvgis" ? "PVGIS 5.3 de la Comisión Europea, hora a hora con la radiación real de 2023 en tu zona" : "aproximación por latitud (no hemos podido consultar PVGIS ahora mismo; el resultado es menos preciso)"}, con un 14 % de pérdidas del sistema.</p>
          <p><strong>Consumo:</strong> ${perfil && usarFichero ? "tu fichero de consumos, hora a hora por mes" : `${kwh(anual)} al año estimados a partir de tu factura, con un perfil tipo de hogar`}.</p>
          <p><strong>Ahorro:</strong> lo que consumes de tus placas se valora a tu precio de energía (${num(precios.energia, 3)} €/kWh) y los excedentes a ${num(precios.excedente, 3)} €/kWh con compensación simplificada, que nunca descuenta más que el término de energía de cada mes. Impuesto eléctrico e IVA incluidos. Escenario prudente: −10 % de producción, −15 % de precio de la luz, +10 % de inversión y cambio de inversor. Favorable: +5 % de producción y +10 % de precio.</p>
          <p><strong>Inversión:</strong> ${datos.instalador.preciosProvisionales ? "precios orientativos por kWp mientras recibimos la tabla del instalador" : "tabla de precios del instalador colaborador"} (${num(eurPorKwp(kwp))} €/kWp para este tamaño).</p>
          <p>Producción anual ${kwh(base.produccion)} · autoconsumo ${kwh(base.autoconsumo)} · excedentes ${kwh(base.excedentes)} · consumo ${kwh(base.consumo)}.</p>
        </div>
      </details>
    </div>
    <p class="caption">Es una estimación, no una oferta vinculante. Un instalador tiene que ver tu tejado (sombras, estructura, espacio real) para darte una cifra cerrada.</p>
  </div>`;

  // "change" y no "input": el bloque se repinta entero y cortaría el arrastre.
  $<HTMLInputElement>("kwp").addEventListener("change", (ev) => {
    const v = Number((ev.target as HTMLInputElement).value);
    pintar(v);
    $<HTMLInputElement>("kwp").focus();
  });

  ultimo = {
    cp,
    kwp,
    resumen: `${num(kwp, 1)} kWp · ${kwh(base.produccion)}/año · ahorro ${eur(simP.ahorro)}–${eur(simF.ahorro)}/año · consumo ${kwh(anual)}/año (${perfil && usarFichero ? "fichero" : "factura"}) · ${$<HTMLSelectElement>("vivienda").value} · tejado ${valor("tejado")} m²`,
  };
  pintarEstudio(enZona(cp));
}

// ---------- Petición de estudio (después del resultado) ----------
function pintarEstudio(zonaOk: boolean) {
  const caja = $("estudio");
  caja.hidden = false;
  const nombre = esc(datos.instalador.nombre);
  caja.innerHTML = zonaOk
    ? `<form id="form-estudio" class="card card--roomy estudio-card stack" style="--stack:20px" novalidate>
        <span class="eyebrow">Siguiente paso</span>
        <h2 style="font-size:36px">Pide un estudio gratuito y sin compromiso</h2>
        <p class="muted">Un instalador colaborador revisará tu tejado y te dará un presupuesto cerrado. Te enviamos este cálculo para que no tengas que repetir nada.</p>
        <div class="form-grid form-grid--2">
          <div class="field"><label for="e-nombre">Nombre</label><input id="e-nombre" type="text" autocomplete="given-name" required /></div>
          <div class="field"><label for="e-contacto">Teléfono o correo</label><input id="e-contacto" type="text" autocomplete="tel" required /></div>
        </div>
        <p class="small muted">Se enviará también: código postal ${esc(ultimo!.cp)} y el resumen «${esc(ultimo!.resumen)}».</p>
        <label class="check"><input id="e-consent" type="checkbox" required /> <span>Acepto que mis datos se envíen a ${nombre}, instalador colaborador, para que me contacte con un estudio. Puedo retirar el consentimiento cuando quiera. <a href="/privacidad/">Privacidad</a></span></label>
        <div><button class="btn" type="submit">Pedir mi estudio gratuito</button></div>
        <div id="e-estado" aria-live="polite"></div>
      </form>`
    : `<form id="form-estudio" class="card card--roomy stack" style="--stack:20px" novalidate>
        <span class="eyebrow">Tu zona</span>
        <h2 style="font-size:36px">Aún no tenemos instalador en tu zona</h2>
        <p class="muted">Si quieres, te avisamos cuando tengamos un instalador de confianza cerca de ti. Si no, no guardamos nada.</p>
        <div class="form-grid form-grid--2">
          <div class="field"><label for="e-nombre">Nombre</label><input id="e-nombre" type="text" autocomplete="given-name" required /></div>
          <div class="field"><label for="e-contacto">Teléfono o correo</label><input id="e-contacto" type="text" autocomplete="email" required /></div>
        </div>
        <label class="check"><input id="e-consent" type="checkbox" required /> <span>Acepto que LuzSinTrampa guarde mis datos para avisarme cuando haya un instalador en mi zona. <a href="/privacidad/">Privacidad</a></span></label>
        <div><button class="btn btn--ghost" type="submit">Avisadme</button></div>
        <div id="e-estado" aria-live="polite"></div>
      </form>`;

  $("form-estudio").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = $<HTMLInputElement>("e-nombre").value.trim();
    const contacto = $<HTMLInputElement>("e-contacto").value.trim();
    const consent = $<HTMLInputElement>("e-consent").checked;
    const est = $("e-estado");
    const contactoOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contacto) || /^\+?[\d\s]{9,15}$/.test(contacto);
    if (!nombre || !contactoOk) {
      est.innerHTML = `<div class="notice notice--error"><p>Escribe tu nombre y un teléfono o correo válido.</p></div>`;
      return;
    }
    if (!consent) {
      est.innerHTML = `<div class="notice notice--error"><p>Para enviar tus datos necesitamos que marques la casilla de consentimiento.</p></div>`;
      return;
    }
    est.innerHTML = `<p class="small">Enviando…</p>`;
    try {
      const r = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, contacto, cp: ultimo!.cp, resumen: ultimo!.resumen, tipo: zonaOk ? "estudio" : "futuro", consentimiento: true }),
      });
      const j = r.ok ? await r.json() : null;
      if (!j?.codigo) throw new Error();
      $("form-estudio").innerHTML = `<span class="eyebrow">Recibido</span><h2 style="font-size:36px">${zonaOk ? "¡Listo! Te contactarán en menos de 48 horas laborables" : "¡Hecho! Te avisaremos"}</h2><p class="muted">Tu código de referencia es <strong>${esc(j.codigo)}</strong>.</p>`;
    } catch {
      est.innerHTML = `<div class="notice notice--error"><p>No hemos podido enviarlo ahora mismo. Inténtalo de nuevo en unos minutos.</p></div>`;
    }
  });
}

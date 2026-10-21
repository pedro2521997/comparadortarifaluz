// Ranking interactivo: filtros, orden por columnas, promociones, detalle y exportación.
// Lo usan el comparador (con tu fichero o tu factura) y la página /tarifas/.

import { compararTarifas, type Contexto, type Lectura, type Potencias, type Tarifa, type Comparacion } from "@lst/tarifa";
import { aFilas, ordenar, tablaRanking, detalleHtml, csvRanking, marca, type ColumnaOrden, type Fila } from "../lib/ranking";
import { num, kwh } from "../lib/formato";

export interface EntradaRanking {
  lecturas: Lectura[];
  potencias: Potencias;
  ctx: Contexto;
  tarifas: Tarifa[];
  hoy: string;
  idActual?: string | null;
}

interface Estado {
  promociones: boolean;
  tipo: "todas" | "fijo" | "periodos" | "pvpc" | "indexada";
  sinPermanencia: boolean;
  sinServicios: boolean;
  verde: boolean;
  online: boolean;
  ocultarRevisar: boolean;
  soloAptas: boolean;
  texto: string;
  comercializadora: string;
  orden: ColumnaOrden;
  asc: boolean;
  limite: number;
}

const INICIAL: Estado = {
  promociones: false, tipo: "todas", sinPermanencia: false, sinServicios: false, verde: false, online: false,
  ocultarRevisar: false, soloAptas: true, texto: "", comercializadora: "", orden: "total", asc: true, limite: 25,
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/** Monta el ranking en `raiz`. Devuelve una función para recalcular con nuevos datos. */
export function montarRanking(raiz: HTMLElement, entrada: EntradaRanking) {
  let e = entrada;
  const estado: Estado = { ...INICIAL };
  const abiertas = new Set<string>();
  let calculadas: { promociones: boolean; lista: Comparacion[] } | null = null;
  let visibles: Fila[] = [];

  const calcular = () => {
    if (!calculadas || calculadas.promociones !== estado.promociones) {
      calculadas = { promociones: estado.promociones, lista: compararTarifas(e.lecturas, e.tarifas, e.potencias, { ...e.ctx, promociones: estado.promociones }, e.hoy) };
    }
    return calculadas.lista;
  };

  const kwhTotal = () => e.lecturas.reduce((a, l) => a + l.kwh, 0);

  function apta(t: Tarifa) {
    const i = t.info ?? {};
    const potMax = Math.max(e.potencias.p1, e.potencias.p2);
    if (i.potencia_max_kw && potMax > i.potencia_max_kw) return false;
    if (t.tipo === "pvpc" && potMax > 10) return false;
    const anual = (kwhTotal() / Math.max(1, new Set(e.lecturas.map((l) => l.fecha)).size)) * 365;
    if (i.consumo_max_kwh && anual > i.consumo_max_kwh) return false;
    return true;
  }

  function filtrar(lista: Comparacion[]): Comparacion[] {
    const q = estado.texto.trim().toLowerCase();
    return lista.filter((c) => {
      const t = c.tarifa;
      const i = t.info ?? {};
      if (t.id === e.idActual) return true; // tu tarifa siempre se ve, como referencia
      if (estado.tipo !== "todas" && t.tipo !== estado.tipo) return false;
      if (estado.sinPermanencia && t.permanencia_meses > 0) return false;
      if (estado.sinServicios && (t.servicios_obligatorios.length || i.servicios_adicionales)) return false;
      if (estado.verde && !i.verde) return false;
      if (estado.online && !i.contratacion?.internet) return false;
      if (estado.ocultarRevisar && c.porRevisar && t.tipo !== "pvpc") return false;
      if (estado.soloAptas && !apta(t)) return false;
      if (estado.comercializadora && marca(t.comercializadora) !== estado.comercializadora) return false;
      if (q && !`${marca(t.comercializadora)} ${t.comercializadora} ${t.nombre}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function pintarTabla() {
    const lista = calcular();
    const filtradas = filtrar(lista);
    const todas = aFilas(filtradas, e.idActual);
    visibles = ordenar(todas, estado.orden, estado.asc).map((f, i) => ({ ...f, pos: i + 1 }));
    const mostradas = visibles.slice(0, estado.limite);
    // Tu tarifa siempre se ve, aunque quede fuera de las primeras.
    const tuya = visibles.find((f) => f.tarifa.id === e.idActual);
    if (tuya && !mostradas.includes(tuya)) mostradas.push(tuya);
    const resto = visibles.length - Math.min(visibles.length, estado.limite);
    const ref = e.idActual && lista.some((c) => c.tarifa.id === e.idActual) ? "tu tarifa" : "la más barata";
    const dias = lista[0]?.factura.dias ?? 0;
    raiz.querySelector<HTMLElement>("[data-rk-resumen]")!.innerHTML =
      `<strong>${visibles.length}</strong> de ${lista.length} tarifas · ${new Set(visibles.map((f) => marca(f.tarifa.comercializadora))).size} comercializadoras · ${dias} días · ${kwh(kwhTotal())} · potencia ${num(e.potencias.p1, 2)} / ${num(e.potencias.p2, 2)} kW${estado.promociones ? " · <strong>con promociones del primer año</strong>" : ""}`;
    raiz.querySelector<HTMLElement>("[data-rk-tabla]")!.innerHTML =
      mostradas.length ? tablaRanking(mostradas, { idActual: e.idActual, referencia: ref, orden: estado.orden, asc: estado.asc, abiertas, hoy: e.hoy })
        : `<div class="notice"><p>Ninguna tarifa cumple los filtros. Quita alguno para ver más.</p></div>`;
    const mas = raiz.querySelector<HTMLElement>("[data-rk-mas]")!;
    mas.hidden = resto <= 0;
    mas.querySelector("button")!.textContent = `Ver ${Math.min(resto, 25)} tarifas más (quedan ${resto})`;
  }

  // ---------- Controles ----------
  const comercializadoras = [...new Set(e.tarifas.map((t) => marca(t.comercializadora)))].sort((a, b) => a.localeCompare(b, "es"));
  raiz.innerHTML = `
  <div class="rk">
    <div class="rk-ctrl" role="group" aria-label="Filtros del ranking">
      <div class="rk-ctrl__fila">
        <div class="field rk-buscar"><label for="rk-q">Buscar</label><input id="rk-q" type="search" placeholder="Comercializadora o tarifa" autocomplete="off" /></div>
        <div class="field"><label for="rk-com">Comercializadora</label><select id="rk-com"><option value="">Todas</option>${comercializadoras.map((c) => `<option>${esc(c)}</option>`).join("")}</select></div>
        <div class="field"><label for="rk-tipo">Tipo de tarifa</label><select id="rk-tipo"><option value="todas">Todas</option><option value="fijo">Precio único 24 h</option><option value="periodos">3 periodos</option><option value="indexada">Indexada al mercado</option><option value="pvpc">Regulada (PVPC)</option></select></div>
      </div>
      <div class="rk-ctrl__checks">
        <label class="check"><input type="checkbox" data-f="sinPermanencia" /> <span>Sin permanencia</span></label>
        <label class="check"><input type="checkbox" data-f="sinServicios" /> <span>Sin servicios añadidos</span></label>
        <label class="check"><input type="checkbox" data-f="online" /> <span>Contratación online</span></label>
        <label class="check"><input type="checkbox" data-f="verde" /> <span>100 % renovable</span></label>
        <label class="check"><input type="checkbox" data-f="soloAptas" checked /> <span>Solo las que admiten mi potencia y consumo</span></label>
        <label class="check"><input type="checkbox" data-f="ocultarRevisar" /> <span>Ocultar precios por revisar</span></label>
        <label class="check rk-promo"><input type="checkbox" data-f="promociones" /> <span>Aplicar promociones del primer año</span></label>
      </div>
    </div>
    <div class="rk-barra">
      <p class="rk-resumen" data-rk-resumen aria-live="polite"></p>
      <button type="button" class="btn btn--ghost btn--small" data-rk-csv>Descargar en CSV</button>
    </div>
    <div data-rk-tabla></div>
    <p class="center" data-rk-mas hidden><button type="button" class="btn btn--ghost"></button></p>
    <p class="caption rk-pie">Ordenado por lo que habrías pagado; puedes reordenar pulsando en las columnas. Precios sin promociones salvo que marques la casilla. La comisión nunca cambia el orden. Catálogo: comparador oficial de la CNMC y webs de las comercializadoras.</p>
  </div>`;

  const ctrl = raiz.querySelector<HTMLElement>(".rk")!;
  ctrl.querySelector<HTMLInputElement>("#rk-q")!.addEventListener("input", (ev) => {
    estado.texto = (ev.target as HTMLInputElement).value;
    pintarTabla();
  });
  ctrl.querySelector<HTMLSelectElement>("#rk-com")!.addEventListener("change", (ev) => {
    estado.comercializadora = (ev.target as HTMLSelectElement).value;
    pintarTabla();
  });
  ctrl.querySelector<HTMLSelectElement>("#rk-tipo")!.addEventListener("change", (ev) => {
    estado.tipo = (ev.target as HTMLSelectElement).value as Estado["tipo"];
    pintarTabla();
  });
  for (const c of ctrl.querySelectorAll<HTMLInputElement>("[data-f]")) {
    c.addEventListener("change", () => {
      (estado as unknown as Record<string, boolean>)[c.dataset.f!] = c.checked;
      pintarTabla();
    });
  }
  ctrl.querySelector("[data-rk-mas] button")!.addEventListener("click", () => {
    estado.limite += 25;
    pintarTabla();
  });
  ctrl.querySelector("[data-rk-csv]")!.addEventListener("click", () => {
    const blob = new Blob([csvRanking(visibles)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ranking-tarifas-luz-${e.hoy}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  // Delegación: ordenar y abrir detalle.
  ctrl.querySelector("[data-rk-tabla]")!.addEventListener("click", (ev) => {
    const el = ev.target as HTMLElement;
    const ord = el.closest<HTMLButtonElement>("[data-orden]");
    if (ord) {
      const col = ord.dataset.orden as ColumnaOrden;
      estado.asc = estado.orden === col ? !estado.asc : col === "nombre" || col === "total" || col === "eurKwh" || col === "potencia" || col === "energia" || col === "otros";
      if (col === "fecha") estado.asc = false;
      estado.orden = col;
      pintarTabla();
      raiz.querySelector<HTMLButtonElement>(`[data-orden="${col}"]`)?.focus();
      return;
    }
    const ver = el.closest<HTMLButtonElement>("[data-ver]");
    if (ver) {
      const id = ver.dataset.ver!;
      const fila = visibles.find((f) => f.tarifa.id === id);
      const det = raiz.querySelector<HTMLTableRowElement>(`#rk-d-${CSS.escape(id)}`);
      if (!fila || !det) return;
      const abrir = !abiertas.has(id);
      if (abrir) abiertas.add(id);
      else abiertas.delete(id);
      det.hidden = !abrir;
      det.firstElementChild!.innerHTML = abrir ? detalleHtml(fila, e.idActual) : "";
      ver.setAttribute("aria-expanded", String(abrir));
      ver.textContent = abrir ? "Ocultar" : "Ver detalle";
    }
  });

  pintarTabla();

  return {
    actualizar(nueva: EntradaRanking) {
      e = nueva;
      calculadas = null;
      pintarTabla();
    },
    filas: () => visibles,
  };
}


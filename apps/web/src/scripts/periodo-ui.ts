// ¿Qué periodo es ahora? Se calcula en el navegador con la hora de España (o de Canarias) y los festivos
// nacionales, y se actualiza solo cada minuto.

import { periodoEnergia, sumarDias, diaSemana, type PeriodoEnergia } from "@lst/tarifa";
import { cargarDia } from "../lib/precios-cliente";
import { ekwh } from "../lib/formato";

const datos = JSON.parse(document.getElementById("datos-periodo")!.textContent!) as { festivos: string[]; precioHora: Record<string, number> };
const festivos = new Set(datos.festivos);
const $ = (id: string) => document.getElementById(id)!;

const NOMBRE: Record<PeriodoEnergia, string> = { 1: "punta", 2: "llano", 3: "valle" };
const CONSEJO: Record<PeriodoEnergia, string> = {
  1: "La hora más cara en las tarifas por periodos. Si puedes, espera para poner la lavadora, el lavavajillas, el horno o cargar el coche.",
  2: "Precio intermedio. Bien para lo que no puede esperar al valle.",
  3: "La hora más barata en las tarifas por periodos: buen momento para la lavadora, el lavavajillas, el termo o cargar el coche.",
};
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function ahoraEn(zona: string) {
  const p = new Intl.DateTimeFormat("sv-SE", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const v = (t: string) => p.find((x) => x.type === t)!.value;
  return { fecha: `${v("year")}-${v("month")}-${v("day")}`, hora: Number(v("hour")), minuto: Number(v("minute")) };
}

/** Siguiente cambio de periodo a partir de ahora: fecha, hora y periodo que empieza. */
function siguienteCambio(fecha: string, hora: number) {
  const actual = periodoEnergia(fecha, hora, festivos);
  let f = fecha;
  let h = hora;
  for (let i = 0; i < 24 * 8; i++) {
    h++;
    if (h === 24) {
      h = 0;
      f = sumarDias(f, 1);
    }
    const p = periodoEnergia(f, h, festivos);
    if (p !== actual) return { fecha: f, hora: h, periodo: p };
  }
  return null;
}

const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;
const cuando = (fecha: string, hoy: string) => (fecha === hoy ? "hoy" : fecha === sumarDias(hoy, 1) ? "mañana" : `el ${DIAS[diaSemana(fecha)]}`);

let preciosHoy: (number | null)[] | null = null;
let fechaPrecios = "";

function pintar() {
  const zona = ($("pa-zona") as HTMLSelectElement).value;
  const { fecha, hora, minuto } = ahoraEn(zona);
  const p = periodoEnergia(fecha, hora, festivos);
  const sig = siguienteCambio(fecha, hora);
  const raiz = $("pa-ahora");
  raiz.dataset.periodo = NOMBRE[p];
  $("pa-periodo").textContent = NOMBRE[p].toUpperCase();
  $("pa-reloj").textContent = `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
  $("pa-consejo").textContent = CONSEJO[p];
  if (sig) {
    const minutos = (Date.parse(`${sig.fecha}T${hh(sig.hora)}:00Z`) - Date.parse(`${fecha}T${hh(hora)}:00Z`)) / 60000 - minuto;
    const h = Math.floor(minutos / 60);
    const m = Math.round(minutos % 60);
    $("pa-siguiente").innerHTML = `Pasa a <strong>${NOMBRE[sig.periodo]}</strong> ${cuando(sig.fecha, fecha)} a las ${hh(sig.hora)} · faltan ${h ? `${h} h ` : ""}${m} min`;
  }
  const finde = diaSemana(fecha) === 0 || diaSemana(fecha) === 6;
  $("pa-dia").textContent = festivos.has(fecha) ? "Hoy es festivo nacional: todo el día es valle." : finde ? "Es fin de semana: todo el día es valle." : `Hoy es ${DIAS[diaSemana(fecha)]}, día laborable.`;

  // Precio PVPC de esta hora (solo península: es el mismo precio en todo el país).
  const precio = preciosHoy && fechaPrecios === fecha ? preciosHoy[hora] : (datos.precioHora[`${fecha}-${hora}`] ?? null);
  $("pa-pvpc").innerHTML = precio != null ? `Si tienes PVPC, ahora la luz cuesta <strong>${ekwh(precio)}</strong> (sin impuestos). <a href="/precio-luz-hoy/">Ver todas las horas</a>` : `<a href="/precio-luz-hoy/">Precio de la luz hoy, hora a hora</a>`;

  // Hoy, hora a hora, y la semana.
  $("pa-hoy").innerHTML = Array.from({ length: 24 }, (_, i) => {
    const q = periodoEnergia(fecha, i, festivos);
    return `<span class="pa-h pa-h--${NOMBRE[q]}${i === hora ? " pa-h--ahora" : ""}" title="${hh(i)}–${hh(i + 1)}: ${NOMBRE[q]}"><span class="sr-only">${hh(i)} ${NOMBRE[q]}</span></span>`;
  }).join("");
  const filas = Array.from({ length: 7 }, (_, d) => {
    const f = sumarDias(fecha, d);
    const celdas = Array.from({ length: 24 }, (_, i) => {
      const q = periodoEnergia(f, i, festivos);
      return `<td class="pa-c pa-c--${NOMBRE[q]}${d === 0 && i === hora ? " pa-h--ahora" : ""}"><span class="sr-only">${NOMBRE[q]}</span></td>`;
    }).join("");
    return `<tr><th scope="row">${d === 0 ? "Hoy" : d === 1 ? "Mañana" : DIAS[diaSemana(f)][0].toUpperCase() + DIAS[diaSemana(f)].slice(1)}${festivos.has(f) ? " (festivo)" : ""}</th>${celdas}</tr>`;
  }).join("");
  $("pa-semana").innerHTML = `<thead><tr><th scope="col"><span class="sr-only">Día</span></th>${Array.from({ length: 24 }, (_, i) => `<th scope="col">${i}</th>`).join("")}</tr></thead><tbody>${filas}</tbody>`;
}

$("pa-zona").addEventListener("change", pintar);
pintar();
setInterval(pintar, 30_000);

// Precio de hoy del navegador si el de la página es de otro día.
const hoy = ahoraEn("Europe/Madrid").fecha;
cargarDia(hoy).then((p) => {
  if (p) {
    preciosHoy = p;
    fechaPrecios = hoy;
    pintar();
  }
});

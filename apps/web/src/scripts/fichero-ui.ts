// Lógica del componente SubirFichero: lee el CSV en el navegador, pide el mapeo de columnas si no
// reconoce el formato y guarda las lecturas en sessionStorage (solo esta pestaña y esta sesión) para
// poder pasar del comparador al analizador o al calculador sin volver a subirlo.

import { leerConsumos, leerConMapeo, ocultarCups, type Lectura, type Mapeo } from "@lst/csv";
import { fechaCorta, kwh, num, sumarDias, hoyMadrid } from "../lib/formato";

export interface FicheroLeido {
  lecturas: Lectura[];
  cups: string | null;
  desde: string;
  hasta: string;
  avisos: string[];
  ejemplo?: boolean;
}

const CLAVE = "lst-fichero-sesion";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

export function ficheroDeSesion(): FicheroLeido | null {
  try {
    const t = sessionStorage.getItem(CLAVE);
    return t ? (JSON.parse(t) as FicheroLeido) : null;
  } catch {
    return null;
  }
}

export function guardarSesion(f: FicheroLeido) {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify({ ...f, cups: f.cups ? ocultarCups(f.cups) : null }));
  } catch {
    /* almacenamiento lleno o bloqueado: no pasa nada, habrá que volver a subirlo */
  }
}

/** Fichero de ejemplo con formato Datadis: un hogar tipo de 2–3 personas durante un año. */
export function ficheroEjemplo(): string {
  const fin = sumarDias(hoyMadrid(), -2);
  const inicio = sumarDias(fin, -364);
  const lineas = ["CUPS;Fecha;Hora;Consumo_kWh;Metodo_obtencion"];
  let semilla = 7;
  const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
  const base = [0.18, 0.15, 0.14, 0.13, 0.13, 0.14, 0.2, 0.42, 0.38, 0.25, 0.22, 0.24, 0.3, 0.45, 0.52, 0.35, 0.26, 0.28, 0.36, 0.48, 0.66, 0.72, 0.55, 0.32];
  for (let f = inicio; f <= fin; f = sumarDias(f, 1)) {
    const estacion = [1.35, 1.3, 1.1, 0.95, 0.9, 1.05, 1.25, 1.25, 1.0, 0.95, 1.1, 1.35][Number(f.slice(5, 7)) - 1];
    const [y, m, d] = f.split("-");
    // El último domingo de marzo tiene 23 horas: no existe la de 2 a 3 (hora 3 en formato Datadis).
    const corto = m === "03" && Number(d) >= 25 && new Date(Date.UTC(+y, 2, +d)).getUTCDay() === 0;
    for (let h = 1; h <= 24; h++) {
      if (corto && h === 3) continue;
      const v = base[h - 1] * estacion * (0.75 + azar() * 0.5);
      lineas.push(`ES0021000000000000EJ0F;${y}/${m}/${d};${String(h).padStart(2, "0")}:00;${v.toFixed(3).replace(".", ",")};Real`);
    }
  }
  return lineas.join("\n");
}

/** Monta el componente con id `id`. `alLeer` recibe el fichero cada vez que se carga uno válido. */
export function montarSubida(id: string, alLeer: (f: FicheroLeido) => void) {
  const raiz = document.querySelector<HTMLElement>(`[data-subir="${id}"]`)!;
  const input = raiz.querySelector<HTMLInputElement>("[data-input]")!;
  const zona = raiz.querySelector<HTMLLabelElement>(".dropzone")!;
  const estado = raiz.querySelector<HTMLElement>("[data-estado]")!;
  const mapeoBox = raiz.querySelector<HTMLElement>("[data-mapeo]")!;
  const previo = raiz.querySelector<HTMLElement>("[data-previo]")!;
  let texto = "";

  const mostrar = (html: string, tipo: "ok" | "warn" | "error") => {
    estado.innerHTML = `<div class="${tipo === "ok" ? "notice" : tipo === "warn" ? "notice notice--warn" : "notice notice--error"}">${html}</div>`;
  };

  function aceptar(f: FicheroLeido, guardar = true) {
    const total = f.lecturas.reduce((a, x) => a + x.kwh, 0);
    const dias = Math.round((Date.parse(f.hasta) - Date.parse(f.desde)) / 86_400_000) + 1;
    mostrar(
      `<p><strong>${f.ejemplo ? "Fichero de ejemplo" : "Fichero leído"}:</strong> ${num(f.lecturas.length)} horas del ${fechaCorta(f.desde)} al ${fechaCorta(f.hasta)} (${dias} días), ${kwh(total)}${f.cups ? ` · CUPS ${esc(ocultarCups(f.cups))}` : ""}.</p>${
        dias < 28 ? `<p class="small"><strong>Ojo:</strong> solo ${dias} días. Para sacar conclusiones, mejor un año entero.</p>` : ""
      }${f.avisos.length ? `<ul class="small">${f.avisos.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>` : ""}`,
      dias < 28 ? "warn" : "ok",
    );
    mapeoBox.hidden = true;
    previo.hidden = true;
    if (guardar) guardarSesion(f);
    alLeer(f);
  }

  function procesar(t: string, ejemplo = false) {
    texto = t;
    const r = leerConsumos(t);
    if (r.ok) return aceptar({ lecturas: r.lecturas, cups: r.cups, desde: r.desde, hasta: r.hasta, avisos: r.avisos, ejemplo });
    if (r.cabecera) {
      mostrar(`<p><strong>No reconocemos este formato automáticamente.</strong> ${esc(r.error)}</p>`, "warn");
      pedirMapeo(r.cabecera, r.muestra ?? [], r.mapeoParcial ?? {});
    } else {
      mostrar(`<p><strong>No hemos podido leer el fichero.</strong> ${esc(r.error)}</p><p class="small">Si es de una distribuidora que no reconocemos, mira <a href="/guias/fichero-de-consumos/">el formato del fichero</a>.</p>`, "error");
    }
  }

  function pedirMapeo(cabecera: string[], muestra: string[][], parcial: Partial<Mapeo>) {
    const opciones = (sel: number, vacia: string | null) =>
      (vacia !== null ? `<option value="-1">${vacia}</option>` : "") +
      cabecera.map((c, i) => `<option value="${i}" ${i === sel ? "selected" : ""}>${esc(c || `Columna ${i + 1}`)} (p. ej. «${esc(muestra[0]?.[i] ?? "")}»)</option>`).join("");
    mapeoBox.hidden = false;
    mapeoBox.innerHTML = `<div class="card stack" style="--stack:12px;margin-top:16px">
      <h3>¿Qué es cada columna?</h3>
      <div class="mapeo-grid">
        <div class="field"><label for="${id}-m-fecha">Fecha</label><select id="${id}-m-fecha">${opciones(parcial.colFecha ?? 0, null)}</select></div>
        <div class="field"><label for="${id}-m-hora">Hora</label><select id="${id}-m-hora">${opciones(parcial.colHora ?? -1, "Va junto a la fecha")}</select></div>
        <div class="field"><label for="${id}-m-kwh">Consumo</label><select id="${id}-m-kwh">${opciones(parcial.colKwh ?? Math.min(2, cabecera.length - 1), null)}</select></div>
        <div class="field"><label for="${id}-m-unidad">Unidad</label><select id="${id}-m-unidad"><option value="kWh">kWh</option><option value="Wh">Wh</option></select></div>
      </div>
      <button type="button" class="btn btn--small" data-aplicar>Leer con estas columnas</button></div>`;
    mapeoBox.querySelector("[data-aplicar]")!.addEventListener("click", () => {
      const v = (s: string) => Number(document.querySelector<HTMLSelectElement>(`#${id}-m-${s}`)!.value);
      const r = leerConMapeo(texto, {
        separador: parcial.separador ?? ";", filaCabecera: parcial.filaCabecera ?? 0,
        colFecha: v("fecha"), colHora: v("hora"), colKwh: v("kwh"), colCups: parcial.colCups ?? -1,
        unidad: document.querySelector<HTMLSelectElement>(`#${id}-m-unidad`)!.value as "kWh" | "Wh",
      });
      if (r.ok) aceptar({ lecturas: r.lecturas, cups: r.cups, desde: r.desde, hasta: r.hasta, avisos: r.avisos });
      else mostrar(`<p><strong>Sigue sin cuadrar.</strong> ${esc(r.error)}</p>`, "error");
    });
  }

  function leerArchivo(f: File) {
    if (f.size > 30 * 1024 * 1024) return mostrar("<p>El fichero es demasiado grande (más de 30 MB).</p>", "error");
    mostrar(`<p>Leyendo ${esc(f.name)}…</p>`, "ok");
    const lector = new FileReader();
    lector.onload = () => {
      const t = String(lector.result ?? "");
      if (t.includes("�")) {
        const r2 = new FileReader();
        r2.onload = () => procesar(String(r2.result ?? ""));
        r2.readAsText(f, "windows-1252");
        return;
      }
      procesar(t);
    };
    lector.onerror = () => mostrar("<p>No se ha podido abrir el fichero.</p>", "error");
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
  raiz.querySelector("[data-ejemplo]")!.addEventListener("click", () => procesar(ficheroEjemplo(), true));

  // Fichero cargado antes en esta sesión (en otra herramienta).
  const s = ficheroDeSesion();
  if (s) {
    previo.hidden = false;
    previo.innerHTML = `<div class="notice"><p>Ya cargaste ${s.ejemplo ? "el fichero de ejemplo" : "un fichero"} en esta sesión (${fechaCorta(s.desde)} – ${fechaCorta(s.hasta)}).</p><p><button type="button" class="btn btn--small" data-usar>Usar ese fichero</button></p></div>`;
    previo.querySelector("[data-usar]")!.addEventListener("click", () => aceptar(s, false));
  }
}

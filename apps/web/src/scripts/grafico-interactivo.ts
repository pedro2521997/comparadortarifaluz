// Interacción de los gráficos de barras (lib/grafico.ts → graficoBarras). Va por delegación de eventos
// porque los gráficos se repintan en el navegador cuando llega el precio del día.
import { textoLectura, type Nivel } from "../lib/grafico";

function seleccionar(gb: HTMLElement, h: number) {
  const barra = gb.querySelector<SVGRectElement>(`.gb__b[data-h="${h}"]`);
  if (!barra) return;
  gb.dataset.sel = String(h);
  gb.dataset.activo = "1";
  gb.querySelectorAll(".gb__b--sel").forEach((b) => b.classList.remove("gb__b--sel"));
  barra.classList.add("gb__b--sel");
  const guia = gb.querySelector<SVGLineElement>(".gb__guia");
  if (guia) {
    const x = String(Number(barra.getAttribute("x")) + Number(barra.getAttribute("width")) / 2);
    guia.setAttribute("x1", x);
    guia.setAttribute("x2", x);
    guia.classList.add("gb__guia--on");
  }
  const nivel = (["barata", "normal", "cara"] as Nivel[]).find((n) => barra.classList.contains(`gb__b--${n}`)) ?? "normal";
  const uso = gb.dataset.uso ? { texto: gb.dataset.uso, kwh: Number(gb.dataset.kwh), factor: Number(gb.dataset.factor) } : null;
  const txt = gb.querySelector(".gb__txt");
  if (txt) txt.textContent = textoLectura(h, Number(barra.dataset.p), nivel, uso);
  const tit = gb.querySelector(".gb__tit");
  if (tit) tit.textContent = barra.classList.contains("gb__b--ahora") ? "Ahora" : "Hora elegida";
}

const desde = (e: Event) => {
  const hit = (e.target as Element | null)?.closest?.(".gb__hit, .gb__b") as SVGElement | null;
  const gb = hit?.closest<HTMLElement>(".gb");
  if (hit && gb) seleccionar(gb, Number(hit.dataset.h));
};
document.addEventListener("pointermove", desde);
document.addEventListener("pointerdown", desde);
document.addEventListener("keydown", (e) => {
  const gb = (e.target as Element | null)?.closest?.(".gb") as HTMLElement | null;
  if (!gb || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
  e.preventDefault();
  const n = gb.querySelectorAll(".gb__hit").length;
  let h = Number(gb.dataset.sel ?? 0);
  // Salta la hora que no existe el día del cambio de hora.
  for (let i = 0; i < n; i++) {
    h = (h + (e.key === "ArrowRight" ? 1 : -1) + n) % n;
    if (gb.querySelector(`.gb__b[data-h="${h}"]`)) break;
  }
  seleccionar(gb, h);
});

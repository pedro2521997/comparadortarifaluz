// Tarjetas que se dan la vuelta (components/Tarjeta.astro). Al activarse, la cara oculta queda «inert»
// para que el tabulador no entre en enlaces que no se ven.
function preparar(t: HTMLElement) {
  if (t.classList.contains("flip--activa")) return;
  t.classList.add("flip--activa");
  t.querySelector<HTMLElement>(".flip__dorso")?.setAttribute("inert", "");
}

function girar(t: HTMLElement) {
  const girada = t.classList.toggle("flip--girada");
  const frente = t.querySelector<HTMLElement>(".flip__frente")!;
  const dorso = t.querySelector<HTMLElement>(".flip__dorso")!;
  frente.toggleAttribute("inert", girada);
  dorso.toggleAttribute("inert", !girada);
  t.querySelector(".flip__girar")?.setAttribute("aria-expanded", String(girada));
  // El foco pasa a la cara visible para que el teclado siga donde está la vista.
  (girada ? dorso.querySelector<HTMLElement>("a, .flip__volver") : frente.querySelector<HTMLElement>(".flip__girar"))?.focus({ preventScroll: true });
}

document.querySelectorAll<HTMLElement>("[data-flip]").forEach(preparar);
document.addEventListener("click", (e) => {
  const b = (e.target as Element | null)?.closest?.("[data-girar]");
  const t = b?.closest<HTMLElement>("[data-flip]");
  if (t) girar(t);
});

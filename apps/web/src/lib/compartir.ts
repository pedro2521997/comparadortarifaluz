// Compartir un resultado: menú nativo del móvil si existe; si no, enlaces de WhatsApp y Telegram
// y el texto copiado al portapapeles. No envía nada a ningún servidor propio.

export async function compartir(texto: string, url: string, estado: HTMLElement) {
  if (navigator.share) {
    try {
      await navigator.share({ text: texto, url });
      return;
    } catch {
      /* cancelado: se ofrecen los enlaces */
    }
  }
  const t = encodeURIComponent(`${texto} ${url}`);
  estado.innerHTML = `Compartir en <a href="https://wa.me/?text=${t}" target="_blank" rel="noopener">WhatsApp</a> · <a href="https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(texto)}" target="_blank" rel="noopener">Telegram</a>`;
  try {
    await navigator.clipboard.writeText(`${texto} ${url}`);
    estado.innerHTML += " · Texto copiado.";
  } catch {
    /* sin portapapeles */
  }
}

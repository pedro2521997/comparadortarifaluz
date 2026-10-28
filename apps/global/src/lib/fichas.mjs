// URL de la ficha de cada gasolinera de España: /es/gasolinera/<rótulo>-<municipio>-<id>/ (el id es el del
// Ministerio, que no cambia). La usan las páginas (Astro) y scripts/estaciones-global.mjs, que la guarda en el
// fichero del mapa para enlazarla desde allí: tiene que salir igual en los dos sitios. En JavaScript plano.

const slug = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Rótulos que no son un nombre: «Nº 10.935», «(SIN RÓTULO)» o nada. */
export const rotuloVacio = (s) => {
  const t = String(s ?? "").trim();
  return !t || /^n[º°o.]?\s*[\d.]+$/i.test(t) || /^\(?sin r[óo]tulo\)?$/i.test(t);
};

/**
 * «REPSOL», «Solana (La)», «5122» → «repsol-la-solana-5122». El municipio puede venir con el artículo detrás
 * (como lo da el Ministerio) o ya delante: sale lo mismo.
 * @param {string} rotulo @param {string} mun @param {string} id
 */
export function slugFicha(rotulo, mun, id) {
  const m = /^(.*?)\s*\(([^)]+)\)$/.exec(String(mun ?? "").trim());
  const pueblo = m ? `${m[2]} ${m[1]}` : String(mun ?? "");
  const nombre = rotuloVacio(rotulo) ? "gasolinera" : rotulo;
  const base = slug(`${nombre} ${pueblo}`).split("-").filter(Boolean).slice(0, 8).join("-");
  return `${base}-${id}`;
}

/** @param {string} s */
export const urlFicha = (s) => `/es/gasolinera/${s}/`;

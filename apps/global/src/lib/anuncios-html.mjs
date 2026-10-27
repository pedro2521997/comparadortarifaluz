// HTML de un hueco de anuncio. Lo usan el componente Anuncio.astro y la página de cada guía, que
// los reparte entre sus apartados (conAnuncios en lib/guias.ts). En JavaScript plano, sin tipos de Astro.
//
// Reglas (políticas de AdSense y principios de la web):
//  - Siempre con la etiqueta «Publicidad».
//  - Nunca dentro del resultado de una calculadora ni pegado a sus botones.
//  - Espacio reservado (min-height) para que la página no salte al cargar el anuncio.

import config from "../anuncios.json" with { type: "json" };

/** @typedef {"horizontal" | "articulo" | "lateral" | "multiplex"} TipoAnuncio */

/** ¿Se muestran huecos de muestra? En desarrollo, o al construir con PREVIEW_ANUNCIOS=1. */
export function verHuecos(dev = false) {
  return !config.activo && (dev || process.env.PREVIEW_ANUNCIOS === "1");
}

export const anunciosActivos = () => config.activo;
/** ¿Se carga el script de AdSense (y con él su gestor de consentimiento)? Siempre que haya bloques activos, o en revisión con «codigo». */
export const codigoAdsense = () => config.activo || config.codigo === true;
export const clienteAdsense = () => config.cliente;
/** ID de editor real (no el de ejemplo): basta para la etiqueta meta y ads.txt, que no cargan nada de Google. */
export const cuentaAdsense = () => (/^ca-pub-(?!0+$)\d{10,}$/.test(config.cliente) ? config.cliente : null);

/**
 * @param {TipoAnuncio} tipo
 * @param {{ dev?: boolean }} [o]
 */
export function anuncioHtml(tipo, o = {}) {
  if (config.activo) {
    const slot = config.bloques[tipo];
    const formato =
      tipo === "articulo"
        ? 'data-ad-layout="in-article" data-ad-format="fluid"'
        : tipo === "multiplex"
          ? 'data-ad-format="autorelaxed"'
          : 'data-ad-format="auto" data-full-width-responsive="true"';
    return `<div class="anuncio anuncio--${tipo}"><span class="anuncio__l">Publicidad</span><ins class="adsbygoogle" style="display:block${tipo === "articulo" ? ";text-align:center" : ""}" data-ad-client="${config.cliente}" data-ad-slot="${slot}" ${formato}></ins></div>`;
  }
  if (verHuecos(o.dev)) {
    const nombres = { horizontal: "horizontal", articulo: "dentro del artículo", lateral: "lateral", multiplex: "contenido recomendado" };
    return `<div class="anuncio anuncio--${tipo} anuncio--muestra"><span class="anuncio__l">Publicidad</span><span class="anuncio__m">Espacio publicitario · ${nombres[tipo]}</span></div>`;
  }
  return "";
}

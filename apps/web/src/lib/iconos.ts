// Imagen (emoji) de cada aparato y de cada tema de las guías, para las tarjetas, y las ilustraciones
// de cada tema y grupo de aparatos.

import ilustracionesJson from "../../../../data/ilustraciones.json";

export const ICONO_APARATO: Record<string, string> = {
  "aire-acondicionado": "❄️", "bomba-de-calor": "🌡️", "radiador-de-aceite": "♨️", calefactor: "🔥", "estufa-infrarrojos": "☀️",
  "termo-electrico": "🚿", lavadora: "🧺", secadora: "🌀", lavavajillas: "🍽️", horno: "🍕", "placa-induccion": "🧲",
  vitroceramica: "🥘", microondas: "🍿", "freidora-de-aire": "🍟", nevera: "🧊", congelador: "🥶", televisor: "📺",
  consola: "🎮", ordenador: "⌨️", router: "📶", deshumidificador: "💧", "cargador-coche-electrico": "🚗",
  "patinete-electrico": "🛴", plancha: "👔", "aire-acondicionado-portatil": "🌬️", hervidor: "🫖", ventilador: "💨",
  "cargador-movil": "📱", portatil: "💻", "ordenador-gaming": "🕹️", monitor: "🖥️", "bombilla-led": "💡",
  "bombilla-halogena": "🔆", cafetera: "☕", tostadora: "🍞", "secador-pelo": "💇", "plancha-pelo": "💁",
  aspiradora: "🧹", "robot-aspirador": "🤖", "campana-extractora": "🍳", "depuradora-piscina": "🏊",
  "manta-electrica": "🛏️", "toallero-electrico": "🛁", "purificador-aire": "🍃", "robot-cocina": "🥣",
  "olla-lenta": "🍲", "altavoz-inteligente": "🔊", "bicicleta-electrica": "🚲", acuario: "🐠", "frigorifico-americano": "🧃",
};

export const ICONO_CATEGORIA: Record<string, string> = {
  "Tu factura": "🧾",
  "Tarifas y compañías": "🏷️",
  "Tu consumo y el fichero": "📈",
  "Ahorrar luz": "💡",
  "Precio y mercado": "⚡",
  "Placas solares y baterías": "☀️",
  "Coche eléctrico": "🚗",
  "Hogar y aparatos": "🏠",
  "Contratos y trámites": "✍️",
  "Gas y otros": "🔥",
};

// ---------- Ilustraciones (scripts/ilustraciones.py) ----------

const ALT = ilustracionesJson as Record<string, string>;
const aSlug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Ilustración de un tema de guías o de un grupo de aparatos (null si no hay). */
export function ilustracion(tema: string | undefined | null): { src: string; alt: string } | null {
  if (!tema) return null;
  const s = aSlug(tema);
  return ALT[s] ? { src: `/ilustraciones/${s}.svg`, alt: ALT[s] } : null;
}

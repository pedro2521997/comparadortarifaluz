// Configuración del sitio. Lo marcado PENDIENTE depende de decisiones del propietario (§14 del plan).

export const SITIO = {
  nombre: "ComparadorTarifaLuz",
  dominio: "comparadortarifaluz.es",
  url: "https://comparadortarifaluz.es",
  descripcion: "Compara gratis las tarifas de luz de todas las compañías con tu consumo real y descubre cuánto ahorrarías. Precio de la luz hoy por horas, ranking de tarifas y calculadora de factura. Sin registro.",
  /** Lema de la marca (la promesa de la web) */
  lema: "Tu tarifa de luz, sin trampa",
  correo: "hola@comparadortarifaluz.es", // PENDIENTE: crear el buzón
  titular: "[TITULAR DEL SITIO]", // PENDIENTE: nombre y NIF para el aviso legal
};

/** PENDIENTE: crear el canal. Mientras sea null, no se enlaza. */
export const TELEGRAM_URL: string | null = null;

/** Instalador colaborador de placas (§5). PENDIENTE: nombre, zona y tabla de precios del amigo. */
export const INSTALADOR = {
  nombre: "[EMPRESA]",
  /** Prefijos de código postal que cubre (2 dígitos = provincia, o CP completos). */
  zona: ["28", "45", "19"],
  /** €/kWp instalado (IVA incluido) por tramos. PROVISIONAL hasta recibir la tabla real. */
  precios: [
    { hastaKwp: 3, eurPorKwp: 1600 },
    { hastaKwp: 5, eurPorKwp: 1400 },
    { hastaKwp: 8, eurPorKwp: 1250 },
    { hastaKwp: Infinity, eurPorKwp: 1150 },
  ],
  preciosProvisionales: true,
};

/** PENDIENTE: alta en Amazon Afiliados. Sin etiqueta, no se muestran enlaces de afiliado. */
export const AMAZON_TAG: string | null = null;

export const NAV = [
  { href: "/precio-luz-hoy/", texto: "Precio de hoy" },
  { href: "/comparador/", texto: "Comparador" },
  { href: "/tarifas/", texto: "Ranking" },
  { href: "/calcular-factura-luz/", texto: "Calcular factura" },
  { href: "/herramientas/", texto: "Herramientas" },
  { href: "/guias/", texto: "Guías" },
];

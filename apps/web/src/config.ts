// Configuración del sitio. Lo marcado PENDIENTE depende de decisiones del propietario (§14 del plan).

export const SITIO = {
  nombre: "ComparadorTarifaLuz",
  dominio: "comparadortarifaluz.es",
  url: "https://comparadortarifaluz.es",
  descripcion: "Compara gratis las tarifas de luz de todas las compañías con tu consumo real. Precio de la luz hoy por horas, ranking de tarifas y simulador de factura.",
  /** Lema de la marca (la promesa de la web) */
  lema: "Tu tarifa de luz, sin trampa",
  /** Correo de contacto y de protección de datos. Cuando exista hola@comparadortarifaluz.es se puede cambiar aquí. */
  correo: "pedro.delareina@gmail.com",
  /** Titular del sitio (aviso legal y responsable del tratamiento: persona física) */
  titular: "Pedro López de la Reina García Cervigón",
  nif: "71359449V",
  /** Domicilio completo (art. 10 LSSI), el mismo que en elpisobarato.es. */
  domicilio: "C/ Cirugeda, 67, 13240 La Solana (Ciudad Real)",
  /** ID de medición de Google Analytics 4 (no es secreto: va en el HTML). Vacío = sin Analytics. */
  analytics: "G-EWDP7TDPQ9",
};

/**
 * Precios de la gasolina y el gasoil: están en la web hermana PowerPriceNow (en español, con mapa de gasolineras).
 * Aquí solo se enlazan; las antiguas páginas de carburantes redirigen allí (public/_redirects).
 */
export const CARBURANTES = {
  gasolina: "https://powerpricenow.com/es/precio-gasolina-hoy/",
  gasoil: "https://powerpricenow.com/es/precio-gasoil-hoy/",
  mapa: "https://powerpricenow.com/es/mapa-gasolineras/",
  baratas: "https://powerpricenow.com/es/gasolineras-baratas/",
};

/** PENDIENTE: crear el canal. Mientras sea null, no se enlaza. */
export const TELEGRAM_URL: string | null = null;

/**
 * Instalador colaborador de placas (§5). Apagado hasta tener el acuerdo: con `activo: false` no se muestra
 * el formulario de estudio, no se recoge ningún dato y los textos legales no lo mencionan. Al activarlo,
 * el panel del estudio sale arriba del resultado de la calculadora solar.
 * PENDIENTE: nombre, zona y tabla de precios del instalador.
 */
export const INSTALADOR = {
  activo: false,
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
  { href: CARBURANTES.gasolina, texto: "Gasolina" },
];

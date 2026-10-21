// Configuración del sitio. Lo marcado PENDIENTE depende de decisiones del propietario (§14 del plan).

export const SITIO = {
  nombre: "LuzSinTrampa",
  dominio: "luzsintrampa.es",
  url: "https://luzsintrampa.es",
  descripcion: "Paga menos luz con tus propios datos y el precio real de hoy. Precio por horas, comparador con tu fichero de consumos, cuánto gasta cada aparato y calculadora de placas solares.",
  correo: "hola@luzsintrampa.es", // PENDIENTE: crear el buzón
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
  { href: "/cuanto-gasta/", texto: "Cuánto gasta" },
  { href: "/placas-solares/", texto: "Placas solares" },
  { href: "/guias/", texto: "Guías" },
];

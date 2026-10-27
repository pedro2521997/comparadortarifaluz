// Todas las herramientas de la web en un solo sitio: el menú, la portada, el pie, la página de
// herramientas, el mapa del sitio y llms.txt salen de aquí. Para añadir una, basta con ponerla en su grupo.

export interface Herramienta {
  href: string;
  /** Nombre corto (menú y pie) */
  t: string;
  /** Una frase de qué hace */
  d: string;
  cta: string;
  nueva?: boolean;
}

export interface GrupoHerramientas {
  titulo: string;
  items: Herramienta[];
}

export const GRUPOS_HERRAMIENTAS: GrupoHerramientas[] = [
  {
    titulo: "Elegir tarifa",
    items: [
      { href: "/comparador/", t: "Comparador de tarifas", d: "Todas las tarifas calculadas con tu consumo, tu factura o lo que pagas al mes, ordenadas solo por precio.", cta: "Comparar mi tarifa" },
      { href: "/tarifas/", t: "Ranking de tarifas", d: "Todas las tarifas ordenadas por lo que pagaría un hogar tipo. Cambia el consumo y se recalcula.", cta: "Ver el ranking" },
      { href: "/comercializadoras/", t: "Compañías de luz", d: "Cada comercializadora con todas sus tarifas, lo que pagarías y su puesto en el ranking.", cta: "Ver las compañías", nueva: true },
      { href: "/herramientas/bono-social/", t: "¿Tengo derecho al bono social?", d: "Unas preguntas y te decimos si puedes pedirlo, qué descuento te toca y dónde solicitarlo.", cta: "Comprobarlo", nueva: true },
    ],
  },
  {
    titulo: "Entender tu factura",
    items: [
      { href: "/entender-factura-luz/", t: "Sube tu factura en PDF", d: "Te explicamos cada línea, comprobamos si cuadra y te decimos cuánto pagarías con otra tarifa.", cta: "Subir mi factura", nueva: true },
      { href: "/calcular-factura-luz/", t: "Simulador de factura", d: "Escribe los kWh de tu factura o sube tu fichero y la calculamos con tu tarifa, como tu compañía.", cta: "Simular mi factura" },
      { href: "/analizador-consumo/", t: "Analizador de consumo", d: "A qué horas gastas, tu consumo fantasma, tus picos y si te sobra potencia, en gráficas.", cta: "Analizar mi consumo" },
      { href: "/herramientas/potencia/", t: "Calculadora de potencia", d: "Marca los aparatos que usas a la vez y te decimos qué potencia contratar y cuánto ahorras.", cta: "Calcular mi potencia" },
      { href: "/herramientas/distribuidora/", t: "Distribuidora por CUPS", d: "Tu distribuidora, si el CUPS es válido y dónde descargar tu consumo.", cta: "Saber mi distribuidora" },
    ],
  },
  {
    titulo: "Precio y horario de la luz",
    items: [
      { href: "/precio-luz-hoy/", t: "Precio de la luz hoy", d: "Cada hora, las mejores horas para la lavadora o el coche y de dónde viene la luz.", cta: "Ver el precio de hoy" },
      { href: "/precio-luz-manana/", t: "Precio de la luz mañana", d: "En cuanto lo publica Red Eléctrica, hacia las 20:30.", cta: "Ver mañana" },
      { href: "/periodo-luz-ahora/", t: "¿Qué periodo es ahora?", d: "Punta, llano o valle en este momento, cuánto falta para que cambie y la semana entera.", cta: "Ver el periodo", nueva: true },
      { href: "/precio-luz/historico/", t: "Histórico del precio", d: "PVPC y mercado mayorista mes a mes desde 2021.", cta: "Ver el histórico" },
    ],
  },
  {
    titulo: "Gastar menos en casa",
    items: [
      { href: "/cuanto-gasta/", t: "Cuánto gasta cada aparato", d: "Lo que cuesta al mes cada electrodoméstico con el precio de hoy, y si compensa cambiarlo.", cta: "Calcular un aparato" },
      { href: "/herramientas/calefaccion/", t: "¿Qué calefacción sale más barata?", d: "Bomba de calor, gas, pellets, butano o radiadores: lo que cuesta cada una al año en tu casa.", cta: "Comparar calefacción", nueva: true },
      { href: "/herramientas/termo/", t: "Termo eléctrico", d: "Cuánto gasta tu termo y cuánto ahorras con un temporizador o bajando la temperatura.", cta: "Calcular mi termo", nueva: true },
      { href: "/herramientas/factura-gas/", t: "Factura del gas y TUR", d: "Lo que pagas de gas al año con la tarifa regulada o con la tuya.", cta: "Calcular mi gas", nueva: true },
    ],
  },
  {
    titulo: "Placas solares y coche eléctrico",
    items: [
      { href: "/placas-solares/", t: "Calculadora de placas solares", d: "Producción de tu tejado hora a hora cruzada con tu consumo, con batería opcional.", cta: "Calcular mis placas" },
      { href: "/herramientas/excedentes/", t: "¿Te compensan bien los excedentes?", d: "Comprueba la compensación de tu factura y cuánto pierdes por el tope.", cta: "Comprobar excedentes", nueva: true },
      { href: "/herramientas/coche-electrico/", t: "Coste de cargar el coche", d: "Lo que cuesta cargar en casa y fuera frente a gasolina o diésel, y a qué hora cargar.", cta: "Calcular mi coche" },
    ],
  },
  {
    titulo: "Gasolina y diésel",
    items: [
      { href: "/gasolineras-baratas/", t: "Gasolineras baratas", d: "Las gasolineras más baratas de cada provincia y municipio, con los precios de hoy del Ministerio.", cta: "Buscar gasolinera", nueva: true },
      { href: "/precio-gasolina-hoy/", t: "Precio de la gasolina hoy", d: "Media de España, las más baratas y la evolución de la gasolina 95 y 98.", cta: "Ver la gasolina", nueva: true },
      { href: "/precio-gasoil-hoy/", t: "Precio del gasoil hoy", d: "Lo que cuesta hoy el diésel en España, por provincias y gasolineras.", cta: "Ver el gasoil", nueva: true },
      { href: "/precio-glp-hoy/", t: "Precio del GLP (autogás)", d: "El GLP más barato y las gasolineras que lo venden.", cta: "Ver el GLP", nueva: true },
      { href: "/precio-gasoleo-calefaccion/", t: "Gasóleo de calefacción", d: "Precio semanal del gasóleo C, cuánto cuestan 1.000 litros y cuándo comprar.", cta: "Ver el gasóleo C", nueva: true },
      { href: "/carburantes-europa/", t: "Gasolina en Europa", d: "Lo que cuesta el litro en cada país de la UE frente a España, para tus viajes.", cta: "Comparar países", nueva: true },
    ],
  },
];

export const HERRAMIENTAS = GRUPOS_HERRAMIENTAS.flatMap((g) => g.items);

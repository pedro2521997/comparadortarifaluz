// Diccionario de conceptos de la factura de la luz. Sirve para explicar cualquier factura aunque no
// sepamos sacar todos sus datos: buscamos cada concepto en las líneas del PDF y lo explicamos citando
// la línea. Vocabulario del modelo de factura regulado (Resolución de 28 de abril de 2021) y de cómo lo
// rotulan las comercializadoras (Iberdrola, Endesa, Naturgy, Repsol, Som Energia…).
//
// Los patrones se comparan con la línea «compacta»: en minúsculas, sin acentos y SIN espacios, porque
// muchos PDF parten palabras («C ódigo», «sumin istro»). Por eso los patrones no llevan espacios.

export type TipoConcepto = "coste" | "regulado" | "impuesto" | "dato" | "aviso" | "ahorro";

export interface Concepto {
  id: string;
  titulo: string;
  tipo: TipoConcepto;
  explicacion: string;
  /** Patrón sobre la línea compacta */
  re: RegExp;
  /** Si la línea casa también con esto, no es este concepto */
  no?: RegExp;
}

export interface ConceptoDetectado {
  id: string;
  titulo: string;
  tipo: TipoConcepto;
  explicacion: string;
  /** Línea de la factura tal cual, para citarla */
  linea: string;
  /** Último importe en euros de la línea, si lo hay */
  importe?: number;
}

export const CONCEPTOS: Concepto[] = [
  // --- Lo que pagas por la luz ---
  { id: "potencia", titulo: "Término de potencia (término fijo)", tipo: "coste", re: /porpotenciacontratada|terminofijo|terminodepotencia|terminopotencia|facturacionporpotencia|potenciafacturada|importeporpotencia/, no: /excesos?|maxima/, explicacion: "Lo que pagas por tener contratados unos kW, consumas o no: kW × precio por kW y día × días. Bajar la potencia lo reduce." },
  { id: "energia", titulo: "Término de energía (término variable)", tipo: "coste", re: /porenergiaconsumida|terminodeenergia|terminovariable|terminodeconsumo|facturacionporenergia|electricidadutilizada|energiaconsumida|energiaactiva/, no: /reactiva|excedent|impuesto/, explicacion: "Lo que pagas por los kWh que has gastado, cada periodo a su precio. Es la parte que más depende de ti." },
  { id: "costeEnergia", titulo: "Coste de la energía", tipo: "coste", re: /costedelaenergia|costedeproduccion|costedeenergia/, explicacion: "La parte del precio del kWh que es la electricidad en sí (compra en el mercado y margen de la comercializadora), sin peajes ni cargos." },
  { id: "margen", titulo: "Margen de comercialización", tipo: "coste", re: /margendecomercializacion|cuotadecomercializacion|margencomercial/, explicacion: "Lo que gana tu comercializadora. En la PVPC es un importe fijo regulado; en el mercado libre lo fija cada compañía." },
  { id: "peajes", titulo: "Peajes de transporte y distribución", tipo: "regulado", re: /peajesdetransporte|peajesdeacceso|peajesydistribucion|peajes(y|,)?cargos|importeporpeajes/, explicacion: "Lo que cuesta usar las redes eléctricas. Lo fija la CNMC y es igual en todas las compañías; va incluido en tus precios de potencia y energía." },
  { id: "cargos", titulo: "Cargos del sistema", tipo: "regulado", re: /cargos(electricos|delsistema)|recore|anualidadesdeldeficit|segmentotarifario/, no: /peajes/, explicacion: "Costes del sistema eléctrico que fija el Gobierno (primas a renovables, déficit de años pasados, electricidad en las islas). Iguales en todas las compañías." },
  { id: "ajusteGas", titulo: "Mecanismo de ajuste del gas («tope del gas»)", tipo: "aviso", re: /mecanismodeajuste|topedelgas|ajustedelgas|compensaciondelgas|costedeajuste(del)?gas/, explicacion: "Recargo por el tope al precio del gas de 2022–2023. Terminó el 31 de diciembre de 2023: si aparece en una factura de 2024 o después, pregunta a tu compañía." },
  { id: "serviciosAjuste", titulo: "Servicios de ajuste", tipo: "regulado", re: /serviciosdeajuste/, explicacion: "Coste de los servicios que usa Red Eléctrica para equilibrar la red en tiempo real. Algunas compañías lo facturan aparte y otras lo incluyen en el precio." },
  { id: "excesos", titulo: "Excesos de potencia", tipo: "aviso", re: /excesos?depotencia|penalizacionporpotencia/, explicacion: "Recargo por haber pedido más potencia de la contratada (solo en contratos con maxímetro). Si se repite, te conviene subir la potencia." },
  { id: "reactiva", titulo: "Energía reactiva", tipo: "aviso", re: /reactiva/, explicacion: "Recargo por energía reactiva, raro en hogares. Si te lo cobran en una vivienda, pregunta a tu compañía." },

  // --- Regulados e impuestos ---
  { id: "bonoSocial", titulo: "Financiación del bono social", tipo: "regulado", re: /financiacion(del)?bonosocial|bonosocialfijo|aportacion(al)?bonosocial|^bonosocial[0-9,.\-€]*$/, no: /descuento/, explicacion: "Aportación obligatoria para pagar el bono social de los hogares vulnerables. Unos céntimos al día, igual en todas las compañías." },
  { id: "descuentoBono", titulo: "Descuento del bono social", tipo: "ahorro", re: /descuento(por|del)?bonosocial|bonificacionbonosocial/, explicacion: "Tu descuento por tener reconocido el bono social. Solo se aplica con la PVPC y hasta un límite de kWh al año." },
  { id: "iee", titulo: "Impuesto sobre la electricidad", tipo: "impuesto", re: /impuesto(especial)?(sobre|a|de)?(la)?electricidad|impuestoelectrico|impuestodeelectricidad/, explicacion: "Impuesto del Estado: un 5,11 % de lo que pagas por potencia y energía (con un mínimo por kWh)." },
  { id: "alquiler", titulo: "Alquiler del contador", tipo: "regulado", re: /alquiler(de|del)?(los)?(equipos?|contador)|equiposdemedida/, explicacion: "Alquiler del contador a la distribuidora. Precio regulado, unos 0,80 € al mes en un contador normal de casa." },
  { id: "iva", titulo: "IVA", tipo: "impuesto", re: /(^|[^a-z])iva([^a-z]|$)|ivanormal|ivareducido/, no: /baseimponible(?!.*iva)/, explicacion: "IVA sobre todo lo anterior, incluido el impuesto eléctrico. Normalmente el 21 %." },
  { id: "igic", titulo: "IGIC (Canarias)", tipo: "impuesto", re: /igic/, explicacion: "En Canarias se paga IGIC en lugar de IVA." },
  { id: "ipsi", titulo: "IPSI (Ceuta y Melilla)", tipo: "impuesto", re: /ipsi/, explicacion: "En Ceuta y Melilla se paga IPSI en lugar de IVA." },
  { id: "suplemento", titulo: "Suplemento territorial", tipo: "aviso", re: /suplementoterritorial/, explicacion: "Recargo por tributos autonómicos de 2013 que se repercutió en algunas comunidades. Si aparece ahora, pregunta a tu compañía a qué periodo corresponde." },
  { id: "derechos", titulo: "Derechos de acometida, enganche o acceso", tipo: "aviso", re: /derechos(de)?(acometida|enganche|acceso|extension|verificacion)/, explicacion: "Pagos regulados por cambios en el suministro (alta, subida de potencia, enganche). Solo deberían aparecer cuando has pedido uno de esos cambios." },

  // --- Extras de la compañía ---
  { id: "servicios", titulo: "Servicios añadidos", tipo: "aviso", re: /mantenimiento|asistencia|serviciosadicionales|otrosproductosyservicios|serviciotecnico|segurode|proteccion(de)?pagos|packhogar|urgencias24|asistente24/, no: /atencion(al)?cliente|averias|telefono/, explicacion: "Servicios que no son la luz (mantenimiento, asistencia, seguros). No son obligatorios: comprueba si los usas y si tienen permanencia." },
  { id: "descuentos", titulo: "Descuentos y promociones", tipo: "ahorro", re: /descuento|promocion|bonificacion|horaspromocionadas|regalo/, no: /bonosocial/, explicacion: "Descuentos de tu compañía. Mira cuándo terminan: al acabar, la factura sube." },
  { id: "donativo", titulo: "Donativo voluntario", tipo: "dato", re: /donativo/, explicacion: "Aportación voluntaria que has elegido hacer. No lleva IVA y puedes quitarla cuando quieras." },
  { id: "recargos", titulo: "Recargos, intereses o reconexión", tipo: "aviso", re: /interesesdedemora|recargo(por)?(impago|demora)|reconexion|gastosdedevolucion|devolucionderecibo/, explicacion: "Costes por un pago devuelto o atrasado, o por reconectar el suministro. Revisa que corresponden a algo que ha pasado." },

  // --- Lecturas y consumo ---
  { id: "regularizacion", titulo: "Regularización", tipo: "aviso", re: /regulariz|refacturacion|anulaciondefactura|abono(de)?factura/, explicacion: "Ajuste de facturas anteriores, normalmente porque se facturó con lecturas estimadas y ahora hay una real. Puede subir o bajar mucho la factura de este mes." },
  { id: "estimada", titulo: "Lectura estimada", tipo: "aviso", re: /estimad/, explicacion: "Esta factura no usa la lectura real del contador, sino una estimación. Si no se parece a lo que gastas, pide la lectura real o mira tu consumo en la web de tu distribuidora." },
  { id: "lecturaReal", titulo: "Lectura real", tipo: "dato", re: /lecturareal|consumoreal|\(real\)/, explicacion: "El consumo sale de la lectura real del contador, que la distribuidora toma a distancia." },
  { id: "autolectura", titulo: "Autolectura", tipo: "dato", re: /autolectura|lecturafacilitada/, explicacion: "Lectura que diste tú. Si el contador es inteligente, normalmente no hace falta." },
  { id: "potenciaMaxima", titulo: "Potencia máxima demandada", tipo: "dato", re: /potencias?maximas?(demandadas?|registradas?)|maximetro|maximodepotencia/, explicacion: "La potencia más alta que has usado de verdad en el último año. Si está muy por debajo de la contratada, te sobra potencia." },
  { id: "consumoMedio", titulo: "Consumo medio", tipo: "dato", re: /consumomedio|mediadelgastodiario|consumoacumulado|ultimos(12|doce|14|catorce)meses/, explicacion: "Tu consumo medio o del último año. Úsalo para comparar tarifas: es lo que de verdad te dice qué te conviene." },

  // --- Autoconsumo ---
  { id: "excedentes", titulo: "Compensación de excedentes", tipo: "ahorro", re: /compensacion(de|por)?excedentes|energiaexcedentaria|excedentes?(compensad|vertid)|energiavertida/, explicacion: "Lo que te descuentan por la energía de tus placas que vertiste a la red. Nunca puede superar lo que pagas por la energía del mes." },
  { id: "ajusteCompensacion", titulo: "Ajuste límite de compensación", tipo: "dato", re: /ajustelimite(de)?compensacion|limitedecompensacion/, explicacion: "Si tus excedentes valían más que la energía consumida, el resto no se paga: se anula con este ajuste. Una batería virtual lo aprovecharía." },
  { id: "bateriaVirtual", titulo: "Batería virtual o monedero solar", tipo: "ahorro", re: /bateriavirtual|solarcloud|monederosolar|huchasolar|saldosolar/, explicacion: "Saldo en euros que guarda la compañía con los excedentes que no caben en la compensación, para descontarlo en otras facturas." },

  // --- Datos del contrato ---
  { id: "pvpc", titulo: "PVPC (tarifa regulada)", tipo: "dato", re: /pvpc|preciovoluntario|comercializadoradereferencia/, explicacion: "Tienes la tarifa regulada: el precio cambia cada hora según el mercado. Es la única con la que se puede tener bono social." },
  { id: "indexada", titulo: "Tarifa indexada", tipo: "dato", re: /indexad|preciodemercado|omie/, no: /pvpc/, explicacion: "El precio de tu energía sigue al mercado mayorista, como la PVPC pero con las condiciones de tu compañía." },
  { id: "peaje20td", titulo: "Peaje 2.0TD", tipo: "dato", re: /2[.,]?0td/, explicacion: "El peaje de los hogares y pequeños negocios con hasta 15 kW: tres periodos de energía (punta, llano y valle) y dos de potencia." },
  { id: "finContrato", titulo: "Fecha de fin de contrato", tipo: "dato", re: /fecha(de)?fin(al)?(de)?(l)?contrato|finalizaciondelcontrato|vencimientodelcontrato|renovacion/, explicacion: "Cuándo se renueva tu contrato. Ojo: muchas compañías cambian los precios en la renovación." },
  { id: "permanencia", titulo: "Permanencia o penalización", tipo: "aviso", re: /permanencia|penalizacion(por)?(baja|cancelacion)|cancelacionanticipada/, explicacion: "Si te vas antes de esta fecha, la compañía puede cobrarte una penalización. Compruébala antes de cambiar." },
  { id: "distribuidora", titulo: "Distribuidora", tipo: "dato", re: /distribuidora|contratodeacceso|i-?de(redes)?|e-?distribucion|ufd|e-?redes|viesgo/, no: /comercializadora/, explicacion: "La empresa de los cables de tu zona. Es a quien llamas por averías y quien tiene tu consumo hora a hora." },
  { id: "destino", titulo: "Destino del importe de la factura", tipo: "dato", re: /destino(del)?importe|destinodelafactura/, explicacion: "Gráfico obligatorio con el reparto de lo que pagas entre energía, peajes, cargos, contador e impuestos." },
  { id: "comparadorCnmc", titulo: "Comparador de la CNMC", tipo: "dato", re: /comparador(de)?(ofertas|lacnmc)|cnmc/, explicacion: "Todas las facturas deben enlazar al comparador oficial. Nosotros calculamos lo mismo con tu consumo real." },
];

const compactar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "");

const NUM_EUR = /(-?\d{1,3}(?:\.\d{3})+(?:,\d+)?|-?\d+(?:[.,]\d+)?)\s*(?:€|eur(?:os)?\b)(?!\s*\/)/gi;

function ultimoImporte(linea: string): number | undefined {
  const xs = [...linea.matchAll(NUM_EUR)].map((m) => {
    let t = m[1];
    t = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t;
    return parseFloat(t);
  });
  return xs.length ? xs[xs.length - 1] : undefined;
}

/** Conceptos que aparecen en la factura, en el orden en que aparecen, cada uno una vez. */
export function conceptosEn(lineas: string[]): ConceptoDetectado[] {
  const vistos = new Map<string, ConceptoDetectado>();
  for (const linea of lineas) {
    const c = compactar(linea);
    if (c.length < 3 || c.length > 400) continue;
    for (const k of CONCEPTOS) {
      if (vistos.has(k.id) || !k.re.test(c) || (k.no && k.no.test(c))) continue;
      vistos.set(k.id, { id: k.id, titulo: k.titulo, tipo: k.tipo, explicacion: k.explicacion, linea: linea.trim().slice(0, 160), importe: ultimoImporte(linea) });
    }
  }
  return [...vistos.values()];
}

export { compactar };

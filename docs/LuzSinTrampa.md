# LuzSinTrampa: proyecto completo

> Documento base para empezar el proyecto en una sesión nueva. Define qué se construye, por qué, cómo gana dinero, con qué datos y en qué orden.
> El sistema de diseño (`DESIGN.md`) lo aporta el propietario; aquí solo se fijan los principios de producto.
>
> Redactado el 21/10/2026. Los datos marcados **[verificar]** cambian a menudo (impuestos, peajes, programas de afiliación) y deben comprobarse en la fuente oficial antes de usarse en el código.

---

## 0. Resumen en una página

**Qué es:** una web que ayuda a pagar menos luz con datos reales del usuario y de Red Eléctrica. Tiene cinco piezas:

1. **Precio de la luz por horas** (PVPC de hoy y de mañana), con aviso diario de las horas baratas. *Gancho de visitas recurrentes.*
2. **Comparador de tarifas con tu fichero de consumos**: subes el CSV de tu distribuidora y calcula cuánto habrías pagado con cada tarifa. *La herramienta estrella.*
3. **Cuánto gasta cada aparato**: calculadora y una página por aparato con el precio de hoy. *Tráfico de búsquedas y referidos de productos.*
4. **Calculadora de placas solares**: ahorro estimado con tu consumo real y la radiación de tu zona, que termina en "pide un estudio gratuito" para la empresa de un amigo. *La principal fuente de ingresos.*
5. **Guías** sobre todo lo que rodea a la factura: potencia, periodos, bono social, cambiar de compañía, autoconsumo…

**Cómo gana dinero (en orden de importancia esperada):**

1. Contactos de placas solares para la empresa del amigo, con un acuerdo de comisión.
2. Referidos de comercializadoras, cuando haya programas que lo permitan.
3. Afiliación de productos (Amazon y otras tiendas): enchufes medidores, aparatos eficientes.
4. Publicidad, solo cuando haya tráfico.

**Coste:** 0 € de infraestructura (Cloudflare, plan gratuito) más el dominio, unos 10 € al año.

**Principio que no se negocia:** el comparador ordena **solo por precio**. Si una tarifa nos paga comisión, se dice, pero no sube en la lista. La marca vive de que la gente se fíe.

---

## 1. El problema y la propuesta

**El problema:**

- La factura de la luz es incomprensible: peajes, cargos, periodos, potencia, impuestos que cambian (en 2026 el IVA bajó al 10 % de marzo a mayo y volvió al 21 % en junio).
- La gente no sabe si su tarifa es buena, a qué hora le conviene poner la lavadora, cuánto le cuesta el aire acondicionado ni si le compensan las placas.

**La propuesta:**

- Respuestas con **sus propios datos** (su fichero de consumos, su código postal, su aparato) y el **precio real de hoy**, no con medias genéricas.
- Lo que el resumen de IA de Google no puede dar es un cálculo personal con datos de hoy. Ahí está el hueco.

**Por qué crece sola:**

| Recurrencia | Ejemplos |
|---|---|
| Diaria | "precio luz hoy", "precio luz mañana" |
| Estacional | Aire acondicionado en verano, calefacción en invierno |
| Por acontecimientos | Cambios de IVA, subidas, bono social |

**Competencia que hay que estudiar en la Fase 0:**

- El [comparador oficial de la CNMC](https://comparador.cnmc.gob.es/), gratuito y neutral, pero poco amigable.
- Las webs de precio de la luz por horas, muy competidas.
- Los comparadores de las propias comercializadoras.
- **Pendiente del propietario:** añadir aquí la URL de la web de comparación con fichero de consumos que sirvió de inspiración, para analizar qué hace bien y qué no.

---

## 2. Público

| Perfil | Qué busca | Módulo que lo resuelve |
|---|---|---|
| Hogar que quiere pagar menos | "¿Mi tarifa es buena?", "¿cambio de compañía?" | Comparador, guías |
| Usuario de tarifa regulada (PVPC) | "¿A qué hora pongo la lavadora?" | Precio por horas, aviso diario |
| Quien duda antes de usar un aparato | "¿Cuánto gasta el aire acondicionado?" | Cuánto gasta |
| Propietario de vivienda unifamiliar o adosado | "¿Me compensan las placas?" | Calculadora solar → contacto |
| Quien tiene o quiere un coche eléctrico | "¿Cuánto cuesta cargarlo en casa?" | Cuánto gasta, comparador |

**Validación obligatoria (Fase 0):** sacar las búsquedas reales del autocompletado de Google España, como en el proyecto anterior (`docs/datos/`). Semillas:

- "precio luz", "cuánto gasta", "tarifa luz", "placas solares", "factura luz", "potencia contratada", "bono social", "datadis"

Guardar el resultado en `docs/datos/` con fecha.

---

## 3. Producto: los cinco módulos

### M1. Precio de la luz por horas (PVPC)

**Datos:**

- API de ESIOS (Red Eléctrica). Indicador **1001**: PVPC 2.0TD por horas. Indicador **1739**: precio de los excedentes de autoconsumo.
- Requiere un token gratuito, que se pide por correo a `consultasios@ree.es`. Ver [docs de REE/ESIOS](https://www.ree.es/es/apidatos) y la [referencia de evcc](https://docs.evcc.io/en/tariffs/ree).
- Red Eléctrica publica el precio del día siguiente por la tarde **[verificar la hora exacta]**.

**Funcionamiento:**

- Un Worker de Cloudflare con disparador programado (cron) consulta ESIOS varias veces por la tarde hasta obtener el día siguiente.
- Guarda el resultado en D1 y genera un JSON estático para cada día.

**Páginas:**

- `/precio-luz-hoy/` y `/precio-luz-manana/`.
- `/precio-luz/AAAA-MM-DD/`: archivo histórico, una página por día con datos reales. Nada de páginas vacías.
- Bloque "**Las mejores horas para…**" (lavadora, lavavajillas, horno, cargar el coche), calculado por franjas de 1, 2 y 3 horas seguidas.
- Gráfico de 24 horas accesible: el color nunca es la única señal, cada hora lleva su precio en texto.

**Aviso diario:**

- **Canal de Telegram** (gratuito y muy usado en España) con un bot que publica cada tarde: "Mañana, la hora más barata es de 14:00 a 16:00 (0,08 €/kWh). Evita de 20:00 a 22:00."
- Más adelante, notificaciones web (Web Push).
- Por correo, solo si hay un proveedor gratuito suficiente **[verificar los límites]**.

**Hecho cuando:**

- El precio de mañana aparece solo cada día sin intervención.
- El archivo histórico se genera solo.
- El bot publica a diario.
- Si ESIOS falla, la página dice "aún no publicado" y no muestra datos viejos como si fueran nuevos.

### M2. Comparador de tarifas con tu fichero de consumos ⭐

**Flujo del usuario:**

1. **Descarga tu fichero.** Guía paso a paso para [Datadis](https://datadis.es) (la plataforma común de las distribuidoras) y para las webs de las principales distribuidoras (i-DE, e-distribución, UFD y las demás), con capturas.
2. **Súbelo.** El fichero **se procesa en el navegador y nunca sale del ordenador del usuario.** Es una promesa de privacidad y también ahorra servidor.
3. **Indica tu potencia contratada** (P1 y P2) y tu tarifa actual. Si no la sabes, se compara solo entre tarifas.
4. **Resultado:**
   - Cuánto habrías pagado en el periodo del fichero con cada tarifa, de más barata a más cara.
   - Ahorro frente a la tarifa actual.
   - Detalle desplegable: potencia, energía, impuestos y alquiler del contador.
   - Letra pequeña de cada tarifa: permanencia, servicios obligatorios.
   - Botón "Contratar" (enlace de referido si existe, con aviso).
5. **Extras con los mismos datos:**
   - Tu reparto por periodos (punta, llano, valle).
   - Si te sobra potencia contratada (picos de consumo frente a potencia).
   - Cuánto ahorrarías moviendo un 10 % del consumo de punta a valle.
   - Enlace a la calculadora solar **con tu consumo ya cargado**.

**Formatos del fichero:**

- No hay documentación pública fiable del formato del CSV de Datadis ni del de cada distribuidora. **Tarea de la Fase 0:** reunir ficheros reales (el tuyo, el de amigos y familia, anonimizados) de Datadis y de las distribuidoras grandes.
- Con ellos se escribe un lector con detección automática de columnas (código CUPS, fecha, hora, kWh), separador `;` o `,`, coma decimal y la hora 25 del cambio de horario de octubre.
- Si el formato no se reconoce, se pide al usuario que indique qué columna es cada cosa. Nunca falla en silencio.

**Catálogo de tarifas (`data/tarifas.json`):**

- Lo mantenemos a mano, al principio con unas 20–30 tarifas de las comercializadoras con más clientes.
- Cada tarifa lleva: comercializadora, nombre, tipo (precio fijo único, 3 periodos o indexada/PVPC), precios de potencia por periodo (€/kW·día) y de energía por periodo (€/kWh), cuota fija, permanencia, **URL de la fuente** y **fecha de comprobación**.
- Una tarifa con más de 45 días sin comprobar se marca como "por revisar" y no aparece la primera.
- Revisión: el día 1 de cada mes, y siempre que haya cambios regulatorios.

**Cálculo de una factura 2.0TD (doméstico, hasta 15 kW):**

```
días           = días del periodo del fichero
potencia       = (P1_kW × precio_P1 + P2_kW × precio_P2) × días
energía        = Σ kWh_periodo × precio_periodo        (tarifa fija o por periodos)
               = Σ kWh_hora × PVPC_hora               (PVPC: precio hora a hora de ESIOS)
bono_social    = financiación del bono social €/día × días   [verificar el valor vigente]
IEE            = 5,11269632 % × (potencia + energía + bono_social), con mínimo por MWh   [verificar]
alquiler       = alquiler del contador €/día × días      (≈ 0,81 €/mes en monofásico)   [verificar]
base_IVA       = potencia + energía + bono_social + IEE + alquiler
IVA            = 21 % × base_IVA                           [verificar: cambió en 2026]
total          = base_IVA + IVA
```

**Periodos de la tarifa 2.0TD (península, Baleares y Canarias):**

| | Lunes a viernes | Fines de semana y festivos nacionales |
|---|---|---|
| Energía P1, punta | 10–14 h y 18–22 h | — |
| Energía P2, llano | 8–10 h, 14–18 h y 22–24 h | — |
| Energía P3, valle | 0–8 h | Todo el día |
| Potencia P1 | 8–24 h | — |
| Potencia P2 | 0–8 h | Todo el día |

- Ceuta y Melilla tienen otro horario **[verificar]**.
- Los festivos nacionales salen de una tabla anual.

**Impuestos y regulados como datos con fecha:**

- Van en `data/regulados.json` con `vigente_desde` y `vigente_hasta`: IVA, IEE, bono social, alquiler del contador, peajes y cargos.
- Así una factura se calcula con los tipos vigentes en cada día del periodo.
- Ejemplo de por qué hace falta: en 2026 rigió un IVA del 10 % del 22/03 al 31/05 y del 21 % desde el 01/06 ([Endesa](https://www.endesa.com/es/blog/blog-de-endesa/luz/iva-luz-gas-vuelve-21-junio-2026-actua-antes); confirmar en el BOE).

**Prueba de que está bien calculado (obligatoria antes de publicar):**

- Con 5 facturas reales y sus ficheros, el total calculado debe coincidir con la factura con un margen de ±2 %.
- Si no coincide, no se publica.

**Hecho cuando:**

- Lee los ficheros de al menos 4 fuentes distintas.
- Pasa la prueba de las 5 facturas.
- Funciona sin conexión una vez cargado, porque el cálculo es local.
- Se ve bien en el móvil a 375 px.

### M3. Cuánto gasta cada aparato

**Calculadora genérica:**

- Entradas: potencia (W) o consumo de la etiqueta energética (kWh/año), horas de uso al día, días.
- Salida: kWh y € con el precio de hoy, con tu tarifa fija o comparando "si lo usas a las 15:00 frente a las 20:00".

**Una página por aparato**, con valores típicos editables:

- Aire acondicionado, bomba de calor, radiador de aceite, calefactor, estufa de infrarrojos, termo eléctrico.
- Lavadora, secadora, lavavajillas, horno, placa de inducción, vitrocerámica, microondas, freidora de aire.
- Nevera, congelador, televisor, consola, ordenador, router.
- Deshumidificador, cargador de coche eléctrico, patinete.

Cada página lleva:

- El coste por uso y por mes, con el precio de hoy.
- Un truco de ahorro.
- Las horas más baratas para usarlo.
- Modelos eficientes con enlace de afiliado, y un enchufe medidor de consumo para saber tu dato real.

**Datos de consumo:**

- Se usan rangos típicos con fuente citada: ficha del fabricante o etiqueta energética europea.
- **Investigar en la Fase 0** la base de datos europea de etiquetas energéticas ([EPREL](https://eprel.ec.europa.eu/)) y si su acceso público permite consultar modelos.

**Hecho cuando:** hay 25 páginas de aparato, todas con el precio del día y la fuente de cada cifra.

### M4. Calculadora de placas solares y contactos para la empresa del amigo

**Entradas:**

- Código postal o dirección, convertidos a coordenadas.
- Consumo: el **fichero de M2 si lo ha subido** (lo más preciso) o el importe medio de la factura (estimación).
- Tipo de vivienda, superficie de tejado útil, orientación e inclinación (con valores por defecto) y si teletrabaja (más consumo de día).

**Cálculo:**

1. **Producción hora a hora** con la API gratuita de la Comisión Europea, [PVGIS 5.3](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/using-pvgis-5/api-non-interactive-service_en) (`https://re.jrc.ec.europa.eu/api/v5_3/seriescalc`; solo GET, límite de 30 llamadas por segundo por IP). Se consulta desde el Worker y se guarda en caché por coordenadas redondeadas.
2. **Autoconsumo**: cruzar hora a hora la producción con el consumo del fichero. Si no hay fichero, se usa un perfil tipo. Así se sabe qué parte se consume directamente y cuánta energía sobra.
3. **Ahorro**:
   - La energía autoconsumida se valora a tu precio de energía.
   - Los excedentes, con la **compensación simplificada**: se pagan al precio acordado o al indicador 1739 del PVPC, y nunca descuentan más que el término de energía de cada factura **[verificar la normativa vigente]**.
4. **Coste e inversión**: €/kWp según la **tabla de precios que dé el amigo**, con tramos por tamaño.
   - Resultado: años de amortización y ahorro a 25 años.
   - Mostrar **rangos** (escenario prudente y escenario favorable), nunca una cifra única que parezca una promesa.
5. **Ayudas**: deducciones de IRPF por eficiencia energética y bonificaciones municipales de IBI e ICIO.
   - Solo como información, con enlace a la fuente oficial **[verificar vigencia en 2026]**.
   - No se suman al ahorro salvo que el usuario lo marque.

**Petición de estudio (la conversión):**

- Botón "Pide un estudio gratuito sin compromiso" con un formulario corto: nombre, teléfono o correo, código postal, resumen del cálculo ya adjunto.
- **Casilla de consentimiento explícito**, sin marcar por defecto: "Acepto que mis datos se envíen a [EMPRESA], instalador colaborador, para que me contacte con un estudio."
- Un Worker guarda el contacto en D1 con un código único (`LST-2026-0001`) y avisa al amigo por correo (o por Telegram, que es gratis).
- Panel simple (protegido) con el estado de cada contacto: nuevo, contactado, visita, presupuesto, firmado, perdido. **Sin esto no se puede cobrar.**
- Si el código postal está fuera de la zona del amigo: "Aún no tenemos instalador en tu zona" y se ofrece guardar el contacto para el futuro, con su consentimiento.

**Hecho cuando:**

- El cálculo de 3 casos reales del amigo se parece a su estudio profesional con un margen de ±15 %.
- Los contactos llegan y quedan registrados.
- Los textos legales están revisados.

### M5. Guías

Unas 20 guías, cortas, con ejemplos en euros y enlaces a la herramienta que resuelve cada caso:

1. Cómo leer tu factura de la luz, línea a línea.
2. Periodos 2.0TD: punta, llano y valle.
3. Potencia contratada: cómo saber si te sobra y cómo bajarla.
4. PVPC o mercado libre: cuál te conviene.
5. Cómo descargar tu consumo en Datadis, paso a paso.
6. Cambiar de compañía: es gratis, no hay corte y no hace falta permiso del propietario.
7. Bono social: requisitos y cómo pedirlo.
8. Permanencias y servicios añadidos: qué mirar antes de firmar.
9. Autoconsumo: cómo funciona la compensación de excedentes.
10. Placas solares en un piso: autoconsumo colectivo y comunidades energéticas.
11. Baterías: cuándo compensan y cuándo no.
12. Tarifas para el coche eléctrico.
13. Calefacción: radiador, bomba de calor o gas.
14. Aire acondicionado: cuánto gasta y cómo usarlo bien.
15. Consumo fantasma: los aparatos en espera.
16. Cambios de IVA e impuesto eléctrico: cronología.
17. Contadores inteligentes y telegestión.
18. Cortes y reclamaciones: a quién acudir.
19. Glosario: CUPS, kWh, kW, peajes, cargos.
20. Preguntas frecuentes.

**Reglas de las guías:**

- Fecha de revisión visible.
- Fuentes oficiales: BOE, CNMC, IDAE, REE.
- Nada de relleno: si una guía no lleva a una herramienta o a una decisión, no se escribe.

---

## 4. Monetización

| Fuente | Cómo | Cuándo | Comentario |
|---|---|---|---|
| **Contactos de placas solares** | Acuerdo con el amigo (ver §5) | Desde la Fase 4 | Es la que más paga por visita; con pocos contactos al mes ya compensa |
| **Referidos de comercializadoras** | Programas de afiliación en redes como Awin o directos **[investigar cuáles existen en 2026]** | Fase 2 | **No** usar códigos personales de "invita a un amigo" si sus condiciones lo prohíben para uso público |
| **Productos (Amazon y otras)** | Enchufes medidores, aparatos eficientes, termostatos | Fase 3 | Amazon.es paga un 3 % en electrónica e informática y un 5 % en hogar y cocina ([tabla oficial](https://afiliados.amazon.es/help/node/topic/GRXPHT8U84RAYDXZ)); confirmar la categoría de cada producto |
| **Publicidad** | AdSense u otra red cuando haya tráfico | Cuando haya ~30.000 páginas vistas al mes | Nunca dentro de los resultados de las calculadoras. En la UE exige un gestor de consentimiento certificado por Google **[verificar]** |

**Neutralidad (obligatoria y pública en `/como-funciona/`):**

- El orden del comparador es siempre por coste estimado.
- Las tarifas con comisión llevan la etiqueta "Enlace con comisión".
- Las tarifas sin acuerdo se muestran igual, con enlace directo.

---

## 5. Acuerdo con la empresa de placas del amigo

**Firmarlo por escrito antes de enviar el primer contacto.** Puntos que debe recoger:

1. **Qué se paga:**
   - **Recomendado:** importe fijo por instalación **firmada**, por ejemplo X € o un % del presupuesto sin IVA.
   - Alternativa: un pequeño fijo por contacto válido más un variable por firma.
   - Evitar cobrar solo por contacto: incentiva la cantidad y no la calidad.
2. **Seguimiento:** cada contacto lleva su código `LST-…`. El amigo actualiza el estado en el panel o lo envía en un resumen mensual.
3. **Plazo de atribución:** si el cliente firma en los 12 meses siguientes al contacto, cuenta.
4. **Pago:** mensual, contra factura o recibo, a 30 días.
5. **Zona:** códigos postales que cubre. Fuera de ellos, libertad para buscar otros instaladores.
6. **Calidad:** primer contacto en menos de 48 h laborables y presupuesto sin compromiso. Si los clientes se quejan, se puede pausar el envío.
7. **Protección de datos (RGPD):**
   - Quién es responsable de cada dato.
   - Base legal: el consentimiento de la casilla.
   - Borrado de los contactos que no siguen adelante.
   - Hay que redactarlo bien; pedir una plantilla a un gestor o abogado.
8. **Duración y salida:** un año prorrogable y preaviso de 30 días.
9. **Exclusividad:** no ofrecerla al principio, o solo en su zona.

**Fiscalidad:** los cobros de la comisión y de la publicidad son ingresos que hay que declarar. Si son periódicos pueden considerarse una actividad económica, con implicaciones de alta en Hacienda y en la Seguridad Social. **Consultarlo con un gestor antes de cobrar el primer euro.** Es la decisión que el propietario quería evitar, así que conviene tenerla clara desde el principio.

---

## 6. Requisitos legales de la web

- Aviso legal (LSSI), política de privacidad (RGPD y LOPDGDD) y política de cookies.
- Banner de consentimiento: solo cookies técnicas mientras no haya publicidad. Analítica sin cookies, por ejemplo Cloudflare Web Analytics.
- Transparencia: aviso de enlaces con comisión en cada página que los tenga, y página `/como-funciona/` con las reglas del comparador.
- Calculadoras: aviso de que son **estimaciones** y no ofertas vinculantes.
- Fichero de consumos: se procesa en local y no se guarda. Hay que decirlo y que sea verdad; se comprueba en la pestaña de red del navegador antes de publicar.
- Formulario de contactos: consentimiento explícito, finalidad, destinatario (el instalador) y derechos.

---

## 7. Marca y dominio

**Propuesta: LuzSinTrampa.es**

- Dice qué es y qué promete: la factura, sin letra pequeña.
- Fácil de recordar y de dictar.
- Encaja con un tono honesto y directo.

**Alternativas:**

- `nomelacuelan.es`, la marca anterior, que sigue sirviendo ("que no te la cuelen con la luz") y admite otros temas en el futuro.
- `lafacturaclara.es`.

Ninguno de los tres tenía DNS el 21/10/2026, lo que **sugiere** que están libres, pero solo lo confirma un registrador.

**Ya ocupados según el DNS:** `luzclara.es`, `facturaclara.es`, `cuantogasta.es`, `horaluz.es`, `miluzbarata.es`, `tufacturaluz.es`, `kilovatio.es`, `watio.es`.

**Acción:**

- Comprobar en un registrador y comprar el elegido (unos 10 € al año).
- Reservar también el usuario de Telegram con el mismo nombre.

---

## 8. Arquitectura técnica (0 €)

| Pieza | Elección | Motivo |
|---|---|---|
| Web | Astro, estático por defecto | Rapidísima, SEO excelente; ya se dominó en el proyecto anterior |
| Hosting | Cloudflare Workers con Static Assets, **cuenta nueva y separada** de la web existente | Gratis, dominio propio, cron incluido |
| Precios diarios | Worker con cron → ESIOS → D1 → JSON estático | Sin servidor propio |
| Contactos | Worker + D1 (+ aviso por correo o Telegram) | Gratis a este volumen |
| Producción solar | PVGIS desde el Worker, con caché en D1 o KV | API pública gratuita |
| Lector del fichero y cálculos | TypeScript en el navegador (Web Worker si el fichero es grande) | Privacidad y 0 € de servidor |
| Aviso diario | Bot y canal de Telegram | Gratis y muy usado en España |
| Analítica | Cloudflare Web Analytics y Google Search Console | Sin cookies |
| Secretos | Token de ESIOS, token del bot, claves de afiliación en variables y secretos del Worker | Nunca en el código |

Los límites del plan gratuito de Cloudflare (peticiones, D1, KV, cron) se comprobaron en el proyecto anterior (`docs/ARCHITECTURE.md`). **Volver a comprobarlos al empezar.**

**Estructura del repositorio propuesta:**

```
/apps/web            Astro (páginas, componentes, calculadoras en el cliente)
/apps/worker         Cron de ESIOS, API de contactos, proxy y caché de PVGIS, bot de Telegram
/packages/tarifa     Motor de cálculo de la factura 2.0TD (TypeScript puro, con tests)
/packages/csv        Lector de los ficheros de consumo (tests con ficheros reales anonimizados)
/data                tarifas.json, regulados.json, festivos.json, aparatos.json
/docs                DESIGN.md (del propietario), decisiones, fuentes, datos de validación
```

**Calidad mínima:**

- Tests del motor de factura con las 5 facturas reales.
- Tests del lector con un fichero de cada fuente.
- Lighthouse ≥ 95.
- Accesibilidad WCAG AA (comprobada con axe a 375 px y a 1280 px).

---

## 9. Diseño (principios; el estilo lo marca el `DESIGN.md` del propietario)

- **El número primero:** cada herramienta responde en grande ("Ahorrarías 184 € al año") y luego explica cómo.
- **Pensado para el móvil:** la mayoría llegará desde el móvil y desde Telegram.
- **Gráfico de horas:** barras con el precio en texto y etiquetas "barata", "normal" o "cara". Nunca solo color.
- **Confianza visible:** fuentes, fecha del dato y "cómo lo calculamos" junto a cada resultado.
- **Sin patrones oscuros:**
  - El formulario de contacto nunca tapa el resultado.
  - El resultado se ve **antes** de pedir datos personales.

---

## 10. SEO

- **Páginas generadas con datos reales y útiles:**
  - El precio de cada día (una página por día con datos).
  - Cada aparato.
  - Más adelante, cada comercializadora ("tarifas de X, ¿cuánto pagarías?"), calculado con el catálogo.
- Datos estructurados: `Dataset` o `Table` para los precios, `HowTo` en las guías paso a paso, `FAQPage` en las preguntas frecuentes.
- Enlazado interno: cada guía enlaza a su herramienta y cada herramienta, a su guía.
- **Prohibido:** páginas sin datos propios, texto de relleno y contenido generado en masa sin revisar.

---

## 11. Hoja de ruta

Calculada con unas 5–10 horas a la semana.

### Fase 0: Validación y preparación (semanas 1–2)

- [ ] Autocompletado de Google con las semillas de §2 → `docs/datos/`.
- [ ] Analizar a fondo la web de inspiración y 3 competidores: qué hacen bien y qué falta.
- [ ] Conversación con el amigo: zona, tabla de precios por kWp, interés real y borrador del acuerdo (§5).
- [ ] Consulta con un gestor: fiscalidad de los ingresos por comisión y publicidad.
- [ ] Pedir el token de ESIOS.
- [ ] Reunir 5 facturas con sus ficheros de consumo (tuyas, de familia y amigos).
- [ ] Comprar el dominio y crear la cuenta separada de Cloudflare.
- [ ] Recibir el `DESIGN.md`.
- **Seguir si:** el amigo se compromete y hay demanda en las búsquedas.

### Fase 1: Precio de la luz por horas y Telegram (semanas 3–5)

- [ ] Worker con cron de ESIOS, D1, JSON y páginas de hoy, mañana y archivo.
- [ ] Bloque "mejores horas para…".
- [ ] Bot y canal de Telegram.
- [ ] Páginas legales, `/como-funciona/`, Search Console y analítica.
- **Hecho:** 14 días seguidos sin intervención manual.

### Fase 2: Comparador con fichero (semanas 6–10)

- [ ] Lector de ficheros con tests.
- [ ] Motor de factura 2.0TD con tests (las 5 facturas).
- [ ] `regulados.json` con fechas y `tarifas.json` con 20–30 tarifas y sus fuentes.
- [ ] Interfaz completa con extras (periodos, potencia, desplazar consumo).
- [ ] Guías 1–8.
- [ ] Investigar y solicitar los programas de referidos de comercializadoras.

### Fase 3: Cuánto gasta cada aparato (semanas 11–13)

- [ ] Calculadora genérica y 25 páginas de aparato.
- [ ] Alta en Amazon Afiliados y enlaces de productos.
- [ ] Guías 13–15.

### Fase 4: Calculadora solar y contactos (semanas 14–18)

- [ ] Proxy de PVGIS con caché.
- [ ] Cálculo de autoconsumo hora a hora y escenarios.
- [ ] Formulario con consentimiento, D1, aviso al amigo y panel de estados.
- [ ] Contrato firmado y textos legales revisados.
- [ ] Prueba con 3 estudios reales del amigo (±15 %).
- [ ] Guías 9–12.

### Fase 5: Crecimiento (desde el mes 5)

- [ ] Revisar Search Console cada mes y ampliar lo que funciona.
- [ ] Páginas de comercializadoras.
- [ ] Notificaciones web y alerta "avísame si el precio de mañana baja de X".
- [ ] Publicidad, si el tráfico lo justifica.
- [ ] Más instaladores en otras zonas, si el modelo funciona con el amigo.

---

## 12. Métricas y criterios de decisión

| Métrica | A los 3 meses | A los 6 meses | A los 12 meses |
|---|---|---|---|
| Visitas al mes desde buscadores | 1.000 | 5.000 | 20.000 |
| Suscriptores del canal de Telegram | 100 | 500 | 2.000 |
| Ficheros analizados al mes | 50 | 300 | 1.000 |
| Contactos solares al mes | — | 5 | 20 |
| Instalaciones firmadas (acumulado) | — | 1 | 10 |

- Son **objetivos de referencia, no previsiones**: sirven para decidir.
- **Regla de decisión a los 6 meses:**
  - Si las visitas no superan 2.000 al mes **y** no ha llegado ningún contacto solar, se revisa el enfoque antes de invertir más horas.
  - Si llegan contactos aunque haya poco tráfico, el modelo funciona: hay que reforzar la calculadora solar.

---

## 13. Riesgos y cómo se mitigan

| Riesgo | Mitigación |
|---|---|
| Cálculo de la factura incorrecto | Prueba de las 5 facturas, impuestos con fecha y aviso de "estimación" |
| Tarifas desactualizadas | Fecha de comprobación visible, revisión mensual, marca "por revisar" a los 45 días |
| ESIOS cambia o falla | Reintentos, aviso de "no publicado" y nunca mostrar datos viejos como actuales |
| Formatos de fichero nuevos | Selector manual de columnas como plan B y botón "envíanos un fichero de ejemplo anonimizado" |
| El amigo no da respuesta rápida a los contactos | Plazo de 48 h en el acuerdo y pausa del envío |
| Problemas de protección de datos | Consentimiento explícito, mínimo de datos, borrado de contactos no válidos, textos revisados |
| Competencia fuerte en "precio luz hoy" | El precio diario es el gancho del canal de Telegram; el valor diferencial está en el comparador con fichero y en la calculadora solar con datos reales |
| Fiscalidad | Consulta al gestor en la Fase 0, antes de cobrar |

---

## 14. Decisiones pendientes del propietario

1. Aportar el `DESIGN.md`.
2. URL de la web de comparación que sirvió de inspiración.
3. Elegir el dominio: **LuzSinTrampa.es** (recomendado), `nomelacuelan.es` o `lafacturaclara.es`.
4. Condiciones con el amigo: zona, tabla de €/kWp y comisión por instalación firmada.
5. Respuesta del gestor sobre la fiscalidad.
6. Qué hacer con el repositorio actual (`C:\Proyectos\dropshipping`):
   - Recomendado: empezar un **repositorio nuevo**, por ejemplo `C:\Proyectos\luzsintrampa`, y conservar el actual como archivo.
   - El trabajo de la rama `feat/fase-3-diseno` está sin commit.

---

## 15. Fuentes consultadas (21/10/2026)

- Impuestos de la factura en 2026: [Endesa: el IVA vuelve al 21 % en junio de 2026](https://www.endesa.com/es/blog/blog-de-endesa/luz/iva-luz-gas-vuelve-21-junio-2026-actua-antes), [Endesa: impuestos de la luz](https://www.endesa.com/es/te-ayudamos/sobre-tu-factura/impuestos-luz-gas). Confirmar en el BOE.
- Datos de Red Eléctrica: [REData API](https://www.ree.es/es/apidatos), y los indicadores 1001 y 1739 de ESIOS según la [documentación de evcc](https://docs.evcc.io/en/tariffs/ree).
- Producción solar: [PVGIS, servicio API no interactivo (JRC)](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/using-pvgis-5/api-non-interactive-service_en).
- Consumos: [Datadis](https://datadis.es). El formato de exportación está por confirmar con ficheros reales.
- Comparador oficial: [CNMC](https://comparador.cnmc.gob.es/).
- Comisiones de Amazon.es: [tabla oficial de Amazon Afiliados](https://afiliados.amazon.es/help/node/topic/GRXPHT8U84RAYDXZ).
- Impacto de la IA de Google en los clics: [Pew Research](https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/), [Ahrefs](https://ahrefs.com/blog/ai-overviews-reduce-clicks-update/).

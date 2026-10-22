# ComparadorTarifaLuz.es

> Antes LuzSinTrampa (se mantiene como lema). Por qué este nombre: [docs/datos/analisis-nombre-y-competencia.md](docs/datos/analisis-nombre-y-competencia.md).

Web para pagar menos luz con datos reales del usuario y de Red Eléctrica. El plan completo está en [docs/LuzSinTrampa.md](docs/LuzSinTrampa.md) y el sistema de diseño en [docs/DESIGN.md](docs/DESIGN.md).

## Arrancar

```bash
npm install
npm run precios        # descarga el PVPC de los últimos 30 días a data/precios (REData, sin token)
npm run dev            # http://localhost:4321
npm test               # motor de factura y lector de ficheros
npm run build          # web estática en apps/web/dist
```

En desarrollo, `apps/web/astro.config.mjs` imita las rutas `/api/*` del Worker (PVGIS, precios y contacto) para poder probarlo todo en local. Los contactos de prueba no se guardan.

## Estructura

```
apps/web          Astro (páginas, componentes, calculadoras en el cliente)
apps/worker       Worker de Cloudflare: cron de precios, API de contactos, caché de PVGIS, panel y bot de Telegram
packages/tarifa   Motor de cálculo de la factura 2.0TD, periodos, análisis (TypeScript puro, con tests)
packages/csv      Lector de ficheros de consumo con detección automática (con tests)
data              tarifas.json (CNMC), tarifas-manuales.json, cnmc/ (bruto), regulados.json, festivos.json, aparatos.json, provincias.json, precios/
scripts           fetch-precios.mjs, importar-cnmc.mjs, gen-datos.mjs, autocompletado.mjs
docs              Plan, diseño y datos de validación (docs/datos)
```

## Qué hay hecho

| Módulo | Estado |
|---|---|
| M1 Precio por horas | `/precio-luz-hoy/`, `/precio-luz-manana/`, `/precio-luz-ayer/`, archivo `/precio-luz/AAAA-MM-DD/` con datos reales (REData), bloque «mejores horas para…», gráfico accesible (precio y etiqueta en texto). Si el dato no es del día, el navegador lo vuelve a pedir y, si no está, dice «aún no publicado». |
| Ranking de tarifas | `/tarifas/`: todas las tarifas ordenadas para un consumo tipo editable (consumo, perfil, potencia), generado en el build e interactivo; tabla de precios de todas las tarifas por compañía. |
| Calculador de factura | `/calcular-factura-luz/`: tus facturas por ciclo (día de corte) con tu tarifa, zona y bono social. |
| Analizador de consumo | `/analizador-consumo/`: gráficas por hora, día y mes, mapa de calor, consumo de fondo, picos y consejos. |
| Histórico | `/precio-luz/historico/`: PVPC y OMIE mes a mes desde 2021 (`node scripts/historico.mjs`) y peajes, cargos e impuestos. |
| M2 Comparador | Lector en el navegador (Datadis, i-DE, e-distribución, UFD, formatos genéricos, cuartohorario, Wh, hora 25 y día de 23 h, mapeo manual si no reconoce el formato). Motor 2.0TD con regulados por fecha (IVA del 10 % en 2026 incluido) y PVPC hora a hora real. Dos modos: fichero horario o datos de la factura (anual o por periodos, con 4 perfiles de consumo). Ranking en tabla con filtros (tipo, permanencia, servicios, online, renovable, potencia máxima), orden por columnas, promociones del primer año opcionales, detalle con desglose y letra pequeña, y exportación a CSV. Orden solo por precio; «por revisar» e incompletas detrás. Extras: reparto por periodos, potencia sobrante, mover un 10 % a valle y enlace a la calculadora solar con el consumo cargado. |
| M3 Cuánto gasta | Calculadora genérica y 27 páginas de aparato con el precio de hoy, mejor y peor franja, truco y fuente. |
| M4 Solar | PVGIS hora a hora (con aproximación si falla) × consumo del fichero o de la factura, escenarios prudente/favorable, amortización y 25 años. Formulario después del resultado, consentimiento sin marcar, fuera de zona. Worker con D1, código `LST-AAAA-NNNN`, aviso por Telegram y panel de estados. |
| M5 Guías | 41 guías en 8 temas (`/guias/`), con respuesta corta al principio, índice, preguntas frecuentes, fecha de revisión, fuentes, herramienta y guías relacionadas; datos estructurados Article/HowTo, FAQPage y migas. |
| Herramientas nuevas | `/herramientas/potencia/` (potencia P1/P2 según aparatos a la vez), `/herramientas/coche-electrico/` (coste de carga frente a combustión y mejores horas), `/herramientas/distribuidora/` (distribuidora y letras de control del CUPS). El simulador de factura funciona sin fichero (kWh de la factura), el comparador acepta «solo sé lo que pago al mes», la calculadora solar simula una batería y la de aparatos tiene hora de uso y comparación con uno más eficiente. |
| Lector de facturas | `/entender-factura-luz/`: lee el PDF en el navegador (pdf.js), saca los datos (`@lst/factura`), explica cada línea con un diccionario de ~40 conceptos del modelo regulado, comprueba si cuadra y calcula las tarifas más baratas. Sin facturas reales públicas, se ha probado con PDF generados y textos con palabras partidas; mejora añadiendo casos a `packages/factura/test`. |
| Más herramientas | `/periodo-luz-ahora/`, `/herramientas/bono-social/` (RD 897/2017 y descuentos de `data/bono-social.json`), `/herramientas/calefaccion/`, `/herramientas/termo/`, `/herramientas/excedentes/` y `/herramientas/factura-gas/` (TUR en `data/combustibles.json`). Todas salen de `src/lib/herramientas.ts`: menú desplegable, portada, pie, `/herramientas/`, sitemap y llms.txt. |
| Logos | `node scripts/logos.mjs` descarga el icono oficial de cada comercializadora a `apps/web/public/logos/` (servidos desde nuestro dominio) y escribe `data/logos.json`. Las que no tienen icono utilizable salen con sus iniciales; las excepciones están en el propio script. Volver a ejecutarlo cuando entren comercializadoras nuevas. |
| SEO y GEO | `llms.txt`, `robots.txt` abierto a buscadores con IA, sitemap con `lastmod`, WebSite/Organization en la portada, WebApplication + FAQPage en cada herramienta. |
| Publicidad | Huecos de AdSense repartidos (ver abajo), apagados hasta la aprobación. |
| Legal y transparencia | `/como-funciona/`, aviso legal, privacidad y cookies (borradores para revisión). |

## Desplegar

Todo corre en Cloudflare (plan gratuito): un Worker sirve la web estática (`apps/web/dist`), las rutas `/api/*` y el cron diario, con una base D1. El dominio está registrado en OVH y sus DNS los lleva Cloudflare.

### Una sola vez

1. **Dominio a Cloudflare.** Crea la cuenta en dash.cloudflare.com → *Agregar un dominio* → `comparadortarifaluz.es` → plan *Free*. Apunta los dos nameservers que te da. En OVH (*Web Cloud → Nombres de dominio → comparadortarifaluz.es*): desactiva **DNSSEC** si está activo y, en *Servidores DNS → Modificar*, sustituye `dns103.ovh.net` y `ns103.ovh.net` por los de Cloudflare. Espera al correo de «dominio activo» (minutos u horas). Si tienes el `.com`, lo mismo con él.
2. **Entrar en Cloudflare desde el ordenador:** `npx wrangler login`.
3. **Base de datos:** `npx wrangler d1 create comparadortarifaluz` y copia el `database_id` que imprime en `apps/worker/wrangler.toml` (donde pone `PENDIENTE`). Después, `npm run db:init`.
4. **Secretos** (opcionales para empezar; `npx wrangler secret put NOMBRE` dentro de `apps/worker`): `ESIOS_TOKEN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CANAL`; y `TELEGRAM_AVISOS`, `PANEL_USUARIO`, `PANEL_CLAVE` cuando se active el instalador.

### Primer despliegue

```bash
npm run precios
npm run desplegar
```

`desplegar` construye la web y sube el Worker. Con la zona activa, Cloudflare conecta `comparadortarifaluz.es` (crea el DNS y el certificado HTTPS). También queda la dirección `https://comparadortarifaluz.<tu-cuenta>.workers.dev`, marcada como no indexable, para pruebas. Si falla con «zone not found», la zona aún no está activa: espera y repite.

### Redirecciones (en el panel de Cloudflare)

No pasan por el Worker para no gastar peticiones; son reglas gratuitas de Cloudflare:

- **www → sin www:** zona `comparadortarifaluz.es` → *DNS → Registros → Agregar*: tipo `AAAA`, nombre `www`, contenido `100::`, **proxy activado** (nube naranja). Después *Reglas → Reglas de redireccionamiento → Crear regla → Plantilla «Redirect from WWW to root»* → Implementar.
- **.com → .es:** zona `comparadortarifaluz.com` → dos registros `AAAA` (`@` y `www`) con contenido `100::` y proxy activado; regla de redirección «Todas las solicitudes entrantes» → *URL dinámica* `concat("https://comparadortarifaluz.es", http.request.uri.path)`, código **301**, conservar la cadena de consulta.

### Automático con GitHub

1. Crea un repositorio **privado** y sube el código: `git remote add origin https://github.com/TU_USUARIO/comparadortarifaluz.git` y `git push -u origin main`.
2. Cloudflare → *Mi perfil → Tokens de API → Crear token* con la plantilla **«Edit Cloudflare Workers»** y añade el permiso *Cuenta → D1 → Editar*.
3. GitHub → *Settings → Secrets and variables → Actions*: `CLOUDFLARE_API_TOKEN` (el token) y `CLOUDFLARE_ACCOUNT_ID` (está en la columna derecha de *Workers y Pages*).
4. GitHub → *Settings → Actions → General → Workflow permissions*: **Read and write permissions** y **Allow GitHub Actions to create and approve pull requests**.
5. *Actions → Build diario → Run workflow* para probarlo. Desde entonces, cada tarde descarga el precio de mañana, construye y despliega; los días 1 y 15 abre un PR con el catálogo de la CNMC.

### Después de publicar

- **Google Search Console:** verifica el dominio (registro TXT en el DNS de Cloudflare) y envía `https://comparadortarifaluz.es/sitemap.xml`. Importa el sitio en **Bing Webmaster Tools**.
- **Cloudflare Web Analytics:** *Analytics y registros → Web Analytics* → activar para el dominio (sin cookies; es lo que dice la política de privacidad).
- **Correo:** *Email → Email Routing* para `hola@comparadortarifaluz.es` → tu correo, y cámbialo en `SITIO.correo` (`apps/web/src/config.ts`).
- **AdSense:** solicítalo con la web publicada (ver «Publicidad»).

## Publicidad (Google AdSense)

Los anuncios están **apagados** (`apps/web/src/anuncios.json` → `"activo": false`): en producción no sale nada, ni script ni huecos. Para ver dónde irán: `npm run dev` (huecos rayados de muestra) o `PREVIEW_ANUNCIOS=1 npx astro build`.

Dónde van: en las guías, uno cada tres apartados (desde el tercero), uno en la barra lateral y un bloque de contenido relacionado al final; en las herramientas, antes de la ayuda y las preguntas frecuentes, **nunca dentro de un resultado**; en el precio de hoy y mañana, el ranking, el histórico y los aparatos, entre secciones. Legales y 404 sin anuncios.

Para activarlos:

1. Publica la web con contenido (las guías) y date de alta en AdSense con el dominio. Google revisa el sitio; tarda de días a semanas.
2. En AdSense, **Privacidad y mensajes → Europa**: crea el mensaje de consentimiento (CMP certificado de Google, TCF v2.2) con el botón «No consentir». Sin él, en el EEE solo hay anuncios limitados.
3. Crea cuatro bloques de anuncios: *display* adaptable (horizontal), *in-article* (articulo), *display* vertical (lateral) y *multiplex*. Copia el `ca-pub-…` y los `data-ad-slot` en `anuncios.json` y pon `"activo": true`.
4. Despliega: se generan `ads.txt` con tu `pub-…`, el script de AdSense y la sección de publicidad de las páginas de cookies y privacidad.

## Pendiente (no se puede cerrar sin el propietario)

- **Catálogo de tarifas:** 67 tarifas oficiales de la CNMC (`npm run tarifas`, también automático los días 1 y 15 con un PR para revisar) y 12 a mano en `data/tarifas-manuales.json` (Iberdrola, Naturgy, TotalEnergies). Incluye 4 indexadas (Lucera y Gana Energía con fórmula oficial; Octopus Flexi y Plan Ahora de TotalEnergies aproximadas) calculadas hora a hora con el OMIE y los ajustes mensuales de REE (`npm run precios` guarda ambos). Faltan las tarifas planas personalizadas (Holaluz) y Pepeenergy.
- **Indexadas:** los costes de ajuste son la media nacional mensual de REE y las pérdidas, los coeficientes regulados; con un token de ESIOS se podrían usar los valores horarios reales.
- **Precios trimestrales:** `data/combustibles.json` (TUR del gas cada trimestre, butano cada dos meses) y `data/bono-social.json` (descuentos vigentes hasta el 31/12/2026, IPREM) llevan `verificar: true`.
- **Regulados:** todos los valores de `data/regulados.json` llevan `verificar: true`. Confirmarlos en el BOE (en especial el bono social desde el 1/7/2026 y los peajes de potencia de 2026).
- **Prueba de las 5 facturas** (±2 %) antes de publicar el comparador, y ficheros reales anonimizados para sustituir los sintéticos de `packages/csv/test`.
- **Instalador:** apagado (`INSTALADOR.activo = false` en `config.ts`): no hay formulario de estudio ni recogida de datos, y los textos legales no lo mencionan. Al tener el acuerdo, ponerlo a `true` con nombre, zona y precios: el panel sale justo debajo del resultado de la calculadora solar.
- **Instalador (datos):** nombre, zona y tabla de €/kWp en `apps/web/src/config.ts` y `ZONA_INSTALADOR` en `apps/worker/wrangler.toml`. Hoy hay precios orientativos marcados como provisionales.
- **Textos legales:** aviso legal, condiciones de uso, privacidad y cookies con los datos del titular (`SITIO` en `config.ts`). Falta el código postal y la localidad del domicilio, los datos del instalador colaborador y, recomendable, una revisión profesional.
- **Cloudflare:** seguir «Desplegar» (cuenta, nameservers en OVH, D1, primer despliegue y GitHub).
- **Telegram:** crear bot y canal y poner `TELEGRAM_URL` en `config.ts`.
- **Amazon Afiliados:** `AMAZON_TAG` en `config.ts`; sin etiqueta no se muestran enlaces.
- **Capturas** de la guía de Datadis y de las distribuidoras.

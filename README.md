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
| SEO y GEO | `llms.txt`, `robots.txt` abierto a buscadores con IA, sitemap con `lastmod`, WebSite/Organization en la portada, WebApplication + FAQPage en cada herramienta. |
| Publicidad | Huecos de AdSense repartidos (ver abajo), apagados hasta la aprobación. |
| Legal y transparencia | `/como-funciona/`, aviso legal, privacidad y cookies (borradores para revisión). |

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
- **Dominio:** comprar `comparadortarifaluz.es` (y el .com) en un registrador: el DNS dice que están libres, pero solo el registrador lo confirma.
- **Precios trimestrales:** `data/combustibles.json` (TUR del gas cada trimestre, butano cada dos meses) y `data/bono-social.json` (descuentos vigentes hasta el 31/12/2026, IPREM) llevan `verificar: true`.
- **Regulados:** todos los valores de `data/regulados.json` llevan `verificar: true`. Confirmarlos en el BOE (en especial el bono social desde el 1/7/2026 y los peajes de potencia de 2026).
- **Prueba de las 5 facturas** (±2 %) antes de publicar el comparador, y ficheros reales anonimizados para sustituir los sintéticos de `packages/csv/test`.
- **Instalador:** nombre, zona y tabla de €/kWp en `apps/web/src/config.ts` y `ZONA_INSTALADOR` en `apps/worker/wrangler.toml`. Hoy hay precios orientativos marcados como provisionales.
- **Textos legales:** aviso legal, condiciones de uso, privacidad y cookies con los datos del titular (`SITIO` en `config.ts`). Falta el código postal y la localidad del domicilio, los datos del instalador colaborador y, recomendable, una revisión profesional.
- **Cloudflare:** cuenta nueva, base D1 (`npm run db:init -w @lst/worker` tras poner el `database_id`) y secretos (ver `wrangler.toml`). Token de ESIOS opcional: sin él se usa REData.
- **Telegram:** crear bot y canal y poner `TELEGRAM_URL` en `config.ts`.
- **Amazon Afiliados:** `AMAZON_TAG` en `config.ts`; sin etiqueta no se muestran enlaces.
- **Capturas** de la guía de Datadis y de las distribuidoras.

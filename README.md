# LuzSinTrampa

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
data              tarifas.json, regulados.json, festivos.json, aparatos.json, provincias.json, precios/
scripts           fetch-precios.mjs, gen-datos.mjs, autocompletado.mjs
docs              Plan, diseño y datos de validación (docs/datos)
```

## Qué hay hecho

| Módulo | Estado |
|---|---|
| M1 Precio por horas | `/precio-luz-hoy/`, `/precio-luz-manana/`, `/precio-luz-ayer/`, archivo `/precio-luz/AAAA-MM-DD/` con datos reales (REData), bloque «mejores horas para…», gráfico accesible (precio y etiqueta en texto). Si el dato no es del día, el navegador lo vuelve a pedir y, si no está, dice «aún no publicado». |
| M2 Comparador | Lector en el navegador (Datadis, i-DE, e-distribución, UFD, formatos genéricos, cuartohorario, Wh, hora 25 y día de 23 h, mapeo manual si no reconoce el formato). Motor 2.0TD con regulados por fecha (IVA del 10 % en 2026 incluido) y PVPC hora a hora real. Orden solo por precio; «por revisar» detrás. Extras: reparto por periodos, potencia sobrante, mover un 10 % a valle y enlace a la calculadora solar con el consumo cargado. |
| M3 Cuánto gasta | Calculadora genérica y 27 páginas de aparato con el precio de hoy, mejor y peor franja, truco y fuente. |
| M4 Solar | PVGIS hora a hora (con aproximación si falla) × consumo del fichero o de la factura, escenarios prudente/favorable, amortización y 25 años. Formulario después del resultado, consentimiento sin marcar, fuera de zona. Worker con D1, código `LST-AAAA-NNNN`, aviso por Telegram y panel de estados. |
| M5 Guías | 8 guías (las de la Fase 2) con fecha de revisión, fuentes y herramienta. |
| Legal y transparencia | `/como-funciona/`, aviso legal, privacidad y cookies (borradores para revisión). |

## Pendiente (no se puede cerrar sin el propietario)

- **Catálogo de tarifas:** `data/tarifas.json` es un borrador. Los precios no están comprobados y salen marcados «por revisar». Hay que reunir 20–30 tarifas con su URL y fecha.
- **Regulados:** todos los valores de `data/regulados.json` llevan `verificar: true`. Confirmarlos en el BOE (en especial el bono social desde el 1/7/2026 y los peajes de potencia de 2026).
- **Prueba de las 5 facturas** (±2 %) antes de publicar el comparador, y ficheros reales anonimizados para sustituir los sintéticos de `packages/csv/test`.
- **Instalador:** nombre, zona y tabla de €/kWp en `apps/web/src/config.ts` y `ZONA_INSTALADOR` en `apps/worker/wrangler.toml`. Hoy hay precios orientativos marcados como provisionales.
- **Textos legales:** completar titular, NIF y datos del instalador, y revisarlos con un profesional.
- **Cloudflare:** cuenta nueva, base D1 (`npm run db:init -w @lst/worker` tras poner el `database_id`) y secretos (ver `wrangler.toml`). Token de ESIOS opcional: sin él se usa REData.
- **Telegram:** crear bot y canal y poner `TELEGRAM_URL` en `config.ts`.
- **Amazon Afiliados:** `AMAZON_TAG` en `config.ts`; sin etiqueta no se muestran enlaces.
- **Capturas** de la guía de Datadis y de las distribuidoras.

---
titulo: "El fichero de consumos CSV: qué contiene, formatos y cómo crearlo a mano"
resumen: "Cómo es el fichero de consumo horario de Datadis y de las distribuidoras, qué formatos leemos y cómo hacer uno a mano para simular cambios de hábitos."
respuesta: "El fichero de consumos es un CSV con tu consumo hora a hora: fecha, hora (de 1 a 24 en Datadis) y kWh. Se descarga de Datadis o de tu distribuidora y puedes crearlo a mano con un bloc de notas para simular cambios."
categoria: "Tu consumo y el fichero"
revisado: "2026-10-21"
orden: 25
herramienta: { href: "/analizador-consumo/", texto: "Sube tu fichero al analizador y míralo en gráficas." }
fuentes:
  - { nombre: "Datadis", url: "https://datadis.es" }
---

El fichero de consumos es un **texto plano en columnas** (CSV) con lo que ha registrado tu contador inteligente **hora a hora**. Lo descarga cualquiera desde [Datadis](/guias/descargar-consumo-datadis/) o desde la web de su distribuidora.

## Qué columnas usamos

- **Fecha**: 05/01/2026, 2026/01/05 o 2026-01-05.
- **Hora**: de 1 a 24 (formato Datadis: la 1 es de 00:00 a 01:00), de 0 a 23, «01:00» o junto a la fecha («2026-01-05 13:00»).
- **Consumo**: en kWh (con coma o punto decimal) o en Wh.
- **CUPS**: opcional; solo lo mostramos tapado.

Detectamos solos el separador (`;`, `,` o tabulador), la coma decimal, los ficheros cuartohorarios y los días de 23 y 25 horas de los cambios de horario. Si no reconocemos tu formato, te pedimos que nos digas qué columna es cada cosa.

## Ejemplo de Datadis

```
CUPS;Fecha;Hora;Consumo_kWh;Metodo_obtencion
ES0021000000000000AB0F;2026/01/05;01:00;0,143;Real
ES0021000000000000AB0F;2026/01/05;02:00;0,168;Real
ES0021000000000000AB0F;2026/01/05;03:00;0,138;Real
```

## Crear un fichero a mano

Sirve para **simular** cambios: un coche eléctrico, una bomba de calor, teletrabajar… Abre el bloc de notas y escribe:

```
Fecha;Hora;Consumo_kWh
15/01/2026;1;1,5
15/01/2026;2;1,5
15/01/2026;3;0,2
```

Guárdalo como `consumo.csv`. Si prefieres partir de tu fichero real, ábrelo con una hoja de cálculo, cambia los valores de las horas que quieras y guárdalo como CSV separado por punto y coma.

Para cambios sencillos («consumiré un 20 % más») no hace falta: en el comparador, en *Opciones avanzadas*, tienes el **cambio de hábitos**.

## Excedentes de placas solares

Si tienes placas, el fichero de tu distribuidora suele traer una columna de **energía vertida** (excedentes). De momento solo leemos el consumo; la compensación de excedentes la calculamos en la [calculadora solar](/placas-solares/).

## Distribuidoras: dónde descargarlo

- [i-DE](https://www.i-de.es/) (Iberdrola)
- [e-distribución](https://www.edistribucion.com/) (Endesa)
- [UFD](https://www.ufd.es/) (Naturgy)
- [E-Redes](https://www.e-redes.es/) (antes EDP)
- [Viesgo Distribución](https://www.viesgodistribucion.com/)
- Para cualquiera de ellas: [Datadis](https://datadis.es).

// Lectura de los JSON de data/ en el build. Se leen del disco en vez de con import.meta.glob: con casi
// 10.000 ficheros, meterlos todos en el bundle disparaba la memoria del build en GitHub Actions.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

/** Carpeta data/ del repositorio, buscada hacia arriba desde donde se lanza el build. */
function carpetaData(): string {
  for (let d = process.cwd(); ; d = dirname(d)) {
    if (existsSync(join(d, "data", "global"))) return join(d, "data");
    if (dirname(d) === d) throw new Error("No se encuentra la carpeta data/ del repositorio");
  }
}

/** Todos los JSON de data/<carpeta>/<subcarpeta>/*.json. */
export function leerJsons<T>(carpeta: string): T[] {
  const raiz = join(carpetaData(), carpeta);
  if (!existsSync(raiz)) return [];
  return readdirSync(raiz, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .flatMap((e) =>
      readdirSync(join(raiz, e.name))
        .filter((f) => f.endsWith(".json"))
        .map((f) => JSON.parse(readFileSync(join(raiz, e.name, f), "utf8")) as T),
    );
}

/** Un JSON de data/ (ruta relativa a data/), o null si no existe. */
export function leerJson<T>(ruta: string): T | null {
  const f = join(carpetaData(), ruta);
  return existsSync(f) ? (JSON.parse(readFileSync(f, "utf8")) as T) : null;
}

/** Todos los JSON de una carpeta de data/ (sin subcarpetas), p. ej. data/carburantes/resumen/*.json. */
export function leerJsonsDe<T>(carpeta: string): T[] {
  const dir = join(carpetaData(), carpeta);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as T);
}

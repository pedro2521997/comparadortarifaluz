// @ts-check
// Web global (precio de la luz por países). Mismo repositorio, estilos y lógica que la web española
// (apps/web), pero otro dominio y otro Worker (apps/worker-global). El dominio se cambia en src/config.ts.
import { defineConfig } from "astro/config";
import { SITIO } from "./src/config.ts";

export default defineConfig({
  site: SITIO.url,
  trailingSlash: "ignore",
  build: { format: "directory" },
  vite: { server: { fs: { allow: ["../.."] } } },
});

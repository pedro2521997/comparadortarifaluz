// @ts-check
import { defineConfig } from "astro/config";
import { readFileSync, existsSync } from "node:fs";

// Web estática. Las rutas /api/* las sirve el Worker de Cloudflare (apps/worker) en producción.
// En desarrollo, este middleware imita esas rutas para poder probarlo todo en local.
/** @returns {import("vite").Plugin} */
function apiDesarrollo() {
  let contador = 0;
  return {
    name: "lst-api-desarrollo",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        const json = (status, cuerpo) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(cuerpo));
        };

        if (url.pathname === "/api/pvgis") {
          try {
            const r = await fetch(`https://re.jrc.ec.europa.eu/api/v5_3/seriescalc${url.search}`);
            res.statusCode = r.status;
            res.setHeader("Content-Type", "application/json");
            res.end(await r.text());
          } catch (e) {
            json(502, { error: "PVGIS no responde" });
          }
          return;
        }

        const precio = url.pathname.match(/^\/api\/precios\/(\d{4}-\d{2}-\d{2})$/);
        if (precio) {
          const f = new URL(`../../data/precios/${precio[1]}.json`, import.meta.url);
          if (!existsSync(f)) return json(404, { error: "Aún no publicado" });
          res.setHeader("Content-Type", "application/json");
          res.end(readFileSync(f));
          return;
        }

        if (url.pathname === "/api/contacto" && req.method === "POST") {
          let cuerpo = "";
          for await (const trozo of req) cuerpo += trozo;
          const datos = JSON.parse(cuerpo || "{}");
          if (!datos.consentimiento) return json(400, { error: "Falta el consentimiento" });
          const codigo = `LST-${new Date().getFullYear()}-${String(++contador).padStart(4, "0")}`;
          console.log(`[api/contacto] (solo desarrollo, no se guarda) ${codigo}`, { ...datos, contacto: "***" });
          return json(200, { codigo });
        }

        next();
      });
    },
  };
}

export default defineConfig({
  site: "https://luzsintrampa.es",
  trailingSlash: "ignore",
  build: { format: "directory" },
  vite: {
    plugins: [apiDesarrollo()],
    server: { fs: { allow: ["../.."] } },
  },
});

-- Esquema D1 de ComparadorTarifaLuz. Aplicar con:
--   npx wrangler d1 execute comparadortarifaluz --file=apps/worker/schema.sql --remote

CREATE TABLE IF NOT EXISTS precios (
  fecha TEXT PRIMARY KEY,              -- AAAA-MM-DD (hora de Madrid)
  precios TEXT NOT NULL,               -- JSON: 24 valores €/kWh (null en la hora inexistente de marzo)
  fuente TEXT NOT NULL,                -- 'redata' | 'esios'
  descargado TEXT NOT NULL,            -- ISO
  publicado_telegram INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS contactos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT NOT NULL UNIQUE,         -- LST-2026-0001
  creado TEXT NOT NULL,
  tipo TEXT NOT NULL,                  -- 'estudio' (dentro de zona) | 'futuro' (fuera de zona)
  nombre TEXT NOT NULL,
  contacto TEXT NOT NULL,              -- teléfono o correo
  cp TEXT NOT NULL,
  resumen TEXT NOT NULL,
  consentimiento TEXT NOT NULL,        -- texto exacto aceptado + fecha
  estado TEXT NOT NULL DEFAULT 'nuevo',-- nuevo | contactado | visita | presupuesto | firmado | perdido
  actualizado TEXT NOT NULL,
  notas TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS contactos_estado ON contactos (estado);

CREATE TABLE IF NOT EXISTS pvgis_cache (
  clave TEXT PRIMARY KEY,              -- lat,lon,inclinación,azimut redondeados
  datos TEXT NOT NULL,
  creado TEXT NOT NULL
);

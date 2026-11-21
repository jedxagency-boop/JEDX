-- Tabla del Libro de Reclamaciones (Cloudflare D1)
CREATE TABLE IF NOT EXISTS reclamos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero TEXT,
  anio INTEGER NOT NULL,
  fecha TEXT NOT NULL,
  tipo TEXT NOT NULL,
  correo TEXT NOT NULL,
  datos TEXT NOT NULL,
  respuesta TEXT,
  fecha_respuesta TEXT
);
CREATE INDEX IF NOT EXISTS idx_reclamos_anio ON reclamos (anio);

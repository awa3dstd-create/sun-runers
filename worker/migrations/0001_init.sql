-- ──────────────────────────────────────────────────────────
-- SUN-RUNNERS — Schema inicial para Cloudflare D1
-- ──────────────────────────────────────────────────────────
-- D1 es SQLite por debajo, así que la sintaxis es la misma
-- que Prisma usaba localmente. Solo adaptamos a SQL plano.

-- Tabla: ContactRequest
-- Solicitudes del formulario público de contacto.
CREATE TABLE IF NOT EXISTS contact_request (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  email               TEXT NOT NULL,
  phone               TEXT NOT NULL,
  address             TEXT NOT NULL,
  lat                 REAL,
  lng                 REAL,
  service             TEXT NOT NULL,
  message             TEXT NOT NULL,
  preferred_channel   TEXT NOT NULL DEFAULT 'whatsapp',
  assigned_engineer_id TEXT,
  assigned_zone       TEXT,
  status              TEXT NOT NULL DEFAULT 'nuevo', -- nuevo | notificado | en_atencion | cerrado
  whatsapp_sent       INTEGER NOT NULL DEFAULT 0,
  email_sent          INTEGER NOT NULL DEFAULT 0,
  internal_notes      TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_request(status);
CREATE INDEX IF NOT EXISTS idx_contact_engineer ON contact_request(assigned_engineer_id);
CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_request(created_at);

-- Tabla: AutomationLog
-- Bitácora de auditoría para cada acción automatizada.
CREATE TABLE IF NOT EXISTS automation_log (
  id          TEXT PRIMARY KEY,
  request_id  TEXT NOT NULL,
  action      TEXT NOT NULL, -- assigned | whatsapp_sent | email_sent | status_changed
  detail      TEXT,
  success     INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (request_id) REFERENCES contact_request(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_log_request ON automation_log(request_id);
CREATE INDEX IF NOT EXISTS idx_log_created ON automation_log(created_at);

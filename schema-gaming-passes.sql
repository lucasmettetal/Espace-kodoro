-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : système de Pass Gaming Trimestriel (20 €)
-- Appliquer UNE SEULE FOIS après schema-reservations.sql et schema-email-system.sql
--
-- Commandes :
--   Local  → npx wrangler d1 execute kodoro-db --local  --file=schema-gaming-passes.sql
--   Remote → npx wrangler d1 execute kodoro-db --remote --file=schema-gaming-passes.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Pass Gaming ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gaming_passes (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id   INTEGER NOT NULL REFERENCES contacts(id),
  pass_type    TEXT NOT NULL DEFAULT 'quarterly',
  status       TEXT NOT NULL DEFAULT 'active'
               CHECK(status IN ('active','expired','cancelled')),
  starts_at    TEXT NOT NULL,
  expires_at   TEXT NOT NULL,
  stripe_session_id TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
  created_by   INTEGER REFERENCES organizers(id),
  notes        TEXT
);

CREATE INDEX IF NOT EXISTS idx_gaming_passes_contact ON gaming_passes(contact_id);
CREATE INDEX IF NOT EXISTS idx_gaming_passes_status  ON gaming_passes(status, expires_at);

-- ── Paiements (compatible Stripe / liquide / HelloAsso futur) ──────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id           INTEGER REFERENCES contacts(id),
  pass_id              INTEGER REFERENCES gaming_passes(id),
  reservation_id       INTEGER REFERENCES reservations(id),
  payment_provider     TEXT NOT NULL DEFAULT 'stripe'
                       CHECK(payment_provider IN ('stripe','cash','helloasso','manual')),
  provider_payment_id  TEXT,
  amount               INTEGER NOT NULL DEFAULT 0,
  currency             TEXT NOT NULL DEFAULT 'eur',
  status               TEXT NOT NULL DEFAULT 'paid'
                       CHECK(status IN ('pending','paid','failed','refunded')),
  paid_at              TEXT,
  created_at           TEXT NOT NULL DEFAULT (datetime('now')),
  metadata             TEXT
);

CREATE INDEX IF NOT EXISTS idx_payments_pass     ON payments(pass_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(payment_provider, provider_payment_id);

-- ── Colonnes supplémentaires dans reservations ────────────────────────────────
-- NOTE : SQLite ne supporte pas "ADD COLUMN IF NOT EXISTS". Si la colonne existe
-- déjà (migration déjà appliquée), ces deux lignes échoueront avec
-- "duplicate column name" — c'est sans conséquence, on peut ignorer l'erreur.
-- payment_type : 'single_payment' | 'pass_included' | 'free'
ALTER TABLE reservations ADD COLUMN pass_id INTEGER REFERENCES gaming_passes(id);
ALTER TABLE reservations ADD COLUMN payment_type TEXT DEFAULT 'single_payment';

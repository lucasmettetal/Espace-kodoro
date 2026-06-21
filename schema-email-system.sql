-- Migration : système d'emails marketing (contacts, abonnements, campagnes, logs)
-- À appliquer UNE SEULE FOIS sur chaque base (locale et remote).
--
--   Local  : sqlite3 <chemin-db> < schema-email-system.sql
--   Remote : npx wrangler d1 execute kodoro-db --remote --file=schema-email-system.sql

-- ── Contacts ──────────────────────────────────────────────────────────────────
-- Un contact = une personne (peut exister sans réservation Stripe)
CREATE TABLE IF NOT EXISTS contacts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  email        TEXT    NOT NULL UNIQUE,
  first_name   TEXT,
  last_name    TEXT,
  phone        TEXT,
  source       TEXT,             -- 'reservation', 'manual', etc.
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Abonnements aux listes ────────────────────────────────────────────────────
-- list_name : 'gaming', 'evenements', 'yoga', 'kodoro_general'
-- status    : 'subscribed' | 'unsubscribed'
CREATE TABLE IF NOT EXISTS contact_subscriptions (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id        INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  list_name         TEXT    NOT NULL,
  status            TEXT    NOT NULL DEFAULT 'subscribed'
                    CHECK(status IN ('subscribed', 'unsubscribed')),
  unsubscribe_token TEXT    NOT NULL UNIQUE,   -- UUID aléatoire, utilisé dans le lien de désinscription
  subscribed_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  unsubscribed_at   TEXT,
  UNIQUE(contact_id, list_name)
);

-- ── Campagnes email ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_campaigns (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  list_name    TEXT    NOT NULL,
  subject      TEXT    NOT NULL,
  html_content TEXT    NOT NULL,
  sender_email TEXT    NOT NULL,
  sender_name  TEXT    NOT NULL DEFAULT 'Espace Ködörö',
  created_by   INTEGER REFERENCES organizers(id),
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  sent_at      TEXT                              -- NULL = pas encore envoyée
);

-- ── Logs d'envoi ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_logs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id     INTEGER NOT NULL REFERENCES email_campaigns(id),
  contact_id      INTEGER REFERENCES contacts(id),
  email           TEXT    NOT NULL,
  status          TEXT    NOT NULL DEFAULT 'pending'
                  CHECK(status IN ('pending', 'sent', 'failed')),
  resend_email_id TEXT,
  error           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Colonne newsletter_consent dans reservations ──────────────────────────────
ALTER TABLE reservations ADD COLUMN newsletter_consent INTEGER NOT NULL DEFAULT 0;

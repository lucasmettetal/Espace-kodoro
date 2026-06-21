-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : système de réservations avec Stripe Checkout
-- Appliquer UNE SEULE FOIS après schema.sql
--
-- Commandes :
--   Local  → npx wrangler d1 execute kodoro-db --local  --file=schema-reservations.sql
--   Remote → npx wrangler d1 execute kodoro-db --remote --file=schema-reservations.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Nouvelles colonnes sur la table events ─────────────────────────────────
-- Ces colonnes structurent les données pour le système de réservation.
-- Les anciennes colonnes (date, day, year, price) sont conservées pour le dashboard.

ALTER TABLE events ADD COLUMN slug         TEXT;              -- ex: 'gaming-26-juin-2026'
ALTER TABLE events ADD COLUMN event_date   TEXT;              -- ISO : '2026-06-26'
ALTER TABLE events ADD COLUMN start_time   TEXT;              -- '20:00'
ALTER TABLE events ADD COLUMN end_time     TEXT;              -- '23:00'
ALTER TABLE events ADD COLUMN price_cents  INTEGER;           -- 500 = 5,00 €
ALTER TABLE events ADD COLUMN location     TEXT;              -- lieu libre

-- Index unique sur le slug pour éviter les doublons et permettre les lookups rapides
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_slug
  ON events(slug) WHERE slug IS NOT NULL;

-- ── 2. Table reservations ─────────────────────────────────────────────────────
-- Une ligne = une réservation (peut couvrir plusieurs places).
-- status : pending → paid   (via webhook Stripe)
--          pending → cancelled (expiration ou annulation)
--          paid    → refunded  (si remboursement futur)

CREATE TABLE IF NOT EXISTS reservations (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id               INTEGER NOT NULL REFERENCES events(id) ON DELETE RESTRICT,

  -- Coordonnées du réservant
  customer_name          TEXT    NOT NULL,
  email                  TEXT    NOT NULL COLLATE NOCASE,
  phone                  TEXT,

  -- Réservation
  quantity               INTEGER NOT NULL DEFAULT 1
                           CHECK(quantity >= 1 AND quantity <= 10),
  status                 TEXT    NOT NULL DEFAULT 'pending'
                           CHECK(status IN ('pending', 'paid', 'cancelled', 'refunded')),

  -- Stripe
  stripe_session_id      TEXT    UNIQUE,   -- UNIQUE : une session = une réservation
  stripe_payment_intent  TEXT,
  amount_cents           INTEGER,          -- montant réellement encaissé

  -- Tracking sources
  utm_source             TEXT,             -- 'meta', 'whatsapp', 'email', 'qr'
  utm_medium             TEXT,             -- 'paid', 'message', 'newsletter', 'print'
  utm_campaign           TEXT,             -- 'gaming_26_juin'

  -- Commentaire libre du formulaire
  comment                TEXT,

  -- Expiration des pending (30 min) — évite le blocage indéfini des places
  expires_at             TEXT,

  created_at             TEXT DEFAULT (datetime('now')),
  updated_at             TEXT DEFAULT (datetime('now'))
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_reservations_event_status
  ON reservations(event_id, status);

CREATE INDEX IF NOT EXISTS idx_reservations_stripe_session
  ON reservations(stripe_session_id);

-- ── 3. Table participants ─────────────────────────────────────────────────────
-- Un participant par ligne. Lié à une réservation.
-- Si quantity = 3, la réservation aura 3 lignes participants.

CREATE TABLE IF NOT EXISTS participants (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  reservation_id   INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  full_name        TEXT    NOT NULL,
  is_minor         INTEGER NOT NULL DEFAULT 0,  -- 0 = adulte, 1 = mineur
  age              INTEGER CHECK(age IS NULL OR (age > 0 AND age < 100)),
  created_at       TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_participants_reservation
  ON participants(reservation_id);

-- ── 4. Table equipment_offers ─────────────────────────────────────────────────
-- Matériel apporté par les participants. Une ligne par type.
-- equipment_type : 'console', 'pc', 'ecran', 'manettes', 'jeux', 'autre'

CREATE TABLE IF NOT EXISTS equipment_offers (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  reservation_id   INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  equipment_type   TEXT    NOT NULL,
  description      TEXT,
  created_at       TEXT    DEFAULT (datetime('now'))
);

-- ── 5. Insertion de l'événement gaming initial ────────────────────────────────
-- INSERT OR IGNORE : ne recrée pas l'événement s'il existe déjà (grâce au UNIQUE sur slug).
-- Adaptez les valeurs si nécessaire avant de lancer la migration.

INSERT OR IGNORE INTO events (
  title,          date,       day,        year,
  type,           description,
  price,          spots_total, spots_taken,
  slug,           event_date,  start_time,  end_time,
  price_cents,    location,    active
) VALUES (
  'Soirée Gaming à Caussade',
  '26 juin',  'Vendredi',  '2026',
  'gaming',
  'Soirée gaming conviviale ouverte à tous les niveaux : consoles, PC, rétro gaming et jeux multijoueurs.',
  '5 €',      30,           0,
  'gaming-26-juin-2026',  '2026-06-26',  '20:00',  '23:00',
  500,
  'Espace Ködörö — Caussade',
  1
);

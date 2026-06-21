-- Migration : ajout des champs UTM étendus + referrer + landing_page
-- SQLite ne supporte pas IF NOT EXISTS sur ALTER TABLE, on utilise des blocs séparés.
-- Ce script est idempotent : si les colonnes existent déjà, SQLite retourne une erreur
-- ignorée (IGNORE dans wrangler d1 execute, ou catch en code).
-- À appliquer UNE SEULE FOIS sur chaque base (locale et remote).
--
--   Local  : sqlite3 <chemin-db> < schema-utm-extended.sql
--   Remote : npx wrangler d1 execute kodoro-db --remote --file=schema-utm-extended.sql

ALTER TABLE reservations ADD COLUMN utm_content  TEXT;
ALTER TABLE reservations ADD COLUMN utm_term     TEXT;
ALTER TABLE reservations ADD COLUMN referrer     TEXT;
ALTER TABLE reservations ADD COLUMN landing_page TEXT;

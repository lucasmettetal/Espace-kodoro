-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : corrections de sécurité (race condition first_visit / pass)
-- Appliquer UNE SEULE FOIS après schema-gaming-passes.sql
--
-- Commandes :
--   Local  → npx wrangler d1 execute kodoro-db --local  --file=schema-security-fixes.sql
--   Remote → npx wrangler d1 execute kodoro-db --remote --file=schema-security-fixes.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Contrainte UNIQUE partielle pour les réservations "première visite" ───────
-- Empêche deux réservations first_visit pour le même email et le même événement,
-- même en cas de requêtes simultanées (double-clic, script).
-- SQLite supporte les index uniques partiels via WHERE.
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_first_visit_unique
  ON reservations(email, event_id)
  WHERE payment_type = 'first_visit' AND status = 'paid';

-- ── Contrainte UNIQUE partielle pour les réservations couvertes par un pass ───
-- Empêche la même logique de race condition pour le chemin "pass_included".
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_pass_unique
  ON reservations(email, event_id, pass_id)
  WHERE payment_type = 'pass_included' AND status = 'paid';

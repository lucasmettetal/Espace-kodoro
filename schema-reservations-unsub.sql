-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : abonnements "reservations" pour les contacts existants
-- Crée un contact_subscription list_name='reservations' pour chaque contact
-- ayant au moins une réservation payée, s'il n'en a pas déjà un.
--
-- Commandes :
--   Local  → npx wrangler d1 execute kodoro-db --local  --file=schema-reservations-unsub.sql
--   Remote → npx wrangler d1 execute kodoro-db --remote --file=schema-reservations-unsub.sql
-- ─────────────────────────────────────────────────────────────────────────────

INSERT OR IGNORE INTO contact_subscriptions (contact_id, list_name, status, unsubscribe_token)
SELECT DISTINCT
  c.id,
  'reservations',
  'subscribed',
  lower(hex(randomblob(16)))
FROM contacts c
JOIN reservations r ON lower(r.email) = lower(c.email)
WHERE r.status = 'paid'
  AND c.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM contact_subscriptions cs
    WHERE cs.contact_id = c.id AND cs.list_name = 'reservations'
  );

-- Migration : ajout du device_token pour la détection première visite multi-facteur
-- À appliquer via le dashboard D1 de Cloudflare (onglet Console)

ALTER TABLE reservations ADD COLUMN device_token TEXT;

CREATE INDEX IF NOT EXISTS idx_reservations_device_token
  ON reservations(device_token)
  WHERE device_token IS NOT NULL;

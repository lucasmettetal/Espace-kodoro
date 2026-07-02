-- Migration : renommer l'ancien événement gaming en "Le Lobby" et l'archiver
-- À appliquer via : wrangler d1 execute kodoro-db --file=schema-le-lobby.sql --remote
--
-- Cette migration :
--   1. Renomme l'événement "gaming-26-juin-2026" en "Le Lobby" (cohérence historique)
--   2. L'archive (active=0) — il est déjà passé
-- La prochaine date (10 juillet 2026) sera créée automatiquement par l'API
-- lors du premier appel à /api/event-availability?type=gaming

UPDATE events
SET    title  = 'Le Lobby',
       active = 0
WHERE  slug   = 'gaming-26-juin-2026';

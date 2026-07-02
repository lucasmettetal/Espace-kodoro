// GET /api/event-availability?slug=<slug>   → disponibilité par slug
// GET /api/event-availability?id=<id>       → disponibilité par id
// GET /api/event-availability?type=gaming   → prochain "Le Lobby" avec rotation automatique
//
// Logique de comptage des places occupées :
//   - réservations status='paid'   : comptées
//   - réservations status='pending' AND expires_at > now : comptées
//   - réservations status='pending' expirées / cancelled / refunded : ignorées

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const MOIS  = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const JOURS = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];

// Date base du calendrier Le Lobby (premier vendredi, UTC)
const LOBBY_BASE_ISO = '2026-07-10';

// Calcule la prochaine date bi-hebdomadaire (vendredi sur deux) >= aujourd'hui (UTC)
function calcNextLobbyDate() {
  const BASE        = new Date(LOBBY_BASE_ISO + 'T00:00:00Z');
  const TWO_WEEKS   = 14 * 24 * 60 * 60 * 1000;
  const now         = new Date();
  const todayUTC    = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  if (BASE >= todayUTC) return LOBBY_BASE_ISO;

  const diff    = todayUTC.getTime() - BASE.getTime();
  const periods = Math.ceil(diff / TWO_WEEKS);
  return new Date(BASE.getTime() + periods * TWO_WEEKS).toISOString().slice(0, 10);
}

// Formate une date ISO (YYYY-MM-DD) en "Vendredi 10 juillet 2026" (UTC)
function formatFrDate(isoDate) {
  const d   = new Date(isoDate + 'T12:00:00Z');
  const jour = JOURS[d.getUTCDay()];
  return `${jour.charAt(0).toUpperCase() + jour.slice(1)} ${d.getUTCDate()} ${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// Retourne le prochain événement gaming actif — le crée automatiquement si aucun futur n'existe
async function getOrCreateGamingEvent(env) {
  // 1. Chercher un événement gaming futur actif
  const existing = await env.DB.prepare(`
    SELECT * FROM events
    WHERE type = 'gaming' AND active = 1 AND event_date >= date('now')
    ORDER BY event_date ASC LIMIT 1
  `).first();

  if (existing) return existing;

  // 2. Aucun futur → archiver tous les événements gaming passés
  await env.DB.prepare(`
    UPDATE events SET active = 0 WHERE type = 'gaming'
  `).run();

  // 3. Calculer la prochaine date et créer l'événement "Le Lobby"
  const nextDate = calcNextLobbyDate();
  const slug     = `le-lobby-${nextDate}`;
  const d        = new Date(nextDate + 'T12:00:00Z');
  const jourCap  = JOURS[d.getUTCDay()].charAt(0).toUpperCase() + JOURS[d.getUTCDay()].slice(1);

  // Vérifier que le slug n'existe pas déjà (race condition improbable mais prudent)
  const bySlug = await env.DB.prepare('SELECT * FROM events WHERE slug = ?').bind(slug).first();
  if (bySlug) {
    // L'événement existe mais était inactif — réactiver
    await env.DB.prepare('UPDATE events SET active = 1 WHERE slug = ?').bind(slug).run();
    return await env.DB.prepare('SELECT * FROM events WHERE slug = ?').bind(slug).first();
  }

  await env.DB.prepare(`
    INSERT INTO events
      (title, date, day, year, type, description, price,
       spots_total, spots_taken, slug, event_date,
       start_time, end_time, price_cents, location, active)
    VALUES (?, ?, ?, ?, 'gaming', ?, '5 €', 30, 0, ?, ?, '20:00', '23:00', 500, 'Espace Ködörö — Caussade', 1)
  `).bind(
    'Le Lobby',
    formatFrDate(nextDate),
    jourCap,
    String(d.getUTCFullYear()),
    'Soirée gaming bi-mensuelle — un vendredi sur deux',
    slug,
    nextDate,
  ).run();

  return await env.DB.prepare('SELECT * FROM events WHERE slug = ?').bind(slug).first();
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors });
}

export async function onRequestGet({ request, env }) {
  const url  = new URL(request.url);
  const slug = url.searchParams.get('slug');
  const id   = url.searchParams.get('id');
  const type = url.searchParams.get('type');

  try {
    let event;

    if (type === 'gaming') {
      // Rotation automatique Le Lobby
      event = await getOrCreateGamingEvent(env);
    } else if (slug) {
      event = await env.DB.prepare('SELECT * FROM events WHERE slug = ? AND active = 1').bind(slug).first();
    } else if (id) {
      event = await env.DB.prepare('SELECT * FROM events WHERE id = ? AND active = 1').bind(id).first();
    } else {
      return Response.json({ error: 'Paramètre slug, id ou type=gaming requis' }, { status: 400, headers: cors });
    }

    if (!event) {
      return Response.json({ error: 'Événement non trouvé ou inactif' }, { status: 404, headers: cors });
    }

    // Compter les places occupées (paid + pending non expirées)
    const result = await env.DB.prepare(`
      SELECT COALESCE(SUM(quantity), 0) AS occupied
      FROM reservations
      WHERE event_id = ?
        AND (
          status = 'paid'
          OR (status = 'pending' AND datetime(expires_at) > datetime('now'))
        )
    `).bind(event.id).first();

    const occupied  = Number(result?.occupied ?? 0);
    const maxPlaces = event.spots_total ?? 30;
    const available = Math.max(0, maxPlaces - occupied);

    return Response.json({
      event_id:    event.id,
      title:       event.title,
      event_date:  event.event_date ?? event.date,
      start_time:  event.start_time,
      end_time:    event.end_time,
      location:    event.location ?? event.description,
      price_cents: event.price_cents ?? 500,
      max_places:  maxPlaces,
      occupied,
      available,
      is_open:     event.active === 1 && available > 0,
    }, { headers: cors });

  } catch (err) {
    console.error('[event-availability]', err);
    return Response.json({ error: 'Erreur serveur' }, { status: 500, headers: cors });
  }
}

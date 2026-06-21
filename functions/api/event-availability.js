// GET /api/event-availability?slug=gaming-26-juin-2026
// Retourne les places disponibles pour un événement.
// Appelé par le frontend au chargement de la page de réservation.
//
// Logique de comptage des places occupées :
//   - réservations status='paid' : comptées
//   - réservations status='pending' ET expires_at > maintenant : comptées (place temporairement bloquée)
//   - réservations status='pending' expirées : ignorées (place libérée)
//   - réservations status='cancelled' ou 'refunded' : ignorées

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');
  const id   = url.searchParams.get('id');

  if (!slug && !id) {
    return Response.json({ error: 'Paramètre slug ou id requis' }, { status: 400, headers: cors });
  }

  try {
    // Récupérer l'événement
    const event = slug
      ? await env.DB.prepare('SELECT * FROM events WHERE slug = ? AND active = 1').bind(slug).first()
      : await env.DB.prepare('SELECT * FROM events WHERE id = ? AND active = 1').bind(id).first();

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
      event_id:   event.id,
      title:      event.title,
      event_date: event.event_date ?? event.date,
      start_time: event.start_time,
      end_time:   event.end_time,
      location:   event.location ?? event.description,
      price_cents: event.price_cents ?? 500,
      max_places: maxPlaces,
      occupied,
      available,
      is_open:    event.active === 1 && available > 0,
    }, { headers: cors });

  } catch (err) {
    console.error('[event-availability]', err);
    return Response.json({ error: 'Erreur serveur' }, { status: 500, headers: cors });
  }
}

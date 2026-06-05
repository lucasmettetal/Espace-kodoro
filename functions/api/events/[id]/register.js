const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors });
}

export async function onRequestPost({ params, request, env }) {
  const eventId = params.id;

  const event = await env.DB.prepare(
    'SELECT * FROM events WHERE id = ? AND active = 1'
  ).bind(eventId).first();

  if (!event) {
    return Response.json({ error: 'Événement introuvable' }, { status: 404, headers: cors });
  }

  if (event.spots_total > 0 && event.spots_taken >= event.spots_total) {
    return Response.json({ error: 'Plus de places disponibles' }, { status: 400, headers: cors });
  }

  const body = await request.json();
  const { name, email, phone } = body;

  if (!name || !email) {
    return Response.json({ error: 'Nom et email requis' }, { status: 400, headers: cors });
  }

  await env.DB.prepare(
    'INSERT INTO registrations (event_id, name, email, phone) VALUES (?, ?, ?, ?)'
  ).bind(eventId, name, email, phone ?? null).run();

  if (event.spots_total > 0) {
    await env.DB.prepare(
      'UPDATE events SET spots_taken = spots_taken + 1 WHERE id = ?'
    ).bind(eventId).run();
  }

  return Response.json({ success: true, message: 'Inscription enregistrée !' }, { headers: cors });
}

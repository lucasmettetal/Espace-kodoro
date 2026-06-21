// PATCH /api/organizer/reservations/:id  → modifier une réservation
// DELETE /api/organizer/reservations/:id → supprimer une réservation

import { requireAuth } from '../../_auth.js';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors });
}

export async function onRequestPatch({ request, env, params }) {
  const payload = await requireAuth(request, env);
  if (!payload) return Response.json({ error: 'Non autorisé' }, { status: 401, headers: cors });

  const id = parseInt(params.id);
  if (!id) return Response.json({ error: 'ID invalide' }, { status: 400, headers: cors });

  const { customer_name, email, phone, quantity, amount_cents, status, comment, participants } = await request.json();

  try {
    // Mettre à jour la réservation
    await env.DB.prepare(`
      UPDATE reservations
      SET customer_name = ?, email = ?, phone = ?, quantity = ?,
          amount_cents = ?, status = ?, comment = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      customer_name,
      email?.toLowerCase(),
      phone ?? null,
      quantity,
      amount_cents ?? null,
      status ?? 'paid',
      comment ?? null,
      id,
    ).run();

    // Remplacer les participants si fournis
    if (participants !== undefined) {
      await env.DB.prepare('DELETE FROM participants WHERE reservation_id = ?').bind(id).run();
      if (participants.length > 0) {
        const stmts = participants
          .filter(p => p.full_name?.trim())
          .map(p =>
            env.DB.prepare('INSERT INTO participants (reservation_id, full_name, is_minor, age) VALUES (?, ?, ?, ?)')
              .bind(id, p.full_name, p.is_minor ? 1 : 0, p.age ?? null)
          );
        if (stmts.length) await env.DB.batch(stmts);
      }
    }

    return Response.json({ success: true }, { headers: cors });
  } catch (err) {
    console.error('[reservations PATCH]', err);
    return Response.json({ error: 'Erreur serveur' }, { status: 500, headers: cors });
  }
}

export async function onRequestDelete({ request, env, params }) {
  const payload = await requireAuth(request, env);
  if (!payload) return Response.json({ error: 'Non autorisé' }, { status: 401, headers: cors });

  const id = parseInt(params.id);
  if (!id) return Response.json({ error: 'ID invalide' }, { status: 400, headers: cors });

  try {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM participants WHERE reservation_id = ?').bind(id),
      env.DB.prepare('DELETE FROM equipment_offers WHERE reservation_id = ?').bind(id),
      env.DB.prepare('DELETE FROM reservations WHERE id = ?').bind(id),
    ]);
    return Response.json({ success: true }, { headers: cors });
  } catch (err) {
    console.error('[reservations DELETE]', err);
    return Response.json({ error: 'Erreur serveur' }, { status: 500, headers: cors });
  }
}

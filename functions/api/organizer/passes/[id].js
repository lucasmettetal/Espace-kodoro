// PATCH  /api/organizer/passes/:id  → modifier status, notes, expires_at
// DELETE /api/organizer/passes/:id  → annuler (status='cancelled')

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

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Corps de requête invalide' }, { status: 400, headers: cors });
  }

  const sets = [];
  const binds = [];

  if (body.status !== undefined) {
    if (!['active', 'expired', 'cancelled'].includes(body.status)) {
      return Response.json({ error: 'Statut invalide' }, { status: 400, headers: cors });
    }
    sets.push('status = ?');
    binds.push(body.status);
  }
  if (body.notes !== undefined) {
    sets.push('notes = ?');
    binds.push((body.notes ?? '').trim() || null);
  }
  if (body.expires_at !== undefined && body.expires_at) {
    const raw = String(body.expires_at).trim();
    const d = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00`) : new Date(raw);
    if (isNaN(d.getTime())) return Response.json({ error: 'Date invalide' }, { status: 400, headers: cors });
    sets.push('expires_at = ?');
    binds.push(d.toISOString().slice(0, 19).replace('T', ' '));
  }

  if (sets.length === 0) {
    return Response.json({ error: 'Aucune modification fournie' }, { status: 400, headers: cors });
  }

  sets.push("updated_at = datetime('now')");
  binds.push(id);

  try {
    await env.DB.prepare(`UPDATE gaming_passes SET ${sets.join(', ')} WHERE id = ?`).bind(...binds).run();
    return Response.json({ success: true }, { headers: cors });
  } catch (err) {
    console.error('[passes PATCH]', err);
    return Response.json({ error: 'Erreur serveur' }, { status: 500, headers: cors });
  }
}

export async function onRequestDelete({ request, env, params }) {
  const payload = await requireAuth(request, env);
  if (!payload) return Response.json({ error: 'Non autorisé' }, { status: 401, headers: cors });

  const id = parseInt(params.id);
  if (!id) return Response.json({ error: 'ID invalide' }, { status: 400, headers: cors });

  try {
    await env.DB.prepare(
      "UPDATE gaming_passes SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?"
    ).bind(id).run();
    return Response.json({ success: true }, { headers: cors });
  } catch (err) {
    console.error('[passes DELETE]', err);
    return Response.json({ error: 'Erreur serveur' }, { status: 500, headers: cors });
  }
}

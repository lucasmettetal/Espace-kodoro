// GET /api/check-pass?email=...
// Vérifie publiquement si une adresse email possède un Pass Gaming actif.
// Ne retourne que les informations strictement nécessaires.

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const email = (url.searchParams.get('email') ?? '').trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ has_pass: false, pass: null }, { headers: cors });
  }

  try {
    const pass = await env.DB.prepare(`
      SELECT gp.id, gp.expires_at, gp.pass_type
      FROM gaming_passes gp
      JOIN contacts c ON c.id = gp.contact_id
      WHERE c.email = ?
        AND gp.status = 'active'
        AND gp.starts_at <= datetime('now')
        AND gp.expires_at >= datetime('now')
      ORDER BY gp.expires_at DESC
      LIMIT 1
    `).bind(email).first();

    if (pass) {
      return Response.json({
        has_pass: true,
        pass: { id: pass.id, expires_at: pass.expires_at, pass_type: pass.pass_type },
      }, { headers: cors });
    }

    return Response.json({ has_pass: false, pass: null }, { headers: cors });
  } catch (err) {
    console.error('[check-pass]', err);
    return Response.json({ has_pass: false, pass: null }, { headers: cors });
  }
}

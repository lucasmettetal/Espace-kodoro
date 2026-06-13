import { requireAuth } from './_auth.js';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Valeurs par défaut si la DB ne contient pas encore la clé
export const DEFAULT_CONFIG = {
  gaming_date: '',
  gaming_horaire: '20h – 23h',
  gaming_lieu: 'Espace Ködörö — Caussade',
  gaming_places: '30',
  gaming_prix: '5 €',
  gaming_stripe_link: '',
  gaming_whatsapp_link: '',
  yoga_date: '',
  yoga_horaire: '',
  yoga_lieu: 'Espace Ködörö — Caussade',
  yoga_tarif: '',
  yoga_contact: 'espacekodoro@gmail.com',
  yoga_niveau: 'Tous niveaux — débutants bienvenus',
  yoga_materiel: 'Tapis de yoga conseillé (quelques tapis disponibles sur place)',
  yoga_inscrip: "Inscription recommandée — contacter via l'email ci-dessous",
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors });
}

// GET /api/config — public, renvoie toute la config
export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare('SELECT key, value FROM site_config').all();
    const config = { ...DEFAULT_CONFIG };
    for (const row of results) {
      if (row.key in config) config[row.key] = row.value;
    }
    return Response.json(config, { headers: cors });
  } catch {
    // Si la table n'existe pas encore, renvoyer les défauts
    return Response.json(DEFAULT_CONFIG, { headers: cors });
  }
}

// PUT /api/config — organisateurs authentifiés seulement
export async function onRequestPut({ request, env }) {
  const payload = await requireAuth(request, env);
  if (!payload) {
    return Response.json({ error: 'Non autorisé' }, { status: 401, headers: cors });
  }

  const updates = await request.json();
  const validKeys = Object.keys(DEFAULT_CONFIG);

  const stmt = env.DB.prepare(
    `INSERT INTO site_config (key, value, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  );

  const batch = [];
  for (const [key, value] of Object.entries(updates)) {
    if (validKeys.includes(key)) {
      batch.push(stmt.bind(key, String(value ?? '')));
    }
  }

  if (batch.length > 0) await env.DB.batch(batch);

  return Response.json({ success: true }, { headers: cors });
}

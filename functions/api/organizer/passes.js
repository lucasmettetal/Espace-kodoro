// GET  /api/organizer/passes  → liste des pass + stats
// POST /api/organizer/passes  → créer un pass manuellement (liquide)

import { requireAuth } from '../_auth.js';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const PASS_AMOUNT_CENTS = 2000; // 20 €

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors });
}

// ── Email de confirmation Pass (création manuelle) ────────────────────────────
async function sendPassConfirmationEmail(env, { to, customerName, expiresAt }) {
  if (!env.RESEND_API_KEY) return;
  const siteUrl = (env.SITE_URL ?? 'https://www.espace-kodoro.fr').replace(/\/$/, '');
  const from = env.EMAIL_FROM ?? 'Espace Ködörö <reservations@espace-kodoro.fr>';
  const expiresFormatted = new Date(expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
  <body style="margin:0;padding:0;background:#f0ebe3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ebe3;padding:32px 16px;">
    <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;">
      <tr><td style="background:#3d1f1f;padding:28px 40px;text-align:center;">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.45);">Espace Ködörö · Caussade</p>
        <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">Votre Pass Gaming est actif 🎮</p>
      </td></tr>
      <tr><td style="background:#c9a700;height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td style="padding:36px 40px;">
        <p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.75;">Bonjour ${customerName},</p>
        <p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.75;">Votre <strong>Pass Gaming Trimestre</strong> est maintenant actif. Il vous permet de participer aux soirées gaming classiques de l'Espace Ködörö pendant 3 mois.</p>
        <table style="background:#fbf7ef;border:1px solid #e8e0d5;width:100%;margin-bottom:20px;" cellpadding="0" cellspacing="0">
          <tr><td style="padding:16px 20px;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#c9a700;">Détails du pass</p>
            <p style="margin:0 0 4px;font-size:14px;color:#5f3636;"><strong>Type :</strong> Pass Gaming Trimestre</p>
            <p style="margin:0 0 4px;font-size:14px;color:#5f3636;"><strong>Valable jusqu'au :</strong> ${expiresFormatted}</p>
            <p style="margin:0;font-size:14px;color:#5f3636;"><strong>Montant payé :</strong> 20 €</p>
          </td></tr>
        </table>
        <p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.75;">Pensez simplement à <strong>réserver votre place</strong> pour chaque soirée afin que nous puissions organiser la salle et le matériel.</p>
        <p style="margin:0;color:#333;font-size:15px;line-height:1.75;">À bientôt,<br><strong style="color:#5f3636;">Lucas — Espace Ködörö</strong></p>
      </td></tr>
      <tr><td style="background:#f7f3ed;padding:20px 40px;text-align:center;border-top:1px solid #e8e0d5;">
        <p style="margin:0;font-size:12px;color:#999;">Espace Ködörö · 25 boulevard Didier Rey · 82300 Caussade</p>
        <p style="margin:4px 0 0;font-size:12px;color:#999;"><a href="${siteUrl}" style="color:#999;">espace-kodoro.fr</a></p>
      </td></tr>
    </table></td></tr>
  </table></body></html>`;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject: 'Votre Pass Gaming est actif 🎮', html }),
    });
  } catch (err) {
    console.error('[organizer/passes] sendPassConfirmationEmail:', err);
  }
}

// ── GET : liste + stats ───────────────────────────────────────────────────────
export async function onRequestGet({ request, env }) {
  const payload = await requireAuth(request, env);
  if (!payload) return Response.json({ error: 'Non autorisé' }, { status: 401, headers: cors });

  try {
    const { results: passes } = await env.DB.prepare(`
      SELECT gp.*, c.email, c.first_name, c.last_name, c.phone,
        p.payment_provider, p.amount, p.paid_at,
        CAST((julianday(gp.expires_at) - julianday('now')) AS INTEGER) AS days_remaining
      FROM gaming_passes gp
      JOIN contacts c ON c.id = gp.contact_id
      LEFT JOIN payments p ON p.pass_id = gp.id AND p.status = 'paid'
      ORDER BY gp.created_at DESC
    `).all();

    const stats = await env.DB.prepare(`
      SELECT
        SUM(CASE WHEN status='active' AND expires_at >= datetime('now') THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status='expired' OR (status='active' AND expires_at < datetime('now')) THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN status='active' AND expires_at >= datetime('now') AND julianday(expires_at) - julianday('now') <= 7 THEN 1 ELSE 0 END) as expiring_7,
        SUM(CASE WHEN status='active' AND expires_at >= datetime('now') AND julianday(expires_at) - julianday('now') <= 30 THEN 1 ELSE 0 END) as expiring_30
      FROM gaming_passes
    `).first();

    const revenue = await env.DB.prepare(`
      SELECT
        SUM(CASE WHEN payment_provider='stripe' AND status='paid'
              AND strftime('%Y-%m', COALESCE(paid_at, created_at)) = strftime('%Y-%m','now')
              THEN amount ELSE 0 END) as revenue_stripe_month,
        SUM(CASE WHEN payment_provider IN ('cash','manual') AND status='paid'
              AND strftime('%Y-%m', COALESCE(paid_at, created_at)) = strftime('%Y-%m','now')
              THEN amount ELSE 0 END) as revenue_cash_month
      FROM payments
      WHERE pass_id IS NOT NULL
    `).first();

    return Response.json({
      passes: passes ?? [],
      stats: {
        active:     Number(stats?.active ?? 0),
        expired:    Number(stats?.expired ?? 0),
        expiring_7: Number(stats?.expiring_7 ?? 0),
        expiring_30: Number(stats?.expiring_30 ?? 0),
        revenue_stripe_month: Number(revenue?.revenue_stripe_month ?? 0),
        revenue_cash_month:   Number(revenue?.revenue_cash_month ?? 0),
      },
    }, { headers: cors });
  } catch (err) {
    console.error('[organizer/passes GET]', err);
    return Response.json({ error: 'Erreur serveur' }, { status: 500, headers: cors });
  }
}

// ── POST : création manuelle (liquide) ────────────────────────────────────────
export async function onRequestPost({ request, env }) {
  const payload = await requireAuth(request, env);
  if (!payload) return Response.json({ error: 'Non autorisé' }, { status: 401, headers: cors });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Corps de requête invalide' }, { status: 400, headers: cors });
  }

  const first_name = (body.first_name ?? '').trim();
  const last_name = (body.last_name ?? '').trim();
  const email = (body.email ?? '').trim().toLowerCase();
  const phone = (body.phone ?? '').trim() || null;
  const startsAtRaw = (body.starts_at ?? '').trim();
  const notes = (body.notes ?? '').trim() || null;
  const sendEmail = body.send_email === true;

  if (!first_name || !last_name || !email) {
    return Response.json({ error: 'Prénom, nom et email sont requis' }, { status: 400, headers: cors });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'Adresse email invalide' }, { status: 400, headers: cors });
  }

  // Date de début : YYYY-MM-DD attendu, sinon aujourd'hui
  const startsDate = /^\d{4}-\d{2}-\d{2}$/.test(startsAtRaw) ? new Date(`${startsAtRaw}T00:00:00`) : new Date();
  const expiresDate = new Date(startsDate);
  expiresDate.setMonth(expiresDate.getMonth() + 3);

  const toSql = (d) => d.toISOString().slice(0, 19).replace('T', ' ');
  const startsSql = toSql(startsDate);
  const expiresSql = toSql(expiresDate);

  try {
    // Upsert contact
    await env.DB.prepare(`
      INSERT INTO contacts (email, first_name, last_name, phone, source)
      VALUES (?, ?, ?, ?, 'pass_gaming_manual')
      ON CONFLICT(email) DO UPDATE SET
        first_name = COALESCE(excluded.first_name, first_name),
        last_name  = COALESCE(excluded.last_name,  last_name),
        phone      = COALESCE(excluded.phone,       phone),
        updated_at = datetime('now')
    `).bind(email, first_name, last_name, phone).run();

    const contact = await env.DB.prepare('SELECT id FROM contacts WHERE email = ?').bind(email).first();
    if (!contact) return Response.json({ error: 'Erreur lors de la création du contact' }, { status: 500, headers: cors });

    // Créer le pass
    const passResult = await env.DB.prepare(`
      INSERT INTO gaming_passes (contact_id, pass_type, status, starts_at, expires_at, created_by, notes)
      VALUES (?, 'quarterly', 'active', ?, ?, ?, ?)
    `).bind(contact.id, startsSql, expiresSql, payload.id ?? null, notes).run();

    const passId = passResult.meta.last_row_id;

    // Paiement liquide
    await env.DB.prepare(`
      INSERT INTO payments (contact_id, pass_id, payment_provider, amount, currency, status, paid_at)
      VALUES (?, ?, 'cash', ?, 'eur', 'paid', datetime('now'))
    `).bind(contact.id, passId, PASS_AMOUNT_CENTS).run();

    if (sendEmail && email) {
      await sendPassConfirmationEmail(env, {
        to: email,
        customerName: [first_name, last_name].filter(Boolean).join(' '),
        expiresAt: expiresDate.toISOString(),
      });
    }

    return Response.json({ success: true, pass_id: passId }, { headers: cors });
  } catch (err) {
    console.error('[organizer/passes POST]', err);
    return Response.json({ error: 'Erreur serveur' }, { status: 500, headers: cors });
  }
}

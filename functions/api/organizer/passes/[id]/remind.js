// POST /api/organizer/passes/:id/remind → email de rappel d'expiration

import { requireAuth } from '../../../_auth.js';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors });
}

export async function onRequestPost({ request, env, params }) {
  const payload = await requireAuth(request, env);
  if (!payload) return Response.json({ error: 'Non autorisé' }, { status: 401, headers: cors });

  const id = parseInt(params.id);
  if (!id) return Response.json({ error: 'ID invalide' }, { status: 400, headers: cors });

  try {
    const pass = await env.DB.prepare(`
      SELECT gp.expires_at, c.email, c.first_name, c.last_name
      FROM gaming_passes gp
      JOIN contacts c ON c.id = gp.contact_id
      WHERE gp.id = ?
    `).bind(id).first();

    if (!pass) return Response.json({ error: 'Pass introuvable' }, { status: 404, headers: cors });
    if (!pass.email) return Response.json({ error: 'Pas d\'email pour ce contact' }, { status: 400, headers: cors });
    if (!env.RESEND_API_KEY) return Response.json({ error: 'Service email non configuré' }, { status: 503, headers: cors });

    const siteUrl = (env.SITE_URL ?? 'https://www.espace-kodoro.fr').replace(/\/$/, '');
    const from = env.EMAIL_FROM ?? 'Espace Ködörö <reservations@espace-kodoro.fr>';
    const customerName = [pass.first_name, pass.last_name].filter(Boolean).join(' ') || 'à toi';
    const expiresFormatted = new Date(pass.expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#f0ebe3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ebe3;padding:32px 16px;">
      <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;">
        <tr><td style="background:#3d1f1f;padding:28px 40px;text-align:center;">
          <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.45);">Espace Ködörö · Caussade</p>
          <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">Votre Pass Gaming arrive à expiration</p>
        </td></tr>
        <tr><td style="background:#c9a700;height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.75;">Bonjour ${customerName},</p>
          <p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.75;">Votre <strong>Pass Gaming Trimestre</strong> expire le <strong>${expiresFormatted}</strong>. Pensez à le renouveler pour continuer à profiter des soirées gaming de l'Espace Ködörö.</p>
          <p style="margin:0 0 20px;color:#333;font-size:15px;line-height:1.75;"><a href="${siteUrl}/pass-gaming" style="color:#c9a700;font-weight:600;">→ Renouveler mon Pass Gaming</a></p>
          <p style="margin:0;color:#333;font-size:15px;line-height:1.75;">À bientôt,<br><strong style="color:#5f3636;">Lucas — Espace Ködörö</strong></p>
        </td></tr>
        <tr><td style="background:#f7f3ed;padding:20px 40px;text-align:center;border-top:1px solid #e8e0d5;">
          <p style="margin:0;font-size:12px;color:#999;">Espace Ködörö · 25 boulevard Didier Rey · 82300 Caussade</p>
          <p style="margin:4px 0 0;font-size:12px;color:#999;"><a href="${siteUrl}" style="color:#999;">espace-kodoro.fr</a></p>
        </td></tr>
      </table></td></tr>
    </table></body></html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, reply_to: env.EMAIL_REPLY_TO ?? 'espacekodoro@gmail.com', to: [pass.email], subject: 'Votre Pass Gaming arrive bientôt à expiration', html }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[passes remind] Resend error:', res.status, err);
      return Response.json({ error: 'Échec de l\'envoi du rappel' }, { status: 502, headers: cors });
    }

    return Response.json({ success: true }, { headers: cors });
  } catch (err) {
    console.error('[passes remind]', err);
    return Response.json({ error: 'Erreur serveur' }, { status: 500, headers: cors });
  }
}

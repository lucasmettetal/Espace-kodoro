// POST /api/create-checkout-session
// Reçoit les données du formulaire de réservation, crée :
//   1. Une réservation "pending" en base D1
//   2. Les participants associés
//   3. Le matériel apporté éventuellement
//   4. Une session Stripe Checkout
// Retourne l'URL Stripe vers laquelle rediriger l'utilisateur.
//
// Variables d'environnement nécessaires (Cloudflare Pages > Settings > Variables) :
//   STRIPE_SECRET_KEY  → clé secrète Stripe (sk_test_... ou sk_live_...)
//   SITE_URL           → https://www.espace-kodoro.fr (sans slash final)

import Stripe from 'stripe';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Durée de vie d'une réservation pending avant libération des places (en minutes)
const PENDING_EXPIRY_MINUTES = 30;

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors });
}

// Email de confirmation pour une première visite gratuite
async function sendFirstVisitEmail(env, { to, customerName, quantity, event }) {
  if (!env.RESEND_API_KEY) return;
  const siteUrl = (env.SITE_URL ?? 'https://www.espace-kodoro.fr').replace(/\/$/, '');
  const from = env.EMAIL_FROM ?? 'Espace Ködörö <reservations@espace-kodoro.fr>';
  const eventDate = event.event_date ?? event.date ?? '';
  const horaire = (event.start_time && event.end_time) ? `${event.start_time} – ${event.end_time}` : '';
  const location = event.location ?? 'Espace Ködörö — Caussade';

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
  <body style="margin:0;padding:0;background:#f0ebe3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ebe3;padding:32px 16px;">
    <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;">
      <tr><td style="background:#3d1f1f;padding:28px 40px;text-align:center;">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.45);">Espace Ködörö · Caussade</p>
        <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">Bienvenue à ta première soirée ! 🎮</p>
      </td></tr>
      <tr><td style="background:#c9a700;height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td style="padding:36px 40px;">
        <p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.75;">Bonjour ${customerName},</p>
        <p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.75;">Ta <strong>première soirée gaming</strong> est <strong style="color:#5f3636;">offerte</strong> — tu n'as rien à payer, ta place est réservée !</p>
        <p style="margin:0 0 20px;color:#333;font-size:15px;line-height:1.75;">Viens voir l'ambiance, rencontrer la communauté, et si tu aimes, on espère te revoir !</p>
        <table style="background:#fbf7ef;border:1px solid #e8e0d5;width:100%;margin-bottom:20px;" cellpadding="0" cellspacing="0">
          <tr><td style="padding:16px 20px;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#c9a700;">Détails</p>
            <p style="margin:0 0 4px;font-size:14px;color:#5f3636;"><strong>Événement :</strong> ${event.title ?? 'Soirée Gaming'}</p>
            ${eventDate ? `<p style="margin:0 0 4px;font-size:14px;color:#5f3636;"><strong>Date :</strong> ${eventDate}</p>` : ''}
            ${horaire ? `<p style="margin:0 0 4px;font-size:14px;color:#5f3636;"><strong>Horaire :</strong> ${horaire}</p>` : ''}
            <p style="margin:0 0 4px;font-size:14px;color:#5f3636;"><strong>Lieu :</strong> ${location}</p>
            <p style="margin:0;font-size:14px;color:#5f3636;"><strong>Places :</strong> ${quantity}</p>
          </td></tr>
        </table>
        <p style="margin:0;color:#333;font-size:15px;line-height:1.75;">À bientôt,<br><strong style="color:#5f3636;">Lucas — Espace Ködörö</strong></p>
      </td></tr>
      <tr><td style="background:#f7f3ed;padding:20px 40px;text-align:center;border-top:1px solid #e8e0d5;">
        <p style="margin:0;font-size:12px;color:#999;">Espace Ködörö · 25 boulevard Didier Rey · 82300 Caussade</p>
        <p style="margin:4px 0 0;font-size:12px;color:#999;"><a href="${siteUrl}" style="color:#999;">espace-kodoro.fr</a></p>
      </td></tr>
    </table></td></tr>
  </table></body></html>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, reply_to: env.EMAIL_REPLY_TO ?? 'espacekodoro@gmail.com', to: [to], subject: 'Ta première soirée Gaming est offerte ! — Espace Ködörö', html }),
    });
    if (!res.ok) console.error('[create-checkout] Resend first_visit error:', res.status, await res.text());
  } catch (err) {
    console.error('[create-checkout] sendFirstVisitEmail:', err);
  }
}

// Email de confirmation pour une réservation couverte par un Pass Gaming
async function sendPassReservationEmail(env, { to, customerName, quantity, event, passExpiresAt }) {
  if (!env.RESEND_API_KEY) return;
  const siteUrl = (env.SITE_URL ?? 'https://www.espace-kodoro.fr').replace(/\/$/, '');
  const from = env.EMAIL_FROM ?? 'Espace Ködörö <reservations@espace-kodoro.fr>';
  const eventDate = event.event_date ?? event.date ?? '';
  const horaire = (event.start_time && event.end_time) ? `${event.start_time} – ${event.end_time}` : '';
  const location = event.location ?? 'Espace Ködörö — Caussade';
  const passExpires = passExpiresAt
    ? new Date(passExpiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
  <body style="margin:0;padding:0;background:#f0ebe3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ebe3;padding:32px 16px;">
    <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;">
      <tr><td style="background:#3d1f1f;padding:28px 40px;text-align:center;">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.45);">Espace Ködörö · Caussade</p>
        <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">Réservation confirmée 🎮</p>
      </td></tr>
      <tr><td style="background:#c9a700;height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td style="padding:36px 40px;">
        <p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.75;">Bonjour ${customerName},</p>
        <p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.75;">Votre place est réservée grâce à votre <strong>Pass Gaming</strong> — aucun paiement supplémentaire n'est nécessaire pour cette soirée.</p>
        <table style="background:#fbf7ef;border:1px solid #e8e0d5;width:100%;margin-bottom:20px;" cellpadding="0" cellspacing="0">
          <tr><td style="padding:16px 20px;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#c9a700;">Détails</p>
            <p style="margin:0 0 4px;font-size:14px;color:#5f3636;"><strong>Événement :</strong> ${event.title ?? 'Soirée Gaming'}</p>
            ${eventDate ? `<p style="margin:0 0 4px;font-size:14px;color:#5f3636;"><strong>Date :</strong> ${eventDate}</p>` : ''}
            ${horaire ? `<p style="margin:0 0 4px;font-size:14px;color:#5f3636;"><strong>Horaire :</strong> ${horaire}</p>` : ''}
            <p style="margin:0 0 4px;font-size:14px;color:#5f3636;"><strong>Lieu :</strong> ${location}</p>
            <p style="margin:0 0 4px;font-size:14px;color:#5f3636;"><strong>Places :</strong> ${quantity}</p>
            ${passExpires ? `<p style="margin:0;font-size:14px;color:#5f3636;"><strong>Pass valable jusqu'au :</strong> ${passExpires}</p>` : ''}
          </td></tr>
        </table>
        <p style="margin:0;color:#333;font-size:15px;line-height:1.75;">À bientôt,<br><strong style="color:#5f3636;">Lucas — Espace Ködörö</strong></p>
      </td></tr>
      <tr><td style="background:#f7f3ed;padding:20px 40px;text-align:center;border-top:1px solid #e8e0d5;">
        <p style="margin:0;font-size:12px;color:#999;">Espace Ködörö · 25 boulevard Didier Rey · 82300 Caussade</p>
        <p style="margin:4px 0 0;font-size:12px;color:#999;"><a href="${siteUrl}" style="color:#999;">espace-kodoro.fr</a></p>
      </td></tr>
    </table></td></tr>
  </table></body></html>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, reply_to: env.EMAIL_REPLY_TO ?? 'espacekodoro@gmail.com', to: [to], subject: 'Réservation confirmée — Soirée Gaming · Espace Ködörö', html }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('[create-checkout] Resend pass reservation error:', res.status, err);
    }
  } catch (err) {
    console.error('[create-checkout] sendPassReservationEmail:', err);
  }
}

export async function onRequestPost({ request, env }) {
  // ── 1. Lire et valider le corps de la requête ──────────────────────────────
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Corps de requête invalide' }, { status: 400, headers: cors });
  }

  const {
    event_id,
    customer_name,
    email,
    phone,
    quantity,
    participants = [],
    equipment    = [],
    comment,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    referrer,
    landing_page,
    newsletter_consent = false,
  } = body;

  // Validation des champs obligatoires
  if (!event_id || !customer_name?.trim() || !email?.trim() || !phone?.trim()) {
    return Response.json({ error: 'Champs requis manquants (nom, email, téléphone, événement)' }, { status: 400, headers: cors });
  }

  const qty = parseInt(quantity, 10);
  if (!qty || qty < 1 || qty > 10) {
    return Response.json({ error: 'Nombre de places invalide (1 à 10)' }, { status: 400, headers: cors });
  }

  // Validation basique de l'email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'Adresse email invalide' }, { status: 400, headers: cors });
  }

  // ── 2. Vérifier que l'événement existe et est actif ───────────────────────
  const event = await env.DB
    .prepare('SELECT * FROM events WHERE id = ? AND active = 1')
    .bind(event_id)
    .first();

  if (!event) {
    return Response.json({ error: 'Événement non trouvé ou inactif' }, { status: 404, headers: cors });
  }

  // ── 3. Vérifier la capacité restante ──────────────────────────────────────
  // On compte : les réservations paid + les pending non expirées
  const capacityRow = await env.DB.prepare(`
    SELECT COALESCE(SUM(quantity), 0) AS occupied
    FROM reservations
    WHERE event_id = ?
      AND (
        status = 'paid'
        OR (status = 'pending' AND datetime(expires_at) > datetime('now'))
      )
  `).bind(event_id).first();

  const occupied  = Number(capacityRow?.occupied ?? 0);
  const maxPlaces = event.spots_total ?? 30;

  if (occupied + qty > maxPlaces) {
    const remaining = Math.max(0, maxPlaces - occupied);
    return Response.json(
      { error: remaining === 0
          ? 'Désolé, la soirée est complète.'
          : `Désolé, il ne reste que ${remaining} place${remaining > 1 ? 's' : ''} disponible${remaining > 1 ? 's' : ''}.`
      },
      { status: 409, headers: cors }
    );
  }

  // ── 4bis. Pass Gaming actif ? → réservation gratuite sans Stripe ──────────
  const normalizedEmail = email.trim().toLowerCase();
  let activePass = null;
  try {
    activePass = await env.DB.prepare(`
      SELECT gp.id, gp.expires_at FROM gaming_passes gp
      JOIN contacts c ON c.id = gp.contact_id
      WHERE c.email = ? AND gp.status = 'active'
        AND gp.starts_at <= datetime('now') AND gp.expires_at >= datetime('now')
      ORDER BY gp.expires_at DESC LIMIT 1
    `).bind(normalizedEmail).first();
  } catch (err) {
    console.error('[create-checkout] check pass:', err);
  }

  // ── 4ter. Première visite ? → réservation gratuite ──────────────────────
  if (!activePass) {
    const priorVisit = await env.DB.prepare(
      `SELECT id FROM reservations WHERE email = ? AND status = 'paid' LIMIT 1`
    ).bind(normalizedEmail).first();

    if (!priorVisit) {
      let firstVisitReservationId;
      try {
        // INSERT OR IGNORE : si deux requêtes simultanées arrivent pour le même
        // email + event (race condition), la contrainte UNIQUE partielle
        // idx_reservations_first_visit_unique bloque le doublon silencieusement.
        const result = await env.DB.prepare(`
          INSERT OR IGNORE INTO reservations
            (event_id, customer_name, email, phone, quantity, status,
             amount_cents, utm_source, utm_medium, utm_campaign,
             utm_content, utm_term, referrer, landing_page, comment,
             newsletter_consent, payment_type)
          VALUES (?, ?, ?, ?, ?, 'paid', 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'first_visit')
        `).bind(
          event_id, customer_name.trim(), normalizedEmail, phone.trim(), qty,
          utm_source ?? null, utm_medium ?? null, utm_campaign ?? null,
          utm_content ?? null, utm_term ?? null, referrer ?? null, landing_page ?? null,
          comment?.trim() || null, newsletter_consent ? 1 : 0,
        ).run();
        firstVisitReservationId = result.meta.last_row_id;
        // Si last_row_id est 0, l'INSERT a été ignoré (doublon) — retourner quand même succès
        if (!firstVisitReservationId) {
          const existing = await env.DB.prepare(
            `SELECT id FROM reservations WHERE email = ? AND event_id = ? AND payment_type = 'first_visit' AND status = 'paid' LIMIT 1`
          ).bind(normalizedEmail, event_id).first();
          firstVisitReservationId = existing?.id;
        }
      } catch (err) {
        console.error('[create-checkout] DB insert first_visit reservation:', err);
        return Response.json({ error: 'Erreur lors de la création de la réservation' }, { status: 500, headers: cors });
      }

      if (participants.length > 0) {
        const stmts = participants.filter(p => p?.full_name?.trim()).map(p =>
          env.DB.prepare('INSERT INTO participants (reservation_id, full_name, is_minor, age) VALUES (?, ?, ?, ?)')
            .bind(firstVisitReservationId, p.full_name.trim(), p.is_minor ? 1 : 0, (p.is_minor && p.age) ? parseInt(p.age, 10) : null)
        );
        if (stmts.length > 0) await env.DB.batch(stmts);
      }

      if (equipment.length > 0) {
        const stmts = equipment.filter(e => typeof e === 'string' && e.trim()).map(e =>
          env.DB.prepare('INSERT INTO equipment_offers (reservation_id, equipment_type) VALUES (?, ?)').bind(firstVisitReservationId, e.trim())
        );
        if (stmts.length > 0) await env.DB.batch(stmts);
      }

      await sendFirstVisitEmail(env, { to: normalizedEmail, customerName: customer_name.trim(), quantity: qty, event });

      return Response.json({ first_visit: true, reservation_id: firstVisitReservationId }, { headers: cors });
    }
  }

  if (activePass) {
    let passReservationId;
    try {
      // INSERT OR IGNORE : protège contre la race condition sur le chemin pass_included
      // (contrainte UNIQUE partielle idx_reservations_pass_unique).
      const reservationResult = await env.DB.prepare(`
        INSERT OR IGNORE INTO reservations
          (event_id, customer_name, email, phone, quantity, status,
           amount_cents, utm_source, utm_medium, utm_campaign,
           utm_content, utm_term, referrer, landing_page, comment,
           newsletter_consent, pass_id, payment_type)
        VALUES (?, ?, ?, ?, ?, 'paid', 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pass_included')
      `).bind(
        event_id,
        customer_name.trim(),
        normalizedEmail,
        phone.trim(),
        qty,
        utm_source   ?? null,
        utm_medium   ?? null,
        utm_campaign ?? null,
        utm_content  ?? null,
        utm_term     ?? null,
        referrer     ?? null,
        landing_page ?? null,
        comment?.trim() || null,
        newsletter_consent ? 1 : 0,
        activePass.id,
      ).run();

      passReservationId = reservationResult.meta.last_row_id;
    } catch (err) {
      console.error('[create-checkout] DB insert pass reservation:', err);
      return Response.json({ error: 'Erreur lors de la création de la réservation' }, { status: 500, headers: cors });
    }

    // Participants
    if (participants.length > 0) {
      const participantStmts = participants
        .filter(p => p?.full_name?.trim())
        .map(p =>
          env.DB.prepare(
            'INSERT INTO participants (reservation_id, full_name, is_minor, age) VALUES (?, ?, ?, ?)'
          ).bind(
            passReservationId,
            p.full_name.trim(),
            p.is_minor ? 1 : 0,
            (p.is_minor && p.age) ? parseInt(p.age, 10) : null,
          )
        );
      if (participantStmts.length > 0) await env.DB.batch(participantStmts);
    }

    // Matériel apporté
    if (equipment.length > 0) {
      const equipStmts = equipment
        .filter(e => typeof e === 'string' && e.trim())
        .map(e =>
          env.DB.prepare(
            'INSERT INTO equipment_offers (reservation_id, equipment_type) VALUES (?, ?)'
          ).bind(passReservationId, e.trim())
        );
      if (equipStmts.length > 0) await env.DB.batch(equipStmts);
    }

    // Email de confirmation (réservation incluse dans le pass)
    await sendPassReservationEmail(env, {
      to: normalizedEmail,
      customerName: customer_name.trim(),
      quantity: qty,
      event,
      passExpiresAt: activePass.expires_at,
    });

    return Response.json({ pass_reservation: true, reservation_id: passReservationId }, { headers: cors });
  }

  // ── 4. Calculer le montant ────────────────────────────────────────────────
  // Le prix vient de la base, pas du frontend — l'utilisateur ne peut pas le manipuler.
  const pricePerPerson = event.price_cents ?? 500;
  const totalCents     = pricePerPerson * qty;

  // ── 5. Créer la réservation "pending" en base ─────────────────────────────
  const expiresAt = new Date(Date.now() + PENDING_EXPIRY_MINUTES * 60 * 1000).toISOString();

  let reservationId;
  try {
    const insertResult = await env.DB.prepare(`
      INSERT INTO reservations
        (event_id, customer_name, email, phone, quantity, status,
         amount_cents, utm_source, utm_medium, utm_campaign,
         utm_content, utm_term, referrer, landing_page, comment,
         newsletter_consent, expires_at)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      event_id,
      customer_name.trim(),
      email.trim().toLowerCase(),
      phone.trim(),
      qty,
      totalCents,
      utm_source   ?? null,
      utm_medium   ?? null,
      utm_campaign ?? null,
      utm_content  ?? null,
      utm_term     ?? null,
      referrer     ?? null,
      landing_page ?? null,
      comment?.trim() || null,
      newsletter_consent ? 1 : 0,
      expiresAt,
    ).run();

    reservationId = insertResult.meta.last_row_id;
  } catch (err) {
    console.error('[create-checkout] DB insert reservation:', err);
    return Response.json({ error: 'Erreur lors de la création de la réservation' }, { status: 500, headers: cors });
  }

  // ── 6. Insérer les participants ───────────────────────────────────────────
  if (participants.length > 0) {
    const participantStmts = participants
      .filter(p => p?.full_name?.trim())
      .map(p =>
        env.DB.prepare(
          'INSERT INTO participants (reservation_id, full_name, is_minor, age) VALUES (?, ?, ?, ?)'
        ).bind(
          reservationId,
          p.full_name.trim(),
          p.is_minor ? 1 : 0,
          (p.is_minor && p.age) ? parseInt(p.age, 10) : null,
        )
      );

    if (participantStmts.length > 0) {
      await env.DB.batch(participantStmts);
    }
  }

  // ── 7. Insérer le matériel apporté ────────────────────────────────────────
  if (equipment.length > 0) {
    const equipStmts = equipment
      .filter(e => typeof e === 'string' && e.trim())
      .map(e =>
        env.DB.prepare(
          'INSERT INTO equipment_offers (reservation_id, equipment_type) VALUES (?, ?)'
        ).bind(reservationId, e.trim())
      );

    if (equipStmts.length > 0) {
      await env.DB.batch(equipStmts);
    }
  }

  // ── 8. Créer la session Stripe Checkout ───────────────────────────────────
  const siteUrl = (env.SITE_URL ?? 'https://www.espace-kodoro.fr').replace(/\/$/, '');

  let session;
  try {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' });

    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email.trim().toLowerCase(),
      line_items: [{
        price_data: {
          currency: 'eur',
          unit_amount: pricePerPerson,
          product_data: {
            name: `${event.title}`,
            description: `${qty} place${qty > 1 ? 's' : ''} — ${event.event_date ?? event.date} — ${event.location ?? 'Espace Ködörö, Caussade'}`,
          },
        },
        quantity: qty,
      }],
      metadata: {
        reservation_id: String(reservationId),
        event_id:       String(event_id),
        quantity:       String(qty),
        // UTMs pour retrouver la source directement dans Stripe Dashboard
        ...(utm_source   && { utm_source }),
        ...(utm_medium   && { utm_medium }),
        ...(utm_campaign && { utm_campaign }),
      },
      // {CHECKOUT_SESSION_ID} est remplacé automatiquement par Stripe
      success_url: `${siteUrl}/merci-reservation-gaming?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${siteUrl}/reservation-gaming`,
      // Expire la session Stripe après 30 min (cohérent avec expires_at en base)
      expires_at: Math.floor(Date.now() / 1000) + PENDING_EXPIRY_MINUTES * 60,
    });
  } catch (err) {
    console.error('[create-checkout] Stripe session create:', err);
    // La réservation pending a été créée mais Stripe a échoué — on la marque cancelled
    await env.DB.prepare(
      "UPDATE reservations SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?"
    ).bind(reservationId).run();

    return Response.json(
      { error: 'Impossible de créer la session de paiement. Réessayez dans quelques instants.' },
      { status: 502, headers: cors }
    );
  }

  // ── 9. Sauvegarder l'ID de session Stripe en base ─────────────────────────
  await env.DB.prepare(
    'UPDATE reservations SET stripe_session_id = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).bind(session.id, reservationId).run();

  // ── 10. Retourner l'URL Stripe au frontend ────────────────────────────────
  return Response.json({ url: session.url }, { headers: cors });
}

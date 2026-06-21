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

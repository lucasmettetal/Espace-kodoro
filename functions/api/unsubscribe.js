// GET /api/unsubscribe?t=<token>&l=<list_name>
// Désinscription via le lien reçu dans un email de campagne.
// Le token est l'unsubscribe_token stocké dans contact_subscriptions (UUID unique).

export async function onRequestGet({ request, env }) {
  const url       = new URL(request.url);
  const token     = url.searchParams.get('t');
  const listName  = url.searchParams.get('l');
  const siteUrl   = (env.SITE_URL ?? 'https://www.espace-kodoro.fr').replace(/\/$/, '');

  if (!token || !listName) {
    return Response.redirect(`${siteUrl}/?unsub=invalid`, 302);
  }

  try {
    const sub = await env.DB.prepare(
      `SELECT id FROM contact_subscriptions WHERE unsubscribe_token = ? AND list_name = ?`
    ).bind(token, listName).first();

    if (!sub) {
      return Response.redirect(`${siteUrl}/?unsub=notfound`, 302);
    }

    await env.DB.prepare(`
      UPDATE contact_subscriptions
      SET status = 'unsubscribed', unsubscribed_at = datetime('now')
      WHERE id = ?
    `).bind(sub.id).run();

    return Response.redirect(`${siteUrl}/?unsub=ok&l=${encodeURIComponent(listName)}`, 302);
  } catch (err) {
    console.error('[unsubscribe]', err);
    return Response.redirect(`${siteUrl}/?unsub=error`, 302);
  }
}

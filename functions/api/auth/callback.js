export async function onRequest(context) {
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = context.env;
  const url = new URL(context.request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Code manquant', { status: 400 });
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code }),
  });

  const { access_token, error } = await tokenRes.json();

  if (error || !access_token) {
    return new Response(`Erreur d'authentification : ${error}`, { status: 401 });
  }

  const html = `<!DOCTYPE html><html><body><script>
    (function() {
      function cb(e) {
        window.opener.postMessage(
          'authorization:github:success:' + JSON.stringify({ token: '${access_token}', provider: 'github' }),
          e.origin
        );
      }
      window.addEventListener('message', cb, false);
      window.opener.postMessage('authorizing:github', '*');
    })();
  </script></body></html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}

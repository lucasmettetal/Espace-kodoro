export async function onRequest(context) {
  const { GITHUB_CLIENT_ID } = context.env;
  const origin = new URL(context.request.url).origin;
  const redirectUri = `${origin}/api/auth/callback`;
  const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo`;
  return Response.redirect(url, 302);
}

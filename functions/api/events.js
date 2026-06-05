export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM events WHERE active = 1 ORDER BY year, date'
  ).all();
  return Response.json(results);
}

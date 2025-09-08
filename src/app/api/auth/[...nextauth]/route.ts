export async function GET() {
  return new Response(JSON.stringify({ ok: true, route: '/api/auth/[...nextauth]' }), { headers: { 'content-type': 'application/json' } })
}

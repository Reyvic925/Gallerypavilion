export async function GET() {
  return new Response(JSON.stringify({ ok: true, route: '/api/auth/check-photographer' }), { headers: { 'content-type': 'application/json' } })
}

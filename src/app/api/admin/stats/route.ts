export async function GET() {
  return new Response(JSON.stringify({ ok: true, route: '/api/admin/stats' }), { headers: { 'content-type': 'application/json' } })
}

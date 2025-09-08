export async function GET() {
  return new Response(JSON.stringify({ ok: true, route: '/api/certificate/[photoId]' }), { headers: { 'content-type': 'application/json' } })
}

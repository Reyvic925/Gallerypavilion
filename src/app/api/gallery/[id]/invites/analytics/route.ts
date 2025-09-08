export async function GET() { return new Response(JSON.stringify({ ok: true, route: '/api/gallery/[id]/invites/analytics' }), { headers: { 'content-type': 'application/json' } }) }

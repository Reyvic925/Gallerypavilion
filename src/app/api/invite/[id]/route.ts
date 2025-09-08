export async function GET() { return new Response(JSON.stringify({ ok: true, route: '/api/invite/[id]' }), { headers: { 'content-type': 'application/json' } }) }

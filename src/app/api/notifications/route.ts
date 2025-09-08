export async function GET() { return new Response(JSON.stringify({ ok: true, route: '/api/notifications' }), { headers: { 'content-type': 'application/json' } }) }

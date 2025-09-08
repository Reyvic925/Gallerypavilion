export async function GET() { return new Response(JSON.stringify({ ok: true, route: '/api/photographer/stats' }), { headers: { 'content-type': 'application/json' } }) }

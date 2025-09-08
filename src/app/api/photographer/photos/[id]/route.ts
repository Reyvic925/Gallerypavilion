export async function GET() { return new Response(JSON.stringify({ ok: true, route: '/api/photographer/photos/[id]' }), { headers: { 'content-type': 'application/json' } }) }

export async function GET() { return new Response(JSON.stringify({ ok: true, route: '/api/images/[...path]' }), { headers: { 'content-type': 'application/json' } }) }

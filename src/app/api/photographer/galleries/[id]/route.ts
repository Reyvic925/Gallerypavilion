export async function GET() { return new Response(JSON.stringify({ ok: true, route: '/api/photographer/galleries/[id]' }), { headers: { 'content-type': 'application/json' } }) }

export async function POST() { return new Response(JSON.stringify({ ok: true, route: '/api/gallery/[id]/share-email' }), { headers: { 'content-type': 'application/json' } }) }

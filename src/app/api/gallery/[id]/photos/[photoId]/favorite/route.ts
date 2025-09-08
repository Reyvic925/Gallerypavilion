export async function POST() { return new Response(JSON.stringify({ ok: true, route: '/api/gallery/[id]/photos/[photoId]/favorite' }), { headers: { 'content-type': 'application/json' } }) }

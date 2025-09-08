export async function GET() { return new Response(JSON.stringify({ ok: true, route: '/api/gallery/[id]/photos/[photoId]/download' }), { headers: { 'content-type': 'application/json' } }) }

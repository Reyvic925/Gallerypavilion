export async function GET() { return new Response(JSON.stringify({ ok: true, route: '/api/reviews/photo/[photoId]' }), { headers: { 'content-type': 'application/json' } }) }

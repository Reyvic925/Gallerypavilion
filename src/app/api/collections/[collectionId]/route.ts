export async function GET() { return new Response(JSON.stringify({ ok: true, route: '/api/collections/[collectionId]' }), { headers: { 'content-type': 'application/json' } }) }

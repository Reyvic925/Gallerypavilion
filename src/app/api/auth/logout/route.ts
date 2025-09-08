export async function POST() {
  const res = new Response(JSON.stringify({ ok: true }), { status: 200 })
  res.headers.set('Set-Cookie', `auth-token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure=${process.env.NODE_ENV==='production'}`)
  return res
}

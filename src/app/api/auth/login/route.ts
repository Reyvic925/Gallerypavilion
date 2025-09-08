import { NextRequest } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import bcrypt from 'bcryptjs'
import { signJwt } from '../../../../lib/jwt'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, password } = body || {}
  if (!email || !password) return new Response(JSON.stringify({ error: 'Missing credentials' }), { status: 400 })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.password) return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 })

  const ok = await bcrypt.compare(password, user.password)
  if (!ok) return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 })

  // Create JWT and set as HttpOnly cookie via Set-Cookie header
  const token = signJwt({ sub: user.id, role: user.role })
  const res = new Response(JSON.stringify({ ok: true, user: { id: user.id, email: user.email, role: user.role } }), { status: 200 })
  res.headers.set('Set-Cookie', `auth-token=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax; Secure=${process.env.NODE_ENV==='production'}`)
  return res
}

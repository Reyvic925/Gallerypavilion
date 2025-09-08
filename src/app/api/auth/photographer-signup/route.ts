import { NextRequest } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import bcrypt from 'bcryptjs'
import { signJwt } from '../../../../lib/jwt'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, email, password } = body || {}
  if (!email || !password) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })

  const hashed = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({ data: { email, name, password: hashed, role: 'photographer' }})
  await prisma.photographer.create({ data: { userId: user.id, name: name ?? '', status: 'pending' }})

  // Sign JWT and set cookie to auto-login the new photographer
  const token = signJwt({ sub: user.id, role: user.role })
  const maxAge = 60 * 60 * 24 * 7 // 7 days
  const res = new Response(JSON.stringify({ ok: true }), { status: 201 })
  const secure = process.env.NODE_ENV === 'production'
  res.headers.set('Content-Type', 'application/json')
  res.headers.set(
    'Set-Cookie',
    `auth-token=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure=${secure}`
  )

  return res
}

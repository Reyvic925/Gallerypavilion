import { NextRequest } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { signJwt } from '../../../../lib/jwt'

// Minimal photographer login endpoint that issues a JWT cookie.
// Behavior: accepts optional JSON body { email } (dev convenience). If the
// user doesn't exist, create a photographer user and photographer record.
// Then sign a JWT, set the `auth-token` cookie, and return { redirect }.
export async function POST(request: NextRequest) {
  try {
    const nextParam = request.nextUrl.searchParams.get('next') || '/photographer'
    const body = await request.json().catch(() => ({}))
    const email = (body?.email as string) || process.env.DEV_PHOTOGRAPHER_EMAIL || 'dev-photographer@example.local'

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: 'Dev Photographer',
          role: 'photographer',
          emailVerified: new Date(),
        },
      })
      // Create photographer profile
      await prisma.photographer.create({ data: { userId: user.id, name: user.name || 'Dev Photographer' } })
    }

    // Ensure photographer profile exists for existing users
    if (user.role === 'photographer') {
      const prof = await prisma.photographer.findUnique({ where: { userId: user.id } })
      if (!prof) {
        await prisma.photographer.create({ data: { userId: user.id, name: user.name || 'Photographer' } })
      }
    }

    // Sign JWT and set cookie
    const token = signJwt({ sub: user.id, role: user.role })
    const maxAge = 60 * 60 * 24 * 7 // 7 days

    const res = new Response(JSON.stringify({ redirect: nextParam }), { status: 200 })
    const secure = process.env.NODE_ENV === 'production'
    res.headers.set('Content-Type', 'application/json')
    res.headers.set(
      'Set-Cookie',
      `auth-token=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure=${secure}`
    )
    return res
  } catch (err: any) {
    console.error('[photographer-login] error', err)
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
}

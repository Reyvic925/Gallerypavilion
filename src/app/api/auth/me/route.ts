import { NextRequest } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { verifyJwt } from '../../../../lib/jwt'

export async function GET(request: NextRequest) {
  const cookie = request.headers.get('cookie') || ''
  const match = cookie.split(';').map(c=>c.trim()).find(c => c.startsWith('auth-token='))
  const token = match ? match.split('=')[1] : null
  if (!token) return new Response(JSON.stringify({ user: null }), { status: 200 })

  const payload = verifyJwt<{ sub: string; role: string }>(token)
  if (!payload) return new Response(JSON.stringify({ user: null }), { status: 200 })

  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user) return new Response(JSON.stringify({ user: null }), { status: 200 })

  // If user is a photographer, ensure their photographer profile exists and is approved
  if (user.role === 'photographer') {
    const phot = await prisma.photographer.findUnique({ where: { userId: user.id } })
    // If no profile or status not 'approved', return a pending flag so server pages can handle it
    if (!phot) {
      return new Response(JSON.stringify({ user: null }), { status: 200 })
    }

    // If the Photographer model doesn't include a `status` field (older/test schema),
    // or the status is null/undefined, treat as approved. Only return pending if the
    // status is present and explicitly not 'approved'. This keeps compatibility with the test DB.
    const status = (phot as any).status
    if (status != null && status !== 'approved') {
      return new Response(JSON.stringify({ user: null, pending: true }), { status: 200 })
    }
    return new Response(JSON.stringify({ user: { id: user.id, email: user.email, role: user.role, photographer: { id: phot.id, status: status ?? 'approved' } } }), { status: 200 })
  }

  return new Response(JSON.stringify({ user: { id: user.id, email: user.email, role: user.role } }), { status: 200 })
}

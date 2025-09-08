import { NextRequest } from 'next/server'
// Use dynamic imports inside the handler so Vitest mocks are respected during tests.
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  const url = new URL(request.url)
  // Robust id extraction: split and filter empty segments (handles trailing slashes)
  const parts = url.pathname.split('/').filter(Boolean)
  const id = parts[parts.length - 2] ?? null
  if (!id) return new Response(JSON.stringify({ ok: false, error: 'invalid id' }), { status: 400 })
  // Allow an optional reason in the POST body to include in the rejection email
  let reason: string | undefined
  try {
    const body = await request.json()
    reason = body?.reason
  } catch (e) {
    // ignore if no JSON body
  }

  const { prisma } = await import('@/lib/prisma')
  const { sendPhotographerRejectionEmail } = await import('@/lib/email')

  // Use updateMany to avoid throwing when record not found in some test setups
  await prisma.photographer.updateMany({ where: { id }, data: { status: 'rejected' } })
  const updated = await prisma.photographer.findUnique({ where: { id }, include: { user: true } })

  const recipientEmail = updated?.user?.email ?? undefined
  const recipientName = updated?.user?.name ?? undefined
  if (recipientEmail) {
    sendPhotographerRejectionEmail(recipientEmail, recipientName, reason).catch(err => console.error('Rejection email send error', err))
  }

  // Simple append-only audit log (best-effort)
  try {
    const logDir = path.join(process.cwd(), 'logs')
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir)
  const entry = { event: 'photographer_rejected', photographerId: updated?.id ?? null, userId: updated?.user?.id ?? null, at: new Date().toISOString(), reason }
    fs.appendFileSync(path.join(logDir, 'admin-audit.log'), JSON.stringify(entry) + '\n')
  } catch (e) {
    console.error('audit log write failed', e)
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}

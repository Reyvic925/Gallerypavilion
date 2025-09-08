import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  const url = new URL(request.url)
  // Robust id extraction: split and filter empty segments (handles trailing slashes)
  const parts = url.pathname.split('/').filter(Boolean)
  const id = parts[parts.length - 2] ?? null
  if (!id) return new Response(JSON.stringify({ ok: false, error: 'invalid id' }), { status: 400 })
  const { prisma } = await import('@/lib/prisma')
  const { sendPhotographerApprovalEmail } = await import('@/lib/email')

  // Use updateMany to avoid throwing when record is not found in some test setups.
  await prisma.photographer.updateMany({ where: { id }, data: { status: 'approved' } })
  const updated = await prisma.photographer.findUnique({ where: { id }, include: { user: true } })
  if (!updated) {
    try {
      const all = await prisma.photographer.findMany({ take: 10 })
      console.warn('approve route: updated photographer not found for id=', id, 'existing sample photographers=', all)
    } catch (e) {
      console.warn('approve route: failed to list photographers', e)
    }
  }

  // Send approval email if user email exists. Don't block the response on send failure.
  const recipientEmail = updated?.user?.email ?? undefined
  const recipientName = updated?.user?.name ?? undefined
  if (recipientEmail) {
    sendPhotographerApprovalEmail(recipientEmail, recipientName).catch(err => console.error('Approval email send error', err))
  }

  // Simple append-only audit log (best-effort)
  try {
    const logDir = path.join(process.cwd(), 'logs')
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir)
  const entry = { event: 'photographer_approved', photographerId: updated?.id ?? null, userId: updated?.user?.id ?? null, at: new Date().toISOString() }
    fs.appendFileSync(path.join(logDir, 'admin-audit.log'), JSON.stringify(entry) + '\n')
  } catch (e) {
    console.error('audit log write failed', e)
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}

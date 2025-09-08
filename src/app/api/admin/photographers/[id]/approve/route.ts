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

  try {
    // Update using updateMany but verify with findUnique
    await prisma.photographer.updateMany({ 
      where: { id }, 
      data: { status: 'approved' } 
    })
    
    // Verify the update
    const updated = await prisma.photographer.findFirst({ 
      where: { id },
      include: { user: true }
    })
    
    if (!updated) {
      console.warn('approve route: photographer not found for id=', id)
      return new Response(JSON.stringify({ ok: false, error: 'photographer not found' }), { status: 404 })
    }
    
    // Send approval email if we have recipient info
    if (updated.user?.email) {
      sendPhotographerApprovalEmail(updated.user.email, updated.user?.name).catch(err => 
        console.error('Approval email send error:', err))
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (e) {
    console.error('approve route error:', e)
    return new Response(JSON.stringify({ ok: false, error: 'failed to update photographer' }), { status: 500 })
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

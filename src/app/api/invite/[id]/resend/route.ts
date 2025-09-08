import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendInviteEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
	try {
		const url = new URL(request.url)
		const parts = url.pathname.split('/')
		const id = parts[parts.length - 2]

		const invite = await prisma.invite.findUnique({ where: { id } })
		if (!invite) return new Response(JSON.stringify({ ok: false, error: 'not_found' }), { status: 404, headers: { 'content-type': 'application/json' } })
		if (!invite.clientEmail) return new Response(JSON.stringify({ ok: false, error: 'no_client_email' }), { status: 400, headers: { 'content-type': 'application/json' } })

		const gallery = await prisma.gallery.findUnique({ where: { id: invite.galleryId } })
		const photographer = await prisma.photographer.findFirst({ where: { id: gallery?.photographerId } })

		const inviteUrl = `${process.env.NEXTAUTH_URL || 'https://www.gallerypavilion.com'}/invite/${invite.inviteCode}`

		const sent = await sendInviteEmail({
			recipientEmail: invite.clientEmail,
			recipientName: undefined,
			galleryTitle: gallery?.title || 'Gallery',
			photographerName: photographer?.name || 'Photographer',
			inviteUrl,
			inviteCode: invite.inviteCode,
			permissions: {
				canView: invite.canView,
				canFavorite: invite.canFavorite,
				canComment: invite.canComment,
				canDownload: invite.canDownload,
				canRequestPurchase: invite.canRequestPurchase
			}
		})

		return new Response(JSON.stringify({ ok: !!sent }), { headers: { 'content-type': 'application/json' } })
	} catch (err) {
		console.error('Invite resend error', err)
		return new Response(JSON.stringify({ ok: false, error: 'exception' }), { status: 500, headers: { 'content-type': 'application/json' } })
	}
}

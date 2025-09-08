import { NextRequest } from 'next/server'
import { prisma, withPrismaRetry } from '@/lib/prisma'
import { generateInviteCode } from '@/lib/utils'
import { sendInviteEmail } from '@/lib/email'
import { verifyJwt } from '@/lib/jwt'

export async function POST(request: NextRequest) {
		try {
			// Authenticate user via auth-token cookie
			const cookie = request.headers.get('cookie') || ''
			const match = cookie.split(';').map(c => c.trim()).find(c => c.startsWith('auth-token='))
			const token = match ? match.split('=')[1] : null
			if (!token) return new Response(JSON.stringify({ ok: false, error: 'unauthenticated' }), { status: 401, headers: { 'content-type': 'application/json' } })

			const payload = verifyJwt<{ sub: string; role: string }>(token)
			if (!payload) return new Response(JSON.stringify({ ok: false, error: 'invalid_token' }), { status: 401, headers: { 'content-type': 'application/json' } })

			const user = await prisma.user.findUnique({ where: { id: payload.sub }, include: { photographer: true } })
			if (!user || !user.photographer) return new Response(JSON.stringify({ ok: false, error: 'not_a_photographer' }), { status: 403, headers: { 'content-type': 'application/json' } })

			const body = await request.json()
			const { galleryId, clientEmail, expiresAt, type, maxUsage, permissions } = body || {}

			if (!galleryId) {
				return new Response(JSON.stringify({ ok: false, error: 'missing_params' }), { status: 400, headers: { 'content-type': 'application/json' } })
			}

			// Verify gallery ownership
			const gallery = await prisma.gallery.findUnique({ where: { id: galleryId } })
			if (!gallery || gallery.photographerId !== user.photographer.id) {
				return new Response(JSON.stringify({ ok: false, error: 'forbidden' }), { status: 403, headers: { 'content-type': 'application/json' } })
			}

		const inviteCode = generateInviteCode()

		const invite = await withPrismaRetry(() =>
			prisma.invite.create({
				data: {
					inviteCode,
					galleryId,
					clientEmail: clientEmail || null,
					type: type || 'single_use',
					expiresAt: expiresAt ? new Date(expiresAt) : undefined,
					maxUsage: maxUsage ?? undefined,
					canView: permissions?.canView ?? true,
					canFavorite: permissions?.canFavorite ?? true,
					canComment: permissions?.canComment ?? false,
					canDownload: permissions?.canDownload ?? false,
					  canRequestPurchase: permissions?.canRequestPurchase ?? true
				}
			})
		)

		// If clientEmail provided, attempt to create Client record (idempotent) and link
		if (clientEmail) {
			try {
				const existingUser = await prisma.user.findUnique({ where: { email: clientEmail } })
				let client: any = null
				if (existingUser) {
					client = await prisma.client.upsert({
						where: { email: clientEmail },
						update: { updatedAt: new Date() },
						create: { userId: existingUser.id, email: clientEmail, name: existingUser.name || '', invitedBy: user.photographer.id }
					})
								} else {
									// Create a lightweight client and user placeholder
									const createdUser = await prisma.user.create({ data: { email: clientEmail, role: 'client' } })
									client = await prisma.client.create({ data: { userId: createdUser.id, email: clientEmail, name: '', invitedBy: user.photographer.id } })
								}

				await prisma.clientInvite.create({ data: { clientId: client.id, inviteId: invite.id } })
			} catch (e) {
				console.error('Failed linking client invite', e)
			}
		}

		// Send email notification (best-effort)
		if (clientEmail) {
			const inviteUrl = `${process.env.NEXTAUTH_URL || 'https://www.gallerypavilion.com'}/invite/${invite.inviteCode}`
			sendInviteEmail({
				recipientEmail: clientEmail,
				recipientName: undefined,
				galleryTitle: (await prisma.gallery.findUnique({ where: { id: galleryId } }))?.title || 'Gallery',
				photographerName: (await prisma.photographer.findUnique({ where: { id: user.photographer.id }, include: { user: true } }))?.name || 'Photographer',
				inviteUrl,
				inviteCode: invite.inviteCode,
				expiresAt: invite.expiresAt ?? undefined,
				permissions: {
					canView: invite.canView,
					canFavorite: invite.canFavorite,
					canComment: invite.canComment,
					canDownload: invite.canDownload,
					canRequestPurchase: invite.canRequestPurchase
				}
			}).catch(err => console.error('Invite email send failed', err))
		}

		return new Response(JSON.stringify({ ok: true, invite }), { headers: { 'content-type': 'application/json' } })
	} catch (err) {
		console.error('Create invite error', err)
		return new Response(JSON.stringify({ ok: false, error: 'exception' }), { status: 500, headers: { 'content-type': 'application/json' } })
	}
}

import { NextRequest } from 'next/server'
import { prisma, withPrismaRetry } from '@/lib/prisma'

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { inviteCode } = body || {}
		if (!inviteCode) return new Response(JSON.stringify({ ok: false, error: 'missing_invite_code' }), { status: 400, headers: { 'content-type': 'application/json' } })

		const invite = await withPrismaRetry(() => prisma.invite.findUnique({ where: { inviteCode } }))
		if (!invite) return new Response(JSON.stringify({ ok: false, error: 'invalid' }), { status: 404, headers: { 'content-type': 'application/json' } })

		if (invite.status !== 'active') return new Response(JSON.stringify({ ok: false, error: 'inactive' }), { status: 400, headers: { 'content-type': 'application/json' } })
		if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) return new Response(JSON.stringify({ ok: false, error: 'expired' }), { status: 400, headers: { 'content-type': 'application/json' } })
		if (invite.maxUsage && invite.usageCount >= invite.maxUsage) return new Response(JSON.stringify({ ok: false, error: 'maxed' }), { status: 400, headers: { 'content-type': 'application/json' } })

		return new Response(JSON.stringify({ ok: true, invite: {
			id: invite.id,
			inviteCode: invite.inviteCode,
			galleryId: invite.galleryId,
			permissions: {
				canView: invite.canView,
				canFavorite: invite.canFavorite,
				canComment: invite.canComment,
				canDownload: invite.canDownload,
				canRequestPurchase: invite.canRequestPurchase
			}
		} }), { headers: { 'content-type': 'application/json' } })
	} catch (err) {
		console.error('Invite validate error', err)
		return new Response(JSON.stringify({ ok: false, error: 'exception' }), { status: 500, headers: { 'content-type': 'application/json' } })
	}
}

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
	try {
		const url = new URL(request.url)
		const parts = url.pathname.split('/')
		const id = parts[parts.length - 2]

		const invite = await prisma.invite.update({ where: { id }, data: { status: 'revoked' } })
		return new Response(JSON.stringify({ ok: true, invite }), { headers: { 'content-type': 'application/json' } })
	} catch (err) {
		console.error('Invite revoke error', err)
		return new Response(JSON.stringify({ ok: false, error: 'exception' }), { status: 500, headers: { 'content-type': 'application/json' } })
	}
}

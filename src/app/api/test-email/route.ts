import { NextRequest } from 'next/server'
import { sendPhotographerApprovalEmail, sendPhotographerRejectionEmail, testEmailConfig } from '@/lib/email'

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { action, email, name, reason } = body || {}

		// quick config test
		const cfg = await testEmailConfig()
		if (!cfg.success) {
			return new Response(JSON.stringify({ ok: false, error: 'email-config', detail: cfg.error }), { status: 500, headers: { 'content-type': 'application/json' } })
		}

		if (action === 'approve') {
			const sent = await sendPhotographerApprovalEmail(email, name)
			return new Response(JSON.stringify({ ok: sent }), { headers: { 'content-type': 'application/json' } })
		}

		if (action === 'reject') {
			const sent = await sendPhotographerRejectionEmail(email, name, reason)
			return new Response(JSON.stringify({ ok: sent }), { headers: { 'content-type': 'application/json' } })
		}

		return new Response(JSON.stringify({ ok: false, error: 'invalid_action' }), { status: 400, headers: { 'content-type': 'application/json' } })
	} catch (err) {
		console.error('test-email route error', err)
		return new Response(JSON.stringify({ ok: false, error: 'exception' }), { status: 500, headers: { 'content-type': 'application/json' } })
	}
}

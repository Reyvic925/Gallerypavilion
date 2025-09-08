import { describe, it, expect, beforeEach, vi } from 'vitest'
import { testPrisma, resetTestDb } from './integration-helpers'

// Ensure route imports that use the alias '@/lib/prisma' resolve to our test client
vi.mock('@/lib/prisma', () => ({ prisma: testPrisma, withPrismaRetry: (fn: any) => fn() }))
// Prevent the real email module (nodemailer heavy/native) from being loaded during tests
vi.mock('@/lib/email', () => ({ sendPhotographerApprovalEmail: () => Promise.resolve(true) }))

describe('admin approve flow', () => {
  beforeEach(() => resetTestDb())

  it('approves a pending photographer', async () => {
    const user = await testPrisma.user.create({ data: { email: 'pend@example.com', role: 'photographer' } })
    const phot = await testPrisma.photographer.create({ data: { userId: user.id, name: 'P', status: 'pending' } })

    // Call the approve route handler directly
    const { POST } = await import('../app/api/admin/photographers/[id]/approve/route')
    const fakeReq: any = { url: `http://localhost/api/admin/photographers/${phot.id}/approve` }
    const res: any = await POST(fakeReq)
    expect(res.status).toBe(200)

    const refreshed = await testPrisma.photographer.findUnique({ where: { id: phot.id } })
    expect(refreshed?.status).toBe('approved')
  })
})

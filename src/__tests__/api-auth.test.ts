import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as jwt from 'jsonwebtoken'

process.env.JWT_SECRET = 'test-secret'

// Minimal request helpers
function makeGetReqWithCookie(cookie: string) {
  return {
    headers: {
      get: (k: string) => (k.toLowerCase() === 'cookie' ? cookie : null),
    },
  } as any
}

function makePostReqWithCookieAndBody(cookie: string, body: any) {
  return {
    headers: {
      get: (k: string) => (k.toLowerCase() === 'cookie' ? cookie : null),
    },
    json: async () => body,
  } as any
}

// Use real test Prisma client for integration tests
import { testPrisma, resetTestDb } from './integration-helpers'

// Point route imports that use relative '../lib/prisma' to our test client by mocking that module
vi.mock('../lib/prisma', () => ({ prisma: testPrisma, withPrismaRetry: (fn: any) => fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: testPrisma, withPrismaRetry: (fn: any) => fn() }))

// Mock utilities and email sender
vi.mock('@/lib/utils', () => ({ generateInviteCode: () => 'INVITE-CODE-1' }))
vi.mock('@/lib/email', () => ({ sendInviteEmail: () => Promise.resolve() }))

// Some routes import '@/lib/jwt' (alias) which may not resolve in the test runner; provide a small shim
vi.mock('@/lib/jwt', () => ({
  verifyJwt: (token: string) => {
    try {
      return jwt.verify(token, process.env.JWT_SECRET as string) as any
    } catch (e) {
      return null
    }
  },
}))

describe('API route server-side token verification', () => {
  beforeEach(() => {
  vi.resetAllMocks()
  return resetTestDb()
  })

  afterEach(() => {
    // Clear any env changes
    delete process.env.JWT_EXPIRES_IN
  })

  it('auth/me returns user when cookie token valid and user exists', async () => {
  const createdUser = await testPrisma.user.create({ data: { email: 'a@b.com', role: 'photographer' } })
  // Create photographer profile
  await testPrisma.photographer.create({ data: { userId: createdUser.id, name: 'Photog' } })

  const token = jwt.sign({ sub: createdUser.id, role: createdUser.role }, process.env.JWT_SECRET as string, { expiresIn: '1h' })
  const cookie = `auth-token=${token};`

  const { GET } = await import('../app/api/auth/me/route')
  const res: any = await GET(makeGetReqWithCookie(cookie))
  expect(res.status).toBe(200)
  const data = JSON.parse(await res.text())
  expect(data.user).toBeTruthy()
  expect(data.user.id).toBe(createdUser.id)
  })

  it('auth/me returns null when token missing or invalid', async () => {
    const { GET } = await import('../app/api/auth/me/route')
    const res1: any = await GET(makeGetReqWithCookie(''))
    expect(res1.status).toBe(200)
    const data1 = JSON.parse(await res1.text())
    expect(data1.user).toBeNull()

    // invalid token
    const cookie = `auth-token=bad.token.value;`
    const res2: any = await GET(makeGetReqWithCookie(cookie))
    expect(res2.status).toBe(200)
    const data2 = JSON.parse(await res2.text())
    expect(data2.user).toBeNull()
  })

  it('invite POST returns 401 when token missing/invalid and 200 when valid and gallery owned', async () => {
    const { POST } = await import('../app/api/invite/route')

    // missing token
    const resMissing: any = await POST(makePostReqWithCookieAndBody('', { galleryId: 'g1' }))
    expect(resMissing.status).toBe(401)

    // invalid token
    const resInvalid: any = await POST(makePostReqWithCookieAndBody('auth-token=bad;', { galleryId: 'g1' }))
    expect(resInvalid.status).toBe(401)

  // valid token but user not photographer
  const clientUser = await testPrisma.user.create({ data: { email: 'client@example.com', role: 'client' } })
  const tokenUser = jwt.sign({ sub: clientUser.id, role: clientUser.role }, process.env.JWT_SECRET as string, { expiresIn: '1h' })
  const resNotPhotog: any = await POST(makePostReqWithCookieAndBody(`auth-token=${tokenUser};`, { galleryId: 'g1' }))
  expect(resNotPhotog.status).toBe(403)

  // valid token and photographer and gallery owned
  const photUser = await testPrisma.user.create({ data: { email: 'photog@example.com', role: 'photographer' } })
  const photProfile = await testPrisma.photographer.create({ data: { userId: photUser.id, name: 'P' } })
  const gallery = await testPrisma.gallery.create({ data: { title: 'G', photographerId: photProfile.id } })

  const tokenPhotog = jwt.sign({ sub: photUser.id, role: photUser.role }, process.env.JWT_SECRET as string, { expiresIn: '1h' })
  const resOk: any = await POST(makePostReqWithCookieAndBody(`auth-token=${tokenPhotog};`, { galleryId: gallery.id }))
  // Should create invite successfully
  expect(resOk.status).toBe(200)
  const body = JSON.parse(await resOk.text())
  expect(body.ok).toBeTruthy()
  expect(body.invite).toBeTruthy()
  })
})

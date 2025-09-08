import { describe, it, expect, vi, afterEach } from 'vitest'
import * as jwt from 'jsonwebtoken'

// Minimal mock for NextRequest
function makeReq(body?: any, url = 'http://localhost/auth/photographer-login?next=/photographer') {
  const json = async () => body
  const nextUrl = new URL(url)
  return { json, nextUrl }
}

// Ensure a deterministic JWT secret for tests
process.env.JWT_SECRET = 'test-secret'

// Mock prisma module using vi.mock
const prismaMock = {
  user: {
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation(async ({ data }: any) => ({ id: 'user-1', ...data })),
  },
  photographer: {
    create: vi.fn().mockResolvedValue({ id: 'photog-1' }),
    findUnique: vi.fn().mockResolvedValue(null),
  },
}

vi.mock('../lib/prisma', () => ({ prisma: prismaMock }))

describe('photographer-login endpoint', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a user and sets auth-token cookie and returns redirect', async () => {
    const { POST } = await import('../app/api/auth/photographer-login/route')
    const req: any = await makeReq({ email: 'test@example.com' })
    const res: any = await POST(req)
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('redirect')
    const setCookie = res.headers.get('Set-Cookie')
    expect(setCookie).toBeTruthy()
  expect(setCookie).toContain('auth-token=')

  // Extract token from cookie
  const match = setCookie.match(/auth-token=([^;]+);/) || setCookie.match(/auth-token=([^;]+)$/)
  expect(match).toBeTruthy()
  const token = match ? match[1] : null
  expect(token).toBeTruthy()

  // Verify JWT
  const payload = jwt.verify(token as string, process.env.JWT_SECRET as string) as any
  expect(payload).toHaveProperty('sub')
  expect(payload).toHaveProperty('role')
  // Exact value assertions
  expect(payload.sub).toBe('user-1')
  expect(payload.role).toBe('photographer')
  // iat and exp assertions
  expect(typeof payload.iat).toBe('number')
  expect(typeof payload.exp).toBe('number')
  expect(payload.exp).toBeGreaterThan(payload.iat)
  const lifetime = payload.exp - payload.iat
  const expected = 60 * 60 * 24 * 7 // 7 days in seconds
  // Allow small clock skew tolerance
  expect(lifetime).toBeGreaterThanOrEqual(expected - 5)
  expect(lifetime).toBeLessThanOrEqual(expected + 5)
  // iat should be recent (within 10s)
  const nowSec = Math.floor(Date.now() / 1000)
  expect(nowSec - payload.iat).toBeLessThanOrEqual(10)
  })

  const cases: Array<{ label: string; env: string; expectedSeconds: number }> = [
    { label: '7 days', env: '7d', expectedSeconds: 60 * 60 * 24 * 7 },
    { label: '1 hour', env: '1h', expectedSeconds: 60 * 60 },
    { label: '60 seconds', env: '60s', expectedSeconds: 60 },
  ]

  for (const c of cases) {
    it(`sets token lifetime for ${c.label}`, async () => {
      process.env.JWT_EXPIRES_IN = c.env
  // Reinitialize mocked prisma functions in case previous tests restored mocks
  prismaMock.user.findUnique = vi.fn().mockResolvedValue(null)
  prismaMock.user.create = vi.fn().mockImplementation(async ({ data }: any) => ({ id: `user-${c.env}`, ...data }))
  prismaMock.photographer.create = vi.fn().mockResolvedValue({ id: `photog-${c.env}` })
  prismaMock.photographer.findUnique = vi.fn().mockResolvedValue(null)

  // Re-import route to pick up env change if modules cache the JWT default
  const { POST } = await import('../app/api/auth/photographer-login/route')
      const req: any = await makeReq({ email: `test-${c.env}@example.com` })
      const res: any = await POST(req)
      expect(res.status).toBe(200)
      const setCookie = res.headers.get('Set-Cookie')
      const match = setCookie.match(/auth-token=([^;]+);/) || setCookie.match(/auth-token=([^;]+)$/)
      const token = match ? match[1] : null
      const payload = jwt.verify(token as string, process.env.JWT_SECRET as string) as any
      const lifetime = payload.exp - payload.iat
      // Allow some tolerance for sign options parsing differences and clock skew
      expect(Math.abs(lifetime - c.expectedSeconds)).toBeLessThanOrEqual(5)
    })
  }
})

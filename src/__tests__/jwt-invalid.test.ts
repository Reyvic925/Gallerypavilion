import { describe, it, expect } from 'vitest'
import * as jwt from 'jsonwebtoken'
import { verifyJwt } from '../lib/jwt'

// Use the same test secret as other tests
process.env.JWT_SECRET = 'test-secret'

describe('verifyJwt - invalid and expired tokens', () => {
  it('returns null for token with invalid signature', () => {
    const token = jwt.sign({ sub: 'bad' }, 'wrong-secret', { expiresIn: '1d' })
    const out = verifyJwt(token)
    expect(out).toBeNull()
  })

  it('returns null for expired token', async () => {
    const token = jwt.sign({ sub: 'expired' }, process.env.JWT_SECRET as string, { expiresIn: '1s' })
    // wait until token is expired
    await new Promise((r) => setTimeout(r, 1100))
    const out = verifyJwt(token)
    expect(out).toBeNull()
  })
})

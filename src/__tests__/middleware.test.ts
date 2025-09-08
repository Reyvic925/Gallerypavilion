import { describe, it, expect } from 'vitest'
import { middleware } from '../middleware'
import { NextRequest } from 'next/server'

function makeReq(url = 'http://localhost/photographer/123') {
  const nextUrl = new URL(url)
  const headers = new Map<string, string>()
  const req: any = { nextUrl, headers: { get: (k: string) => headers.get(k) }, url }
  return req
}

describe('middleware', () => {
  it('redirects to photographer login when no token present', () => {
    const req = makeReq('http://localhost/photographer/123')
    const res = middleware(req as unknown as NextRequest)
    // NextResponse.redirect returns a Response-like object; check for instance
    expect(res).toBeTruthy()
    // NextResponse.redirect sets a location header on the response
    const loc = res.headers.get('location')
    expect(loc).toContain('/auth/photographer-login')
  })
})

export function setAuthCookie(res: any, token: string, options: { maxAge?: number } = {}) {
  const maxAge = options.maxAge ?? 60 * 60 * 24 * 7 // 7 days
  // Using Set-Cookie header
  res.headers.set('Set-Cookie', `auth-token=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure=${process.env.NODE_ENV==='production'}`)
}

export function clearAuthCookie(res: any) {
  res.headers.set('Set-Cookie', `auth-token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure=${process.env.NODE_ENV==='production'}`)
}

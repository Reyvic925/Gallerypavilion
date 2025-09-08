import * as jwt from 'jsonwebtoken'

const JWT_SECRET: jwt.Secret = (process.env.JWT_SECRET as jwt.Secret) || 'change-this-in-production'

export function signJwt(payload: Record<string, any>, options?: { expiresIn?: jwt.SignOptions['expiresIn'] }) {
  // Allow configuring default token lifetime via env var JWT_EXPIRES_IN (e.g. '7d', '1h', '3600s')
  const defaultExpires = (process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']) || '7d'
  const signOptions: jwt.SignOptions = { expiresIn: (options?.expiresIn as jwt.SignOptions['expiresIn']) ?? defaultExpires }
  return jwt.sign(payload as jwt.JwtPayload, JWT_SECRET, signOptions)
}

export function verifyJwt<T = any>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET) as T
  } catch (e) {
    return null
  }
}
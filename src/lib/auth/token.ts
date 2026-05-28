import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): string {
  const payload = jwt.verify(token, SECRET) as { sub: string }
  return payload.sub
}

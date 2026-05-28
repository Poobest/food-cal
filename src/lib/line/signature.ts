import * as crypto from 'crypto'

export function verifySignature(body: string, signature: string, secret: string): boolean {
  if (!signature) return false
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64')
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

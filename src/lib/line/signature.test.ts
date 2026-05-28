import { describe, it, expect } from 'vitest'
import * as crypto from 'crypto'
import { verifySignature } from './signature'

function makeSignature(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('base64')
}

describe('verifySignature', () => {
  const secret = 'test-secret'
  const body = '{"events":[]}'

  it('returns true for valid signature', () => {
    const sig = makeSignature(body, secret)
    expect(verifySignature(body, sig, secret)).toBe(true)
  })

  it('returns false for wrong signature', () => {
    expect(verifySignature(body, 'wrong-sig', secret)).toBe(false)
  })

  it('returns false for empty signature', () => {
    expect(verifySignature(body, '', secret)).toBe(false)
  })
})

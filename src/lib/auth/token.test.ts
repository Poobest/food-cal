import { describe, it, expect } from 'vitest'
import { signToken, verifyToken } from './token'

describe('token', () => {
  it('sign userId แล้ว verify คืน userId เดิม', () => {
    const userId = 'user_abc123'
    const token = signToken(userId)
    const result = verifyToken(token)
    expect(result).toBe(userId)
  })

  it('token ที่ถูกแก้ไข verify ไม่ได้', () => {
    const token = signToken('user_abc123')
    const tampered = token.slice(0, -5) + 'xxxxx'
    expect(() => verifyToken(tampered)).toThrow()
  })
})

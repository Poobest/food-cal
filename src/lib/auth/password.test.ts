import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from './password'

describe('password', () => {
  it('hash ที่สร้างจาก plain text สามารถยืนยันด้วย plain text เดิมได้', async () => {
    const plain = 'password123'
    const hash = await hashPassword(plain)
    const isValid = await verifyPassword(plain, hash)
    expect(isValid).toBe(true)
  })

  it('plain text ที่ผิดยืนยันกับ hash ไม่ได้', async () => {
    const hash = await hashPassword('password123')
    const isValid = await verifyPassword('wrongpassword', hash)
    expect(isValid).toBe(false)
  })

  it('hash ที่ได้ไม่เหมือนกับ plain text', async () => {
    const plain = 'password123'
    const hash = await hashPassword(plain)
    expect(hash).not.toBe(plain)
  })
})

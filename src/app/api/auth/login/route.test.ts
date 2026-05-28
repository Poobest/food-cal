import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

import { POST } from './route'
import { prisma } from '@/lib/db/prisma'
import { hashPassword } from '@/lib/auth/password'

function makeRequest(body: object) {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/auth/login', () => {
  beforeEach(() => vi.clearAllMocks())

  it('login ด้วย credentials ถูกต้องได้รับ JWT', async () => {
    const passwordHash = await hashPassword('password123')
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user_123',
      email: 'test@example.com',
      passwordHash,
      createdAt: new Date(),
    })

    const res = await POST(makeRequest({ email: 'test@example.com', password: 'password123' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(typeof body.token).toBe('string')
  })

  it('login ด้วย password ผิดไม่ได้ (401)', async () => {
    const passwordHash = await hashPassword('password123')
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user_123',
      email: 'test@example.com',
      passwordHash,
      createdAt: new Date(),
    })

    const res = await POST(makeRequest({ email: 'test@example.com', password: 'wrongpassword' }))

    expect(res.status).toBe(401)
  })

  it('login ด้วย email ที่ไม่มีในระบบไม่ได้ (401)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const res = await POST(makeRequest({ email: 'nobody@example.com', password: 'password123' }))

    expect(res.status).toBe(401)
  })
})

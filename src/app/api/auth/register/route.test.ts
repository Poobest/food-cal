import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

import { POST } from './route'
import { prisma } from '@/lib/db/prisma'

const mockUser = {
  id: 'user_123',
  email: 'test@example.com',
  passwordHash: 'hash',
  createdAt: new Date(),
}

function makeRequest(body: object) {
  return new Request('http://localhost/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/auth/register', () => {
  beforeEach(() => vi.clearAllMocks())

  it('ผู้ใช้ใหม่สมัครสมาชิกได้และได้รับ JWT', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue(mockUser)

    const res = await POST(makeRequest({ email: 'test@example.com', password: 'password123' }))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(typeof body.token).toBe('string')
    expect(body.token.length).toBeGreaterThan(0)
  })

  it('สมัครด้วย email ที่มีอยู่แล้วไม่ได้ (409)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser)

    const res = await POST(makeRequest({ email: 'test@example.com', password: 'password123' }))

    expect(res.status).toBe(409)
  })
})

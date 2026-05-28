import { describe, it, expect } from 'vitest'
import { withAuth } from './middleware'
import { signToken } from './token'
import { NextRequest, NextResponse } from 'next/server'

function makeRequest(token?: string) {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return new NextRequest('http://localhost/api/protected', { headers })
}

describe('withAuth middleware', () => {
  it('request ที่มี token ถูกต้องผ่านได้และ handler ได้รับ userId', async () => {
    const token = signToken('user_123')
    let capturedUserId: string | undefined

    const handler = async (_req: NextRequest, userId: string) => {
      capturedUserId = userId
      return NextResponse.json({ ok: true })
    }

    const res = await withAuth(makeRequest(token), handler)

    expect(res.status).toBe(200)
    expect(capturedUserId).toBe('user_123')
  })

  it('request ที่ไม่มี token ถูกปฏิเสธ (401)', async () => {
    const handler = async () => NextResponse.json({ ok: true })
    const res = await withAuth(makeRequest(), handler)
    expect(res.status).toBe(401)
  })

  it('request ที่มี token ปลอมถูกปฏิเสธ (401)', async () => {
    const handler = async () => NextResponse.json({ ok: true })
    const res = await withAuth(makeRequest('invalid.token.here'), handler)
    expect(res.status).toBe(401)
  })
})

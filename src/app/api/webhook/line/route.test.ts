import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as crypto from 'crypto'
import { POST } from './route'

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      upsert: vi.fn(),
    },
  },
}))

const CHANNEL_SECRET = 'test-secret'

function makeRequest(body: string, signature?: string): Request {
  const sig = signature ?? crypto.createHmac('sha256', CHANNEL_SECRET).update(body).digest('base64')
  return new Request('http://localhost/api/webhook/line', {
    method: 'POST',
    headers: { 'x-line-signature': sig, 'content-type': 'application/json' },
    body,
  })
}

describe('POST /api/webhook/line', () => {
  beforeEach(() => {
    vi.stubEnv('LINE_CHANNEL_SECRET', CHANNEL_SECRET)
  })

  it('returns 403 for invalid signature', async () => {
    const req = makeRequest('{"events":[]}', 'invalid-sig')
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('returns 200 for valid request with no events', async () => {
    const req = makeRequest('{"events":[]}')
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('upserts user on follow event', async () => {
    const { prisma } = await import('@/lib/db/prisma')
    const body = JSON.stringify({
      events: [{ type: 'follow', source: { userId: 'Uabc123' } }],
    })
    const req = makeRequest(body)
    await POST(req)
    expect(prisma.user.upsert).toHaveBeenCalledWith({
      where: { lineUserId: 'Uabc123' },
      update: {},
      create: { lineUserId: 'Uabc123' },
    })
  })

  it('does not upsert on non-follow events', async () => {
    const { prisma } = await import('@/lib/db/prisma')
    vi.mocked(prisma.user.upsert).mockClear()
    const body = JSON.stringify({
      events: [{ type: 'message', source: { userId: 'Uabc123' }, message: { text: 'hi' } }],
    })
    const req = makeRequest(body)
    await POST(req)
    expect(prisma.user.upsert).not.toHaveBeenCalled()
  })
})

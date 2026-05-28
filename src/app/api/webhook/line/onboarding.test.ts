import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as crypto from 'crypto'
import { POST } from './route'

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: { upsert: vi.fn().mockResolvedValue({ id: 'user-1', lineUserId: 'Uabc' }) },
    onboardingState: { findUnique: vi.fn(), upsert: vi.fn() },
    profile: { upsert: vi.fn() },
    nutritionGoal: { upsert: vi.fn() },
  },
}))

vi.mock('@/lib/line/reply', () => ({
  replyMessage: vi.fn().mockResolvedValue(undefined),
}))

const SECRET = 'test-secret'

function makeRequest(body: object): Request {
  const bodyStr = JSON.stringify(body)
  const sig = crypto.createHmac('sha256', SECRET).update(bodyStr).digest('base64')
  return new Request('http://localhost/api/webhook/line', {
    method: 'POST',
    headers: { 'x-line-signature': sig, 'content-type': 'application/json' },
    body: bodyStr,
  })
}

function textEvent(userId: string, text: string, replyToken = 'reply-token') {
  return { type: 'message', replyToken, source: { userId }, message: { type: 'text', text } }
}

describe('Onboarding flow', () => {
  beforeEach(async () => {
    vi.stubEnv('LINE_CHANNEL_SECRET', SECRET)
    vi.stubEnv('LINE_CHANNEL_ACCESS_TOKEN', 'test-token')
    const { prisma } = await import('@/lib/db/prisma')
    vi.mocked(prisma.onboardingState.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.onboardingState.upsert).mockResolvedValue({ id: 'os-1', userId: 'user-1', step: 'gender' } as never)
    vi.mocked(prisma.user.upsert).mockResolvedValue({ id: 'user-1', lineUserId: 'Uabc', createdAt: new Date() } as never)
  })

  it('follow event starts onboarding — asks gender with quick replies', async () => {
    const { replyMessage } = await import('@/lib/line/reply')
    const req = makeRequest({
      events: [{ type: 'follow', replyToken: 'reply-token', source: { userId: 'Uabc' } }],
    })
    await POST(req)
    expect(replyMessage).toHaveBeenCalledWith(
      'reply-token',
      expect.objectContaining({ type: 'text', text: expect.stringContaining('เพศ') })
    )
  })

  it('user answers gender — bot asks age', async () => {
    const { prisma } = await import('@/lib/db/prisma')
    const { replyMessage } = await import('@/lib/line/reply')
    vi.mocked(prisma.onboardingState.findUnique).mockResolvedValue({ id: 'os-1', userId: 'user-1', step: 'gender' } as never)

    const req = makeRequest({ events: [textEvent('Uabc', 'ชาย')] })
    await POST(req)

    expect(replyMessage).toHaveBeenCalledWith(
      'reply-token',
      expect.objectContaining({ type: 'text', text: expect.stringContaining('อายุ') })
    )
  })

  it('user completes all steps — bot replies TDEE + nutrition goal', async () => {
    const { prisma } = await import('@/lib/db/prisma')
    const { replyMessage } = await import('@/lib/line/reply')
    vi.mocked(prisma.onboardingState.findUnique).mockResolvedValue({ id: 'os-1', userId: 'user-1', step: 'goal' } as never)
    vi.mocked(prisma.profile.upsert).mockResolvedValue({
      id: 'p-1', userId: 'user-1', gender: 'male', age: 30,
      weightKg: 70, heightCm: 175, activityLevel: 'sedentary', goalType: 'maintain',
    } as never)
    vi.mocked(prisma.nutritionGoal.upsert).mockResolvedValue({} as never)

    // user replies with goal type
    const req = makeRequest({ events: [textEvent('Uabc', 'รักษาน้ำหนัก')] })
    await POST(req)

    expect(replyMessage).toHaveBeenCalledWith(
      'reply-token',
      expect.objectContaining({ type: 'text', text: expect.stringContaining('TDEE') })
    )
  })
})

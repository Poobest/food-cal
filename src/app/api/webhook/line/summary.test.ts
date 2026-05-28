import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as crypto from 'crypto'
import { POST } from './route'

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: { upsert: vi.fn().mockResolvedValue({ id: 'user-1', lineUserId: 'Uabc' }) },
    onboardingState: { findUnique: vi.fn().mockResolvedValue({ step: 'done' }), upsert: vi.fn() },
    profile: { upsert: vi.fn() },
    nutritionGoal: { findUnique: vi.fn(), upsert: vi.fn() },
    mealLog: { create: vi.fn(), findMany: vi.fn() },
  },
}))

vi.mock('@/lib/line/reply', () => ({ replyMessage: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/lib/usda/searchFood', () => ({ searchFood: vi.fn() }))

const SECRET = 'test-secret'

function makeTextRequest(text: string) {
  const body = JSON.stringify({
    events: [{
      type: 'message', replyToken: 'reply-token',
      source: { userId: 'Uabc' },
      message: { type: 'text', text },
    }],
  })
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64')
  return new Request('http://localhost/api/webhook/line', {
    method: 'POST',
    headers: { 'x-line-signature': sig, 'content-type': 'application/json' },
    body,
  })
}

const MOCK_GOAL = {
  id: 'g-1', userId: 'user-1',
  calories: 2000, protein: 140, carbs: 235, fiber: 25,
  sugar: 50, fat: 55, saturatedFat: 20, sodium: 2300,
}

const MOCK_LOGS = [
  { calories: 240, protein: 9, carbs: 37.5, fiber: 1.5, sugar: 4.5, fat: 6, saturatedFat: 1.5, sodium: 675 },
  { calories: 320, protein: 12, carbs: 50, fiber: 2, sugar: 6, fat: 8, saturatedFat: 2, sodium: 900 },
]

describe('Daily Summary via chat', () => {
  beforeEach(async () => {
    vi.stubEnv('LINE_CHANNEL_SECRET', SECRET)
    const { prisma } = await import('@/lib/db/prisma')
    vi.mocked(prisma.nutritionGoal.findUnique).mockResolvedValue(MOCK_GOAL as never)
    vi.mocked(prisma.mealLog.findMany).mockResolvedValue(MOCK_LOGS as never)
  })

  it('"สรุป" replies with today calories actual vs goal', async () => {
    const { replyMessage } = await import('@/lib/line/reply')
    const req = makeTextRequest('สรุป')
    await POST(req)

    expect(replyMessage).toHaveBeenCalledWith(
      'reply-token',
      expect.objectContaining({
        type: 'text',
        text: expect.stringMatching(/560.*2000|แคลอรี่/),
      })
    )
  })

  it('"สรุป" with no nutrition goal replies setup prompt', async () => {
    const { prisma } = await import('@/lib/db/prisma')
    const { replyMessage } = await import('@/lib/line/reply')
    vi.mocked(prisma.nutritionGoal.findUnique).mockResolvedValue(null)

    const req = makeTextRequest('สรุป')
    await POST(req)

    expect(replyMessage).toHaveBeenCalledWith(
      'reply-token',
      expect.objectContaining({ type: 'text', text: expect.stringContaining('ตั้งค่า') })
    )
  })

  it('"สรุป" with empty meal logs shows zero actuals', async () => {
    const { prisma } = await import('@/lib/db/prisma')
    const { replyMessage } = await import('@/lib/line/reply')
    vi.mocked(prisma.mealLog.findMany).mockResolvedValue([] as never)

    const req = makeTextRequest('สรุป')
    await POST(req)

    expect(replyMessage).toHaveBeenCalledWith(
      'reply-token',
      expect.objectContaining({ type: 'text', text: expect.stringContaining('0') })
    )
  })
})

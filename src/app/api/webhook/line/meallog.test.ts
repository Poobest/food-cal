import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as crypto from 'crypto'
import { POST } from './route'

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: { upsert: vi.fn().mockResolvedValue({ id: 'user-1', lineUserId: 'Uabc' }) },
    onboardingState: { findUnique: vi.fn().mockResolvedValue({ step: 'done' }), upsert: vi.fn() },
    profile: { upsert: vi.fn() },
    nutritionGoal: { upsert: vi.fn() },
    mealLog: { create: vi.fn().mockResolvedValue({}) },
  },
}))

vi.mock('@/lib/line/reply', () => ({ replyMessage: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/lib/usda/searchFood', () => ({ searchFood: vi.fn() }))

const SECRET = 'test-secret'

function makeTextRequest(text: string) {
  const body = JSON.stringify({
    events: [{
      type: 'message',
      replyToken: 'reply-token',
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

describe('Meal log via chat', () => {
  beforeEach(async () => {
    vi.stubEnv('LINE_CHANNEL_SECRET', SECRET)
    vi.stubEnv('LINE_CHANNEL_ACCESS_TOKEN', 'test-token')

    const { searchFood } = await import('@/lib/usda/searchFood')
    vi.mocked(searchFood).mockResolvedValue({
      name: 'Pad Thai',
      nutrients: { calories: 160, protein: 6, carbs: 25, fiber: 1, sugar: 3, fat: 4, saturatedFat: 1, sodium: 450 },
    })
  })

  it('log command saves MealLog with scaled nutrients and replies confirmation', async () => {
    const { prisma } = await import('@/lib/db/prisma')
    const { replyMessage } = await import('@/lib/line/reply')

    const req = makeTextRequest('log:Pad Thai:150')
    await POST(req)

    expect(prisma.mealLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        foodName: 'Pad Thai',
        quantityG: 150,
        calories: 240,
        protein: 9,
      }),
    })
    expect(replyMessage).toHaveBeenCalledWith(
      'reply-token',
      expect.objectContaining({ type: 'text', text: expect.stringContaining('บันทึกแล้ว') })
    )
  })

  it('cancel command replies cancellation message', async () => {
    const { replyMessage } = await import('@/lib/line/reply')

    const req = makeTextRequest('ยกเลิก')
    await POST(req)

    expect(replyMessage).toHaveBeenCalledWith(
      'reply-token',
      expect.objectContaining({ type: 'text', text: expect.stringContaining('ยกเลิก') })
    )
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as crypto from 'crypto'
import { POST } from './route'

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: { upsert: vi.fn().mockResolvedValue({ id: 'user-1', lineUserId: 'Uabc' }) },
    onboardingState: { findUnique: vi.fn().mockResolvedValue({ step: 'done' }), upsert: vi.fn() },
    profile: {
      findUnique: vi.fn(),
      upsert: vi.fn().mockResolvedValue({ id: 'p-1', userId: 'user-1', gender: 'male', age: 30, weightKg: 75, heightCm: 175, activityLevel: 'moderate', goalType: 'maintain' }),
    },
    nutritionGoal: { findUnique: vi.fn().mockResolvedValue(null), upsert: vi.fn() },
    mealLog: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
  },
}))
vi.mock('@/lib/line/reply', () => ({ replyMessage: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/lib/usda/searchFood', () => ({ searchFood: vi.fn() }))

const SECRET = 'test-secret'
function makeTextRequest(text: string) {
  const body = JSON.stringify({ events: [{ type: 'message', replyToken: 'r', source: { userId: 'Uabc' }, message: { type: 'text', text } }] })
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64')
  return new Request('http://localhost/api/webhook/line', { method: 'POST', headers: { 'x-line-signature': sig, 'content-type': 'application/json' }, body })
}

describe('Profile edit via chat', () => {
  beforeEach(() => vi.stubEnv('LINE_CHANNEL_SECRET', SECRET))

  it('"แก้ไขโปรไฟล์" asks what to edit with Quick Reply', async () => {
    const { replyMessage } = await import('@/lib/line/reply')
    await POST(makeTextRequest('แก้ไขโปรไฟล์'))
    expect(replyMessage).toHaveBeenCalledWith('r', expect.objectContaining({
      type: 'text', text: expect.stringContaining('แก้ไข'),
      quickReply: expect.objectContaining({ items: expect.any(Array) }),
    }))
  })

  it('"edit:weight:75" updates weight, recalculates TDEE, replies new goal', async () => {
    const { prisma } = await import('@/lib/db/prisma')
    const { replyMessage } = await import('@/lib/line/reply')
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({ id: 'p-1', userId: 'user-1', gender: 'male', age: 30, weightKg: 70, heightCm: 175, activityLevel: 'sedentary', goalType: 'maintain' } as never)

    await POST(makeTextRequest('edit:weight:75'))

    expect(prisma.profile.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: expect.objectContaining({ weightKg: 75 }),
    }))
    expect(prisma.nutritionGoal.upsert).toHaveBeenCalled()
    expect(replyMessage).toHaveBeenCalledWith('r', expect.objectContaining({ text: expect.stringContaining('TDEE') }))
  })

  it('"edit:activity:active" updates activity level and recalculates', async () => {
    const { prisma } = await import('@/lib/db/prisma')
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({ id: 'p-1', userId: 'user-1', gender: 'male', age: 30, weightKg: 70, heightCm: 175, activityLevel: 'sedentary', goalType: 'maintain' } as never)

    await POST(makeTextRequest('edit:activity:active'))
    expect(prisma.profile.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: expect.objectContaining({ activityLevel: 'active' }),
    }))
  })
})

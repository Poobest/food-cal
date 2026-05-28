import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as crypto from 'crypto'
import { POST } from './route'

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: { upsert: vi.fn().mockResolvedValue({ id: 'user-1', lineUserId: 'Uabc' }) },
    onboardingState: { findUnique: vi.fn().mockResolvedValue({ step: 'done' }), upsert: vi.fn() },
    profile: { upsert: vi.fn() },
    nutritionGoal: { findUnique: vi.fn().mockResolvedValue(null), upsert: vi.fn() },
    mealLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn().mockResolvedValue({}),
    },
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

describe('Delete meal log', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.stubEnv('LINE_CHANNEL_SECRET', SECRET)
    const { prisma } = await import('@/lib/db/prisma')
    vi.mocked(prisma.mealLog.findMany).mockResolvedValue([
      { id: 'log-1', userId: 'user-1', foodName: 'ข้าวผัด', quantityG: 200, calories: 320, protein: 8, carbs: 50, fiber: 2, sugar: 3, fat: 8, saturatedFat: 2, sodium: 600, loggedAt: new Date() },
    ] as never)
  })

  it('"ลบ" shows today logs with Quick Reply to select', async () => {
    const { replyMessage } = await import('@/lib/line/reply')
    await POST(makeTextRequest('ลบ'))
    expect(replyMessage).toHaveBeenCalledWith('r', expect.objectContaining({
      type: 'text', text: expect.stringContaining('ข้าวผัด'),
      quickReply: expect.objectContaining({ items: expect.any(Array) }),
    }))
  })

  it('"delete:<id>" deletes own log and replies confirmation', async () => {
    const { prisma } = await import('@/lib/db/prisma')
    const { replyMessage } = await import('@/lib/line/reply')
    vi.mocked(prisma.mealLog.findUnique).mockResolvedValue({ id: 'log-1', userId: 'user-1', foodName: 'ข้าวผัด' } as never)

    await POST(makeTextRequest('delete:log-1'))
    expect(prisma.mealLog.delete).toHaveBeenCalledWith({ where: { id: 'log-1' } })
    expect(replyMessage).toHaveBeenCalledWith('r', expect.objectContaining({ text: expect.stringContaining('ลบ') }))
  })

  it('"delete:<id>" rejects deleting another user log', async () => {
    const { prisma } = await import('@/lib/db/prisma')
    const { replyMessage } = await import('@/lib/line/reply')
    vi.mocked(prisma.mealLog.findUnique).mockResolvedValue({ id: 'log-9', userId: 'other-user', foodName: 'ผัดไทย' } as never)

    await POST(makeTextRequest('delete:log-9'))
    expect(prisma.mealLog.delete).not.toHaveBeenCalled()
    expect(replyMessage).toHaveBeenCalledWith('r', expect.objectContaining({ text: expect.stringContaining('ไม่มีสิทธิ์') }))
  })

  it('"27/05" date pattern shows history summary for that day', async () => {
    const { prisma } = await import('@/lib/db/prisma')
    const { replyMessage } = await import('@/lib/line/reply')
    vi.mocked(prisma.nutritionGoal.findUnique).mockResolvedValue({ id: 'g-1', userId: 'user-1', calories: 2000, protein: 140, carbs: 235, fiber: 25, sugar: 50, fat: 55, saturatedFat: 20, sodium: 2300 } as never)

    await POST(makeTextRequest('27/05'))
    expect(replyMessage).toHaveBeenCalledWith('r', expect.objectContaining({ text: expect.stringContaining('สรุป') }))
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as crypto from 'crypto'
import { POST } from './route'

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: { upsert: vi.fn().mockResolvedValue({ id: 'user-1', lineUserId: 'Uabc' }) },
    onboardingState: { findUnique: vi.fn().mockResolvedValue({ step: 'done' }), upsert: vi.fn() },
    profile: { upsert: vi.fn() },
    nutritionGoal: { upsert: vi.fn() },
  },
}))

vi.mock('@/lib/line/reply', () => ({ replyMessage: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/lib/ai/recognizeFood', () => ({ recognizeFoodFromImage: vi.fn() }))
vi.mock('@/lib/usda/searchFood', () => ({ searchFood: vi.fn() }))

const SECRET = 'test-secret'

function makeImageRequest(messageId = 'msg-001') {
  const body = JSON.stringify({
    events: [{
      type: 'message',
      replyToken: 'reply-token',
      source: { userId: 'Uabc' },
      message: { type: 'image', id: messageId },
    }],
  })
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64')
  return new Request('http://localhost/api/webhook/line', {
    method: 'POST',
    headers: { 'x-line-signature': sig, 'content-type': 'application/json' },
    body,
  })
}

describe('Image message handling', () => {
  beforeEach(async () => {
    vi.stubEnv('LINE_CHANNEL_SECRET', SECRET)
    vi.stubEnv('LINE_CHANNEL_ACCESS_TOKEN', 'test-token')

    const { recognizeFoodFromImage } = await import('@/lib/ai/recognizeFood')
    const { searchFood } = await import('@/lib/usda/searchFood')

    vi.mocked(recognizeFoodFromImage).mockResolvedValue('Pad Thai')
    vi.mocked(searchFood).mockResolvedValue({
      name: 'Pad Thai',
      nutrients: { calories: 160, protein: 6, carbs: 25, fiber: 1, sugar: 3, fat: 4, saturatedFat: 1, sodium: 450 },
    })

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(Buffer.from('fake-image'), { status: 200 })
    )
  })

  it('downloads image from LINE, recognizes food, replies with nutrients + quick reply', async () => {
    const { replyMessage } = await import('@/lib/line/reply')
    const req = makeImageRequest()
    await POST(req)

    expect(replyMessage).toHaveBeenCalledWith(
      'reply-token',
      expect.objectContaining({
        type: 'text',
        text: expect.stringContaining('Pad Thai'),
        quickReply: expect.objectContaining({ items: expect.any(Array) }),
      })
    )
  })

  it('replies with error message when AI cannot identify food', async () => {
    const { recognizeFoodFromImage } = await import('@/lib/ai/recognizeFood')
    const { replyMessage } = await import('@/lib/line/reply')
    vi.mocked(recognizeFoodFromImage).mockResolvedValue(null)

    const req = makeImageRequest()
    await POST(req)

    expect(replyMessage).toHaveBeenCalledWith(
      'reply-token',
      expect.objectContaining({ type: 'text', text: expect.stringContaining('ไม่สามารถระบุ') })
    )
  })

  it('replies with error message when USDA returns no result', async () => {
    const { searchFood } = await import('@/lib/usda/searchFood')
    const { replyMessage } = await import('@/lib/line/reply')
    vi.mocked(searchFood).mockResolvedValue(null)

    const req = makeImageRequest()
    await POST(req)

    expect(replyMessage).toHaveBeenCalledWith(
      'reply-token',
      expect.objectContaining({ type: 'text', text: expect.stringContaining('ไม่พบข้อมูล') })
    )
  })
})

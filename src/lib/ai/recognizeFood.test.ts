import { describe, it, expect, vi, afterEach } from 'vitest'
import { recognizeFoodFromImage } from './recognizeFood'

afterEach(() => vi.restoreAllMocks())

describe('recognizeFoodFromImage', () => {
  it('returns food name from OpenRouter vision response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'Pad Thai' } }],
        }),
        { status: 200 }
      )
    )

    const buffer = Buffer.from('fake-image-data')
    const result = await recognizeFoodFromImage(buffer)

    expect(result).toBe('Pad Thai')
  })

  it('returns null when AI cannot identify food', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'UNKNOWN' } }],
        }),
        { status: 200 }
      )
    )

    const buffer = Buffer.from('fake-image-data')
    const result = await recognizeFoodFromImage(buffer)

    expect(result).toBeNull()
  })

  it('returns null on API error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'quota exceeded' } }), { status: 429 })
    )

    const result = await recognizeFoodFromImage(Buffer.from('fake'))
    expect(result).toBeNull()
  })
})

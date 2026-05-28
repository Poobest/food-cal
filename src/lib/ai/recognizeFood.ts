export async function recognizeFoodFromImage(buffer: Buffer): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY ?? ''
  const model = process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini'
  const base64 = buffer.toString('base64')

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
              {
                type: 'text',
                text: 'What food is in this image? Reply with ONLY the food name in English. If you cannot identify food, reply with exactly "UNKNOWN".',
              },
            ],
          },
        ],
        max_tokens: 50,
      }),
    })

    const data = await res.json()
    if (data.error || !data.choices?.[0]) return null

    const content: string = data.choices[0].message.content.trim()
    if (content === 'UNKNOWN') return null
    return content
  } catch {
    return null
  }
}

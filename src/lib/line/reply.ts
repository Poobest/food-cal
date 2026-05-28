export async function replyMessage(replyToken: string, message: object): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN ?? ''
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ replyToken, messages: [message] }),
  })
}

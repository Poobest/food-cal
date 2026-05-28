import { NextRequest, NextResponse } from 'next/server'
import { verifySignature } from '@/lib/line/signature'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-line-signature') ?? ''
  const secret = process.env.LINE_CHANNEL_SECRET ?? ''

  if (!verifySignature(body, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  const { events } = JSON.parse(body)

  for (const event of events) {
    if (event.type === 'follow') {
      await prisma.user.upsert({
        where: { lineUserId: event.source.userId },
        update: {},
        create: { lineUserId: event.source.userId },
      })
    }
  }

  return NextResponse.json({ ok: true })
}

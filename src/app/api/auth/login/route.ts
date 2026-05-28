import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyPassword } from '@/lib/auth/password'
import { signToken } from '@/lib/auth/token'

export async function POST(request: Request) {
  const { email, password } = await request.json()

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return NextResponse.json({ message: 'email หรือ password ไม่ถูกต้อง' }, { status: 401 })
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    return NextResponse.json({ message: 'email หรือ password ไม่ถูกต้อง' }, { status: 401 })
  }

  const token = signToken(user.id)
  return NextResponse.json({ token }, { status: 200 })
}

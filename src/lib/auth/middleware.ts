import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './token'

type AuthHandler = (req: NextRequest, userId: string) => Promise<NextResponse>

export async function withAuth(req: NextRequest, handler: AuthHandler): Promise<NextResponse> {
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return NextResponse.json({ message: 'กรุณา login ก่อน' }, { status: 401 })
  }

  try {
    const userId = verifyToken(token)
    return handler(req, userId)
  } catch {
    return NextResponse.json({ message: 'Token ไม่ถูกต้อง' }, { status: 401 })
  }
}

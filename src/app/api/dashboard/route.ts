import { prisma } from '@/lib/db/prisma'
import { summarizeDay } from '@/lib/summary/summarizeDay'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lineUserId = searchParams.get('lineUserId')

  if (!lineUserId) {
    return Response.json({ error: 'Missing lineUserId' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { lineUserId },
    include: { nutritionGoal: true },
  })

  if (!user || !user.nutritionGoal) {
    return Response.json({ error: 'User or nutrition goal not found' }, { status: 404 })
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const mealLogs = await prisma.mealLog.findMany({
    where: { userId: user.id, loggedAt: { gte: todayStart } },
    orderBy: { loggedAt: 'desc' },
  })

  const summary = summarizeDay(mealLogs, user.nutritionGoal)

  return Response.json({ summary, mealLogs, goal: user.nutritionGoal })
}

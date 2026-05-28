export function canDeleteMealLog(userId: string, log: { userId: string; id: string }): boolean {
  return log.userId === userId
}

type NutrientLog = {
  calories: number; protein: number; carbs: number; fiber: number
  sugar: number; fat: number; saturatedFat: number; sodium: number
}

type NutrientStat = { actual: number; goal: number; remaining: number }

export type DailySummary = {
  calories: NutrientStat
  protein: NutrientStat
  carbs: NutrientStat
  fiber: NutrientStat
  sugar: NutrientStat
  fat: NutrientStat
  saturatedFat: NutrientStat
  sodium: NutrientStat
}

const KEYS = ['calories', 'protein', 'carbs', 'fiber', 'sugar', 'fat', 'saturatedFat', 'sodium'] as const

export function summarizeDay(mealLogs: NutrientLog[], goal: NutrientLog): DailySummary {
  const actual = KEYS.reduce((acc, key) => {
    acc[key] = Math.round(mealLogs.reduce((sum, log) => sum + log[key], 0) * 10) / 10
    return acc
  }, {} as Record<typeof KEYS[number], number>)

  return KEYS.reduce((acc, key) => {
    acc[key] = { actual: actual[key], goal: goal[key], remaining: Math.round((goal[key] - actual[key]) * 10) / 10 }
    return acc
  }, {} as DailySummary)
}

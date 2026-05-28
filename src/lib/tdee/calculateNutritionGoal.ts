export type NutritionGoalValues = {
  calories: number
  protein: number
  carbs: number
  fiber: number
  sugar: number
  fat: number
  saturatedFat: number
  sodium: number
}

export function calculateNutritionGoal(input: { calories: number; weightKg: number }): NutritionGoalValues {
  const { calories, weightKg } = input
  const protein = weightKg * 2
  const fat = (calories * 0.25) / 9
  const carbs = (calories - protein * 4 - fat * 9) / 4
  return {
    calories,
    protein: Math.round(protein * 10) / 10,
    fat: Math.round(fat * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fiber: 25,
    sugar: 50,
    saturatedFat: 20,
    sodium: 2300,
  }
}

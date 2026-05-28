export type Nutrients = {
  calories: number
  protein: number
  carbs: number
  fiber: number
  sugar: number
  fat: number
  saturatedFat: number
  sodium: number
}

export type FoodItem = {
  name: string
  nutrients: Nutrients
}

const NUTRIENT_IDS = {
  calories: 1008,
  protein: 1003,
  carbs: 1005,
  fiber: 1079,
  sugar: 2000,
  fat: 1004,
  saturatedFat: 1258,
  sodium: 1093,
} as const

function mapNutrients(foodNutrients: { nutrientId: number; value: number }[]): Nutrients {
  const lookup = new Map(foodNutrients.map((n) => [n.nutrientId, n.value]))
  return {
    calories: lookup.get(NUTRIENT_IDS.calories) ?? 0,
    protein: lookup.get(NUTRIENT_IDS.protein) ?? 0,
    carbs: lookup.get(NUTRIENT_IDS.carbs) ?? 0,
    fiber: lookup.get(NUTRIENT_IDS.fiber) ?? 0,
    sugar: lookup.get(NUTRIENT_IDS.sugar) ?? 0,
    fat: lookup.get(NUTRIENT_IDS.fat) ?? 0,
    saturatedFat: lookup.get(NUTRIENT_IDS.saturatedFat) ?? 0,
    sodium: lookup.get(NUTRIENT_IDS.sodium) ?? 0,
  }
}

export async function searchFood(name: string): Promise<FoodItem | null> {
  const apiKey = process.env.USDA_API_KEY ?? ''
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(name)}&pageSize=1&api_key=${apiKey}`

  const res = await fetch(url)
  const data = await res.json()

  if (!data.foods || data.foods.length === 0) return null

  const food = data.foods[0]
  return {
    name: food.description,
    nutrients: mapNutrients(food.foodNutrients),
  }
}

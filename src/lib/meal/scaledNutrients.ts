import type { Nutrients } from '@/lib/usda/searchFood'

export function scaledNutrients(per100g: Nutrients, quantityG: number): Nutrients {
  const scale = quantityG / 100
  return {
    calories: Math.round(per100g.calories * scale * 10) / 10,
    protein: Math.round(per100g.protein * scale * 10) / 10,
    carbs: Math.round(per100g.carbs * scale * 10) / 10,
    fiber: Math.round(per100g.fiber * scale * 10) / 10,
    sugar: Math.round(per100g.sugar * scale * 10) / 10,
    fat: Math.round(per100g.fat * scale * 10) / 10,
    saturatedFat: Math.round(per100g.saturatedFat * scale * 10) / 10,
    sodium: Math.round(per100g.sodium * scale * 10) / 10,
  }
}

import { describe, it, expect } from 'vitest'
import { calculateNutritionGoal } from './calculateNutritionGoal'

describe('calculateNutritionGoal', () => {
  it('derives macros from TDEE and weight', () => {
    // TDEE = 2000, weight = 70kg
    // protein: 70 × 2 = 140g
    // fat: 25% × 2000 / 9 = 55.6g
    // carbs: (2000 - 140×4 - 55.6×9) / 4 = (2000 - 560 - 500) / 4 = 235g
    const goal = calculateNutritionGoal({ calories: 2000, weightKg: 70 })
    expect(goal.calories).toBe(2000)
    expect(goal.protein).toBeCloseTo(140, 0)
    expect(goal.fat).toBeCloseTo(55.6, 0)
    expect(goal.carbs).toBeCloseTo(235, 0)
  })

  it('sets fixed daily targets for fiber, sugar, saturatedFat, sodium', () => {
    const goal = calculateNutritionGoal({ calories: 2000, weightKg: 70 })
    expect(goal.fiber).toBe(25)
    expect(goal.sugar).toBe(50)
    expect(goal.saturatedFat).toBe(20)
    expect(goal.sodium).toBe(2300)
  })
})

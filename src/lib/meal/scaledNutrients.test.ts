import { describe, it, expect } from 'vitest'
import { scaledNutrients } from './scaledNutrients'

const PER_100G = { calories: 160, protein: 6, carbs: 25, fiber: 1, sugar: 3, fat: 4, saturatedFat: 1, sodium: 450 }

describe('scaledNutrients', () => {
  it('scales nutrients proportionally for 150g', () => {
    const result = scaledNutrients(PER_100G, 150)
    expect(result.calories).toBeCloseTo(240, 1)
    expect(result.protein).toBeCloseTo(9, 1)
    expect(result.carbs).toBeCloseTo(37.5, 1)
    expect(result.sodium).toBeCloseTo(675, 1)
  })

  it('returns same values for 100g', () => {
    const result = scaledNutrients(PER_100G, 100)
    expect(result).toEqual(PER_100G)
  })

  it('scales correctly for 200g', () => {
    const result = scaledNutrients(PER_100G, 200)
    expect(result.calories).toBeCloseTo(320, 1)
    expect(result.fat).toBeCloseTo(8, 1)
  })
})

import { describe, it, expect } from 'vitest'
import { calculateTDEE } from './calculateTDEE'

describe('calculateTDEE', () => {
  it('calculates TDEE for male, sedentary, maintain', () => {
    // BMR = (10×70) + (6.25×175) - (5×30) + 5 = 1648.75
    // TDEE = 1648.75 × 1.2 = 1978.5
    const result = calculateTDEE({ gender: 'male', age: 30, weightKg: 70, heightCm: 175, activityLevel: 'sedentary', goalType: 'maintain' })
    expect(result).toBeCloseTo(1978.5, 0)
  })

  it('calculates TDEE for female', () => {
    // BMR = (10×60) + (6.25×160) - (5×25) - 161 = 1314
    // TDEE = 1314 × 1.2 = 1576.8
    const result = calculateTDEE({ gender: 'female', age: 25, weightKg: 60, heightCm: 160, activityLevel: 'sedentary', goalType: 'maintain' })
    expect(result).toBeCloseTo(1576.8, 0)
  })

  it('applies activity multipliers correctly', () => {
    const base = { gender: 'male' as const, age: 30, weightKg: 70, heightCm: 175, goalType: 'maintain' as const }
    const bmr = 1648.75
    expect(calculateTDEE({ ...base, activityLevel: 'light' })).toBeCloseTo(bmr * 1.375, 0)
    expect(calculateTDEE({ ...base, activityLevel: 'moderate' })).toBeCloseTo(bmr * 1.55, 0)
    expect(calculateTDEE({ ...base, activityLevel: 'active' })).toBeCloseTo(bmr * 1.725, 0)
    expect(calculateTDEE({ ...base, activityLevel: 'very_active' })).toBeCloseTo(bmr * 1.9, 0)
  })

  it('adjusts calories for goal types', () => {
    const base = { gender: 'male' as const, age: 30, weightKg: 70, heightCm: 175, activityLevel: 'sedentary' as const }
    const maintain = calculateTDEE({ ...base, goalType: 'maintain' })
    expect(calculateTDEE({ ...base, goalType: 'lose' })).toBeCloseTo(maintain - 500, 0)
    expect(calculateTDEE({ ...base, goalType: 'gain' })).toBeCloseTo(maintain + 300, 0)
  })
})

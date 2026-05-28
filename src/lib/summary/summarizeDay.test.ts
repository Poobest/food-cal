import { describe, it, expect } from 'vitest'
import { summarizeDay } from './summarizeDay'

const GOAL = {
  calories: 2000, protein: 140, carbs: 235, fiber: 25,
  sugar: 50, fat: 55, saturatedFat: 20, sodium: 2300,
}

const LOG_A = { calories: 240, protein: 9, carbs: 37.5, fiber: 1.5, sugar: 4.5, fat: 6, saturatedFat: 1.5, sodium: 675 }
const LOG_B = { calories: 320, protein: 12, carbs: 50, fiber: 2, sugar: 6, fat: 8, saturatedFat: 2, sodium: 900 }

describe('summarizeDay', () => {
  it('aggregates multiple meal logs against goal', () => {
    const result = summarizeDay([LOG_A, LOG_B], GOAL)

    expect(result.calories.actual).toBeCloseTo(560, 1)
    expect(result.calories.goal).toBe(2000)
    expect(result.protein.actual).toBeCloseTo(21, 1)
    expect(result.sodium.actual).toBeCloseTo(1575, 1)
  })

  it('returns zero actuals when no meal logs', () => {
    const result = summarizeDay([], GOAL)

    expect(result.calories.actual).toBe(0)
    expect(result.protein.actual).toBe(0)
    expect(result.calories.goal).toBe(2000)
  })

  it('returns correct remaining calories', () => {
    const result = summarizeDay([LOG_A], GOAL)

    expect(result.calories.remaining).toBeCloseTo(2000 - 240, 1)
  })
})

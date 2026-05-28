import { describe, it, expect, vi, afterEach } from 'vitest'
import { searchFood } from './searchFood'

const USDA_FOOD_RESPONSE = {
  foods: [
    {
      description: 'Chicken, broilers or fryers, breast, meat only, cooked, roasted',
      foodNutrients: [
        { nutrientId: 1008, value: 165 },  // calories
        { nutrientId: 1003, value: 31 },   // protein
        { nutrientId: 1005, value: 0 },    // carbs
        { nutrientId: 1079, value: 0 },    // fiber
        { nutrientId: 2000, value: 0 },    // sugar
        { nutrientId: 1004, value: 3.6 },  // fat
        { nutrientId: 1258, value: 1.01 }, // saturated fat
        { nutrientId: 1093, value: 74 },   // sodium
      ],
    },
  ],
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('searchFood', () => {
  it('returns FoodItem with mapped nutrients from USDA response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(USDA_FOOD_RESPONSE), { status: 200 })
    )

    const result = await searchFood('chicken breast')

    expect(result).toEqual({
      name: 'Chicken, broilers or fryers, breast, meat only, cooked, roasted',
      nutrients: {
        calories: 165,
        protein: 31,
        carbs: 0,
        fiber: 0,
        sugar: 0,
        fat: 3.6,
        saturatedFat: 1.01,
        sodium: 74,
      },
    })
  })

  it('returns null when no foods found', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ foods: [] }), { status: 200 })
    )

    const result = await searchFood('xyznonexistentfood')

    expect(result).toBeNull()
  })

  it('defaults missing nutrients to 0', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          foods: [{ description: 'Mystery Food', foodNutrients: [{ nutrientId: 1008, value: 50 }] }],
        }),
        { status: 200 }
      )
    )

    const result = await searchFood('mystery')

    expect(result?.nutrients.protein).toBe(0)
    expect(result?.nutrients.calories).toBe(50)
    expect(result?.nutrients.sodium).toBe(0)
  })
})

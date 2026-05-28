export type Gender = 'male' | 'female'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type GoalType = 'lose' | 'maintain' | 'gain'

export type ProfileInput = {
  gender: Gender
  age: number
  weightKg: number
  heightCm: number
  activityLevel: ActivityLevel
  goalType: GoalType
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

const GOAL_ADJUSTMENTS: Record<GoalType, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
}

export function calculateTDEE(profile: ProfileInput): number {
  const { gender, age, weightKg, heightCm, activityLevel, goalType } = profile
  const bmr =
    gender === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161
  const tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel]
  return tdee + GOAL_ADJUSTMENTS[goalType]
}

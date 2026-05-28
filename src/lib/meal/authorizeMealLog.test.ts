import { describe, it, expect } from 'vitest'
import { canDeleteMealLog } from './authorizeMealLog'

describe('canDeleteMealLog', () => {
  it('returns true when userId matches log owner', () => {
    expect(canDeleteMealLog('user-1', { userId: 'user-1', id: 'log-1' })).toBe(true)
  })

  it('returns false when userId does not match log owner', () => {
    expect(canDeleteMealLog('user-2', { userId: 'user-1', id: 'log-1' })).toBe(false)
  })
})

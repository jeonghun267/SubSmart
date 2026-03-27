import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  isPremium,
  getAIUsageToday,
  canUseAI,
  getRemainingAIUses,
  recordAIUsage,
  setPlan,
} from '@/lib/premium'

// Keys used internally by the module
const AI_USAGE_KEY = 'subsmart_ai_usage'
const PLAN_KEY = 'subsmart_plan'

describe('premium utilities', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // -- isPremium --
  describe('isPremium', () => {
    it('returns false when no plan is set', () => {
      expect(isPremium()).toBe(false)
    })

    it('returns true when plan is "premium"', () => {
      localStorage.setItem(PLAN_KEY, 'premium')
      expect(isPremium()).toBe(true)
    })

    it('returns false for any other plan value', () => {
      localStorage.setItem(PLAN_KEY, 'pro')
      expect(isPremium()).toBe(false)
    })
  })

  // -- getAIUsageToday --
  describe('getAIUsageToday', () => {
    it('returns 0 when no usage recorded', () => {
      expect(getAIUsageToday()).toBe(0)
    })

    it('returns count for today', () => {
      const today = new Date().toISOString().split('T')[0]
      localStorage.setItem(AI_USAGE_KEY, JSON.stringify({ date: today, count: 2 }))
      expect(getAIUsageToday()).toBe(2)
    })

    it('returns 0 when usage is from a different day', () => {
      localStorage.setItem(AI_USAGE_KEY, JSON.stringify({ date: '2020-01-01', count: 5 }))
      expect(getAIUsageToday()).toBe(0)
    })

    it('returns 0 when stored value is invalid JSON', () => {
      localStorage.setItem(AI_USAGE_KEY, 'not-json')
      expect(getAIUsageToday()).toBe(0)
    })
  })

  // -- canUseAI --
  describe('canUseAI', () => {
    it('returns true when no usage yet (free plan)', () => {
      expect(canUseAI()).toBe(true)
    })

    it('returns true when usage is below limit', () => {
      const today = new Date().toISOString().split('T')[0]
      localStorage.setItem(AI_USAGE_KEY, JSON.stringify({ date: today, count: 2 }))
      expect(canUseAI()).toBe(true)
    })

    it('returns false when free limit (3) is reached', () => {
      const today = new Date().toISOString().split('T')[0]
      localStorage.setItem(AI_USAGE_KEY, JSON.stringify({ date: today, count: 3 }))
      expect(canUseAI()).toBe(false)
    })

    it('returns true for premium even when limit is reached', () => {
      const today = new Date().toISOString().split('T')[0]
      localStorage.setItem(AI_USAGE_KEY, JSON.stringify({ date: today, count: 100 }))
      localStorage.setItem(PLAN_KEY, 'premium')
      expect(canUseAI()).toBe(true)
    })
  })

  // -- getRemainingAIUses --
  describe('getRemainingAIUses', () => {
    it('returns 3 when no usage on free plan', () => {
      expect(getRemainingAIUses()).toBe(3)
    })

    it('returns correct remaining count', () => {
      const today = new Date().toISOString().split('T')[0]
      localStorage.setItem(AI_USAGE_KEY, JSON.stringify({ date: today, count: 1 }))
      expect(getRemainingAIUses()).toBe(2)
    })

    it('returns 0 when at or over the limit', () => {
      const today = new Date().toISOString().split('T')[0]
      localStorage.setItem(AI_USAGE_KEY, JSON.stringify({ date: today, count: 5 }))
      expect(getRemainingAIUses()).toBe(0)
    })

    it('returns Infinity for premium users', () => {
      localStorage.setItem(PLAN_KEY, 'premium')
      expect(getRemainingAIUses()).toBe(Infinity)
    })
  })

  // -- recordAIUsage --
  describe('recordAIUsage', () => {
    it('creates usage entry on first call', () => {
      recordAIUsage()
      const stored = JSON.parse(localStorage.getItem(AI_USAGE_KEY)!)
      const today = new Date().toISOString().split('T')[0]
      expect(stored.date).toBe(today)
      expect(stored.count).toBe(1)
    })

    it('increments count on subsequent calls', () => {
      recordAIUsage()
      recordAIUsage()
      recordAIUsage()
      const stored = JSON.parse(localStorage.getItem(AI_USAGE_KEY)!)
      expect(stored.count).toBe(3)
    })

    it('resets count when day changes', () => {
      // Record usage for yesterday
      localStorage.setItem(AI_USAGE_KEY, JSON.stringify({ date: '2020-01-01', count: 3 }))
      recordAIUsage()
      const stored = JSON.parse(localStorage.getItem(AI_USAGE_KEY)!)
      expect(stored.count).toBe(1) // reset to 1, not 4
    })
  })

  // -- setPlan --
  describe('setPlan', () => {
    it('sets premium plan in localStorage', () => {
      setPlan('premium')
      expect(localStorage.getItem(PLAN_KEY)).toBe('premium')
    })

    it('removes plan key when set to free', () => {
      localStorage.setItem(PLAN_KEY, 'premium')
      setPlan('free')
      expect(localStorage.getItem(PLAN_KEY)).toBeNull()
    })
  })

  // -- Integration: free plan lifecycle --
  describe('free plan lifecycle', () => {
    it('allows exactly 3 uses then blocks', () => {
      expect(canUseAI()).toBe(true)
      expect(getRemainingAIUses()).toBe(3)

      recordAIUsage()
      expect(getRemainingAIUses()).toBe(2)

      recordAIUsage()
      expect(getRemainingAIUses()).toBe(1)

      recordAIUsage()
      expect(getRemainingAIUses()).toBe(0)
      expect(canUseAI()).toBe(false)
    })

    it('upgrading to premium unlocks after hitting limit', () => {
      // Exhaust free uses
      recordAIUsage()
      recordAIUsage()
      recordAIUsage()
      expect(canUseAI()).toBe(false)

      // Upgrade
      setPlan('premium')
      expect(canUseAI()).toBe(true)
      expect(getRemainingAIUses()).toBe(Infinity)
    })
  })
})

import { describe, it, expect, vi, afterEach } from 'vitest'
import { advancePastBillingDates } from '@/lib/billing'
import type { Subscription } from '@/lib/types'

function makeSub(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 'sub-1',
    user_id: 'user-1',
    name: 'Test Sub',
    amount: 10000,
    currency: 'KRW',
    billing_cycle: 'monthly',
    category: 'entertainment',
    next_billing_date: '2025-01-15',
    is_active: true,
    created_at: '2024-01-01',
    ...overrides,
  }
}

describe('advancePastBillingDates', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('advances a monthly subscription past today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-04-10'))

    const sub = makeSub({ next_billing_date: '2025-01-15' })
    const { subscriptions, updatedIds } = advancePastBillingDates([sub])

    expect(subscriptions[0].next_billing_date).toBe('2025-04-15')
    expect(updatedIds).toHaveLength(1)
    expect(updatedIds[0].next_billing_date).toBe('2025-04-15')
  })

  it('advances a yearly subscription correctly', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2027-03-01'))

    const sub = makeSub({
      billing_cycle: 'yearly',
      next_billing_date: '2025-06-01',
    })
    const { subscriptions } = advancePastBillingDates([sub])

    expect(subscriptions[0].next_billing_date).toBe('2027-06-01')
  })

  it('advances a weekly subscription correctly', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-02-10'))

    const sub = makeSub({
      billing_cycle: 'weekly',
      next_billing_date: '2025-01-06', // a Monday
    })
    const { subscriptions } = advancePastBillingDates([sub])

    // 2025-01-06 + 5 weeks = 2025-02-10 (exactly today) — should still advance
    // 01-06 -> 01-13 -> 01-20 -> 01-27 -> 02-03 -> 02-10
    // 02-10 is not < today (02-10), so loop stops at 02-10
    expect(subscriptions[0].next_billing_date).toBe('2025-02-10')
  })

  it('does not change a future billing date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-03-01'))

    const sub = makeSub({ next_billing_date: '2025-06-15' })
    const { updatedIds } = advancePastBillingDates([sub])

    expect(updatedIds).toHaveLength(0)
    expect(sub.next_billing_date).toBe('2025-06-15')
  })

  it('does not change today billing date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-15'))

    const sub = makeSub({ next_billing_date: '2025-06-15' })
    const { updatedIds } = advancePastBillingDates([sub])

    expect(updatedIds).toHaveLength(0)
  })

  it('skips inactive subscriptions even if date is past', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-01'))

    const sub = makeSub({
      is_active: false,
      next_billing_date: '2024-01-01',
    })
    const { updatedIds } = advancePastBillingDates([sub])

    expect(updatedIds).toHaveLength(0)
    expect(sub.next_billing_date).toBe('2024-01-01')
  })

  it('advances multiple past periods correctly for monthly', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-12-20'))

    const sub = makeSub({ next_billing_date: '2025-01-15' })
    const { subscriptions } = advancePastBillingDates([sub])

    // Jan 15 -> advances monthly until past Dec 20 -> Jan 15, 2026
    expect(subscriptions[0].next_billing_date).toBe('2026-01-15')
  })

  it('handles multiple subscriptions with mixed states', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-05-01'))

    const subs = [
      makeSub({ id: 'a', next_billing_date: '2025-01-10' }), // past — should advance
      makeSub({ id: 'b', next_billing_date: '2025-08-10' }), // future — untouched
      makeSub({ id: 'c', next_billing_date: '2024-11-10', is_active: false }), // inactive — skip
    ]

    const { updatedIds } = advancePastBillingDates(subs)

    expect(updatedIds).toHaveLength(1)
    expect(updatedIds[0].id).toBe('a')
    expect(subs[0].next_billing_date).toBe('2025-05-10')
    expect(subs[1].next_billing_date).toBe('2025-08-10')
    expect(subs[2].next_billing_date).toBe('2024-11-10')
  })

  it('returns the same array reference (mutates in-place)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-04-01'))

    const subs = [makeSub()]
    const { subscriptions } = advancePastBillingDates(subs)
    expect(subscriptions).toBe(subs)
  })

  it('returns empty updatedIds when given an empty array', () => {
    const { subscriptions, updatedIds } = advancePastBillingDates([])
    expect(subscriptions).toEqual([])
    expect(updatedIds).toEqual([])
  })
})

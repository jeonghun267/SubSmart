import { describe, it, expect } from 'vitest'
import { getCategoryInfo, CATEGORIES } from '@/lib/types'

describe('getCategoryInfo', () => {
  it('returns correct info for each known category', () => {
    expect(getCategoryInfo('entertainment')).toEqual({
      value: 'entertainment',
      label: '엔터테인먼트',
      icon: '🎬',
      color: '#EF4444',
    })

    expect(getCategoryInfo('music')).toEqual({
      value: 'music',
      label: '음악',
      icon: '🎵',
      color: '#F59E0B',
    })

    expect(getCategoryInfo('cloud')).toEqual({
      value: 'cloud',
      label: '클라우드/스토리지',
      icon: '☁️',
      color: '#6366F1',
    })
  })

  it('returns the last category (기타) for unknown values', () => {
    const fallback = getCategoryInfo('nonexistent')
    expect(fallback.value).toBe('other')
    expect(fallback.label).toBe('기타')
  })

  it('returns 기타 for empty string', () => {
    const result = getCategoryInfo('')
    expect(result.value).toBe('other')
  })

  it('is case-sensitive — uppercase does not match', () => {
    const result = getCategoryInfo('Entertainment')
    expect(result.value).toBe('other')
  })

  it('returns a result for every defined CATEGORIES entry', () => {
    for (const cat of CATEGORIES) {
      const info = getCategoryInfo(cat.value)
      expect(info).toBe(cat) // same reference since find returns the original object
    }
  })
})

describe('CATEGORIES', () => {
  it('has unique values', () => {
    const values = CATEGORIES.map((c) => c.value)
    expect(new Set(values).size).toBe(values.length)
  })

  it('last entry is "other" (used as fallback)', () => {
    const last = CATEGORIES[CATEGORIES.length - 1]
    expect(last.value).toBe('other')
  })
})

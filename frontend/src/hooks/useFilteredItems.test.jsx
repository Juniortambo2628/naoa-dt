import { renderHook } from '@testing-library/react'
import useFilteredItems from './useFilteredItems'

describe('useFilteredItems', () => {
  const items = [
    { name: 'Alice', email: 'alice@test.com' },
    { name: 'Bob', email: 'bob@test.com' },
    { name: 'Charlie', email: 'charlie@test.com' },
  ]

  it('filters items by search query', () => {
    const { result } = renderHook(() => useFilteredItems(items, 'alice'))
    expect(result.current).toHaveLength(1)
    expect(result.current[0].name).toBe('Alice')
  })

  it('returns all items when search is empty', () => {
    const { result } = renderHook(() => useFilteredItems(items, ''))
    expect(result.current).toHaveLength(3)
  })
})

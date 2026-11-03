import { renderHook } from '@testing-library/react'
import useViewportClamp from './useViewportClamp'

// A fake popover whose rect reflects the shift the hook has applied, the way a
// real element moves when the returned value is used as its `x` offset.
const popover = (left, width) => {
  const el = { shift: 0 }
  el.getBoundingClientRect = () => ({ left: left + el.shift, right: left + width + el.shift, width })
  return el
}

const VIEWPORT = 390

describe('useViewportClamp', () => {
  beforeEach(() => {
    Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, value: VIEWPORT })
  })

  it('does not move a popover that already fits', () => {
    const ref = { current: popover(40, 200) }
    const { result } = renderHook(() => useViewportClamp(ref, true))
    expect(result.current).toBe(0)
  })

  it('pulls a popover that runs off the right edge back on-screen', () => {
    // 155 + 320 = 475px, past a 390px phone screen.
    const ref = { current: popover(155, 320) }
    const { result } = renderHook(() => useViewportClamp(ref, true))
    expect(result.current).toBe(VIEWPORT - 12 - 475)
    expect(155 + 320 + result.current).toBeLessThanOrEqual(VIEWPORT - 12)
  })

  it('pushes a popover that starts off the left edge back on-screen', () => {
    const ref = { current: popover(-60, 200) }
    const { result } = renderHook(() => useViewportClamp(ref, true))
    expect(result.current).toBe(72)
  })

  it('keeps the start visible when the popover is wider than the screen', () => {
    const ref = { current: popover(100, 500) }
    const { result } = renderHook(() => useViewportClamp(ref, true))
    expect(100 + result.current).toBe(12)
  })

  it('returns 0 while closed', () => {
    const ref = { current: popover(155, 320) }
    const { result } = renderHook(() => useViewportClamp(ref, false))
    expect(result.current).toBe(0)
  })

  it('accounts for a shift it already applied when re-measuring', () => {
    const el = popover(155, 320)
    const ref = { current: el }
    const { result, rerender } = renderHook(({ open }) => useViewportClamp(ref, open), { initialProps: { open: true } })
    const first = result.current
    // Simulate the element having moved by the applied shift, then a resize.
    el.shift = first
    window.dispatchEvent(new Event('resize'))
    rerender({ open: true })
    expect(result.current).toBe(first)
  })
})

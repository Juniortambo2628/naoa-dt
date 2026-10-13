import { nudgeItems, alignItems, distributeItems, layerOrder, pickStyle, applyStyle, byLayerTopFirst } from './invitationItems'

const canvas = { width: 500, height: 625 }
const a = { id: 'a', x: 10, y: 10, width: 100, height: 50 }
const b = { id: 'b', x: 200, y: 100, width: 50, height: 50 }
const c = { id: 'c', x: 400, y: 300, width: 80, height: 20 }

describe('invitation item helpers', () => {
  it('nudges within the canvas and skips locked items', () => {
    expect(nudgeItems([a, { ...b, locked: true }], -20, 5, canvas)).toEqual([{ id: 'a', x: 0, y: 15 }])
  })

  it('aligns a selection to its bounds, a single item to the page', () => {
    expect(alignItems([a, b], 'left', canvas)).toEqual([{ id: 'a', x: 10 }, { id: 'b', x: 10 }])
    expect(alignItems([a, b], 'bottom', canvas)).toEqual([{ id: 'a', y: 100 }, { id: 'b', y: 100 }])
    expect(alignItems([a], 'center', canvas)).toEqual([{ id: 'a', x: 200 }])
  })

  it('distributes three or more items evenly', () => {
    const result = distributeItems([c, a, b], 'horizontal')
    expect(result.map((u) => u.id)).toEqual(['a', 'b', 'c'])
    expect(result[1].x).toBe(Math.round(10 + 100 + (470 - 230) / 2))
    expect(distributeItems([a, b], 'horizontal')).toEqual([])
  })

  it('maps panel order to z-index and sorts without mutating', () => {
    expect(layerOrder(['x', 'y'])).toEqual([{ id: 'x', zIndex: 20 }, { id: 'y', zIndex: 10 }])
    const items = [{ id: 1, zIndex: 1 }, { id: 2, zIndex: 5 }]
    expect(byLayerTopFirst(items).map((i) => i.id)).toEqual([2, 1])
    expect(items[0].id).toBe(1)
  })

  it('copies style and skips text-only keys for other types', () => {
    const style = pickStyle({ type: 'text', fontStyle: 'serif', color: '#111', opacity: 80, x: 5 })
    expect(style).toEqual({ fontStyle: 'serif', color: '#111', opacity: 80 })
    expect(applyStyle([{ id: 'f', type: 'frame' }], style)).toEqual([{ id: 'f', color: '#111', opacity: 80 }])
  })
})

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import AuthContext from '../../context/AuthContext'
import { SidePanelAside, SidePanelMobileBar } from './AdminSidePanel'

function asRole(role) {
  return function Wrapper({ children }) {
    return <AuthContext.Provider value={{ user: { id: 1, name: 'T', role } }}>{children}</AuthContext.Provider>
  }
}

const items = [
  { id: 'new', label: 'New question', fixed: true },
  { id: 1, label: 'Parking?' },
  { id: 2, label: 'Dress code?' },
  { id: 3, label: 'Kids?' },
]

function panelWith(overrides = {}) {
  return { id: `test-${Math.random()}`, title: 'Questions', items, activeId: 1, onChange: vi.fn(), ...overrides }
}

beforeEach(() => localStorage.clear())

describe('side panel reordering', () => {
  it('moves an item with the arrow keys on its handle and reports the new order', () => {
    const onReorder = vi.fn()
    render(<SidePanelAside panel={panelWith({ onReorder })} />, { wrapper: asRole('editor') })

    fireEvent.keyDown(screen.getByRole('button', { name: 'Reorder Kids?' }), { key: 'ArrowUp' })
    expect(onReorder).toHaveBeenCalledWith([1, 3, 2])
  })

  it('gives fixed items no handle', () => {
    render(<SidePanelAside panel={panelWith({ onReorder: vi.fn() })} />, { wrapper: asRole('editor') })
    expect(screen.queryByRole('button', { name: 'Reorder New question' })).toBeNull()
    expect(screen.getAllByRole('button', { name: /^Reorder / })).toHaveLength(3)
  })

  it('is not offered to viewers', () => {
    render(<SidePanelAside panel={panelWith({ onReorder: vi.fn() })} />, { wrapper: asRole('viewer') })
    expect(screen.queryByRole('button', { name: /^Reorder / })).toBeNull()
  })
})

describe('side panel bulk actions', () => {
  it('selects items and runs the action with their ids, then leaves select mode', async () => {
    const run = vi.fn().mockResolvedValue(2)
    const onChange = vi.fn()
    const action = { run, allowed: true, pending: false, isAdminAction: true }
    render(
      <SidePanelAside panel={panelWith({ onChange, bulkActions: [{ id: 'delete', label: 'Delete', action }] })} />,
      { wrapper: asRole('editor') },
    )

    fireEvent.click(screen.getByRole('button', { name: /Select/ }))
    // In select mode a click ticks the item instead of opening it.
    fireEvent.click(screen.getByRole('button', { name: 'Parking?' }))
    fireEvent.click(screen.getByRole('button', { name: 'Kids?' }))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Kids?' })).toHaveAttribute('aria-pressed', 'true')
    // Fixed items can't be selected.
    expect(screen.getByRole('button', { name: 'New question' })).not.toHaveAttribute('aria-pressed')

    const bar = screen.getByRole('region', { name: 'Selected items' })
    expect(within(bar).getByText('2 selected')).toBeInTheDocument()
    fireEvent.click(within(bar).getByRole('button', { name: 'Delete' }))

    expect(run).toHaveBeenCalledWith([1, 3])
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Selected items' })).toBeNull())
  })

  it('select all picks every selectable item', () => {
    const action = { run: vi.fn(), allowed: true, pending: false }
    render(<SidePanelAside panel={panelWith({ bulkActions: [{ id: 'delete', label: 'Delete', action }] })} />, { wrapper: asRole('editor') })
    fireEvent.click(screen.getByRole('button', { name: /Select/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Select all' }))
    expect(screen.getByText('3 selected')).toBeInTheDocument()
  })

  it('hides select mode when the viewer may not run any bulk action', () => {
    const action = { run: vi.fn(), allowed: false, pending: false }
    render(<SidePanelAside panel={panelWith({ bulkActions: [{ id: 'delete', label: 'Delete', action }] })} />, { wrapper: asRole('viewer') })
    expect(screen.queryByRole('button', { name: /Select/ })).toBeNull()
  })
})

describe('side panel on mobile', () => {
  it('offers a manage sheet with the full, reorderable list', () => {
    const onReorder = vi.fn()
    render(<SidePanelMobileBar panel={panelWith({ onReorder })} />, { wrapper: asRole('editor') })

    fireEvent.click(screen.getByRole('button', { name: 'Arrange or select questions' }))
    const sheet = screen.getByRole('dialog', { name: 'Questions' })
    fireEvent.keyDown(within(sheet).getByRole('button', { name: 'Reorder Parking?' }), { key: 'ArrowDown' })
    expect(onReorder).toHaveBeenCalledWith([2, 1, 3])
  })

  it('has no manage button when there is nothing to manage', () => {
    render(<SidePanelMobileBar panel={panelWith()} />, { wrapper: asRole('editor') })
    expect(screen.queryByRole('button', { name: /Arrange or select/ })).toBeNull()
  })
})

import { render, screen, fireEvent } from '@testing-library/react'
import AdminToolbarFilters, { countActiveFilters } from './AdminToolbarFilters'

const statusGroup = (value, onChange = vi.fn()) => ({
  id: 'status',
  label: 'Status',
  defaultValue: 'active',
  value,
  onChange,
  options: [
    { id: 'active', label: 'Pending + Confirmed' },
    { id: 'all', label: 'All' },
    { id: 'declined', label: 'Declined', count: 3 },
  ],
})

describe('AdminToolbarFilters', () => {
  it('counts only groups that differ from their default', () => {
    expect(countActiveFilters({ groups: [statusGroup('active')] })).toBe(0)
    expect(countActiveFilters({ groups: [statusGroup('all')] })).toBe(1)
    expect(countActiveFilters(null)).toBe(0)
  })

  it('opens the panel and applies a filter option', () => {
    const onChange = vi.fn()
    render(<AdminToolbarFilters filters={{ groups: [statusGroup('active', onChange)] }} />)

    fireEvent.click(screen.getByTitle('Filter & sort'))
    fireEvent.click(screen.getByRole('button', { name: /Declined/ }))
    expect(onChange).toHaveBeenCalledWith('declined')
  })

  it('names the active filter on the button and resets to defaults', () => {
    const onChange = vi.fn()
    render(<AdminToolbarFilters filters={{ groups: [statusGroup('declined', onChange)] }} />)

    expect(screen.getByTitle('Filter & sort')).toHaveTextContent('Declined')
    fireEvent.click(screen.getByTitle('Filter & sort'))
    fireEvent.click(screen.getByText('Reset to defaults'))
    expect(onChange).toHaveBeenCalledWith('active')
  })

  it('renders an inline view toggle', () => {
    const onChange = vi.fn()
    render(<AdminToolbarFilters filters={{ view: { options: ['list', 'grid'], value: 'list', onChange } }} />)

    fireEvent.click(screen.getByLabelText('Grid view'))
    expect(onChange).toHaveBeenCalledWith('grid')
    expect(screen.queryByTitle('Filter & sort')).not.toBeInTheDocument()
  })
})

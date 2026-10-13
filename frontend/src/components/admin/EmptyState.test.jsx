import { render, screen, fireEvent } from '@testing-library/react'
import EmptyState from './EmptyState'

describe('EmptyState', () => {
  it('renders the message', () => {
    render(<EmptyState message="No items found" />)
    expect(screen.getByText('No items found')).toBeInTheDocument()
  })

  it('renders skeleton rows while loading', () => {
    render(<EmptyState loading rows={3} />)
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
  })

  it('offers a next step when empty, but not for an empty search', () => {
    const onClick = vi.fn()
    const { rerender } = render(<EmptyState message="No gifts yet" action={{ label: 'Add gift', onClick }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add gift' }))
    expect(onClick).toHaveBeenCalled()

    rerender(<EmptyState message="No gifts yet" searchQuery="vase" action={{ label: 'Add gift', onClick }} />)
    expect(screen.queryByRole('button', { name: 'Add gift' })).not.toBeInTheDocument()
    expect(screen.getByText(/Nothing matches/)).toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import EmptyState from './EmptyState'

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState message="No items found" />)
    expect(screen.getByText('No items found')).toBeInTheDocument()
  })

  it('renders loading state', () => {
    const { container } = render(<EmptyState loading />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})

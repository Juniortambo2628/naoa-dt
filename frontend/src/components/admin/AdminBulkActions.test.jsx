import { render, screen, fireEvent } from '@testing-library/react'
import AdminBulkActions from './AdminBulkActions'
import { Mail, Trash2 } from 'lucide-react'

describe('AdminBulkActions', () => {
  const baseActions = [
    { id: 'email', label: 'Send Email', icon: Mail, onClick: vi.fn() },
    { id: 'delete', label: 'Delete', icon: Trash2, onClick: vi.fn(), variant: 'danger' },
  ]

  it('renders selected count', () => {
    render(<AdminBulkActions selectedCount={5} onClearSelection={() => {}} actions={baseActions} />)
    expect(screen.getByText('5 selected')).toBeInTheDocument()
  })

  it('shows correct action buttons', () => {
    render(<AdminBulkActions selectedCount={3} onClearSelection={() => {}} actions={baseActions} />)
    expect(screen.getByText('Send Email')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('calls onClick handler when action clicked', () => {
    const onClick = vi.fn()
    const actions = [{ id: 'email', label: 'Send Email', icon: Mail, onClick }]
    render(<AdminBulkActions selectedCount={1} onClearSelection={() => {}} actions={actions} />)
    fireEvent.click(screen.getByText('Send Email'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

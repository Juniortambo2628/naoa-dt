import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AdminFloatingToolbar from './AdminFloatingToolbar'
import { Save, Trash2 } from 'lucide-react'

describe('AdminFloatingToolbar', () => {
  const actions = [
    { id: 'save', label: 'Save', icon: Save, onClick: vi.fn(), variant: 'secondary' },
    { id: 'delete', label: 'Delete', icon: Trash2, onClick: vi.fn(), variant: 'danger' },
  ]

  it('renders when visible', () => {
    render(<AdminFloatingToolbar actions={actions} />)
    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  it('renders action buttons', () => {
    render(<AdminFloatingToolbar actions={actions} />)
    expect(screen.getByText('Save')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('calls onClick when action clicked', () => {
    const onClick = vi.fn()
    const acts = [{ id: 'save', label: 'Save', icon: Save, onClick, variant: 'secondary' }]
    render(<AdminFloatingToolbar actions={acts} />)
    fireEvent.click(screen.getByText('Save'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('hides when toggled', async () => {
    render(<AdminFloatingToolbar actions={actions} />)
    const hideButton = screen.getByTitle('Hide toolbar')
    fireEvent.click(hideButton)
    await waitFor(() => {
      expect(screen.queryByText('Save')).not.toBeInTheDocument()
    })
  })
})

describe('AdminFloatingToolbar shared search & filters', () => {
  it('renders the shared search box and filter button alongside actions', () => {
    render(
      <AdminFloatingToolbar
        actions={[{ id: 'save', label: 'Save', icon: Save, onClick: vi.fn() }]}
        search="Search guests…"
        filters={{ groups: [{ id: 's', options: [{ id: 'all', label: 'All' }, { id: 'x', label: 'X' }], value: 'all', onChange: vi.fn() }] }}
      />
    )
    expect(screen.getByPlaceholderText('Search guests…')).toBeInTheDocument()
    expect(screen.getByTitle('Filter & sort')).toBeInTheDocument()
    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  it('supports a page-local search value', () => {
    const onChange = vi.fn()
    render(<AdminFloatingToolbar search={{ placeholder: 'Find', value: 'abc', onChange }} />)
    fireEvent.change(screen.getByPlaceholderText('Find'), { target: { value: 'abcd' } })
    expect(onChange).toHaveBeenCalledWith('abcd')
  })
})

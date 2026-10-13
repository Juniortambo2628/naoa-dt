import { render, screen, fireEvent } from '@testing-library/react'
import InvitationPageMenu from './InvitationPageMenu'

const pages = [{ id: 'a' }, { id: 'b', name: 'RSVP' }]
const handlers = () => ({
  onGoTo: vi.fn(), onAdd: vi.fn(), onDuplicate: vi.fn(), onDelete: vi.fn(),
  onMove: vi.fn(), onReorder: vi.fn(), onRename: vi.fn(),
})

describe('InvitationPageMenu', () => {
  it('shows the current page and steps between pages', () => {
    const h = handlers()
    render(<InvitationPageMenu pages={pages} currentPage={0} {...h} />)
    expect(screen.getByTitle(/Pages/)).toHaveTextContent('Page 1')
    expect(screen.getByTitle(/Pages/)).toHaveTextContent('1/2')
    fireEvent.click(screen.getByLabelText('Next page'))
    expect(h.onGoTo).toHaveBeenCalledWith(1)
  })

  it('lists pages and moves, renames and adds from the dropdown', () => {
    const h = handlers()
    render(<InvitationPageMenu pages={pages} currentPage={0} {...h} />)
    fireEvent.click(screen.getByTitle(/Pages/))
    fireEvent.click(screen.getByRole('menuitemradio', { name: /RSVP/ }))
    expect(h.onGoTo).toHaveBeenCalledWith(1)

    fireEvent.click(screen.getByTitle(/Pages/))
    fireEvent.click(screen.getByLabelText('Move Page 1 down'))
    expect(h.onMove).toHaveBeenCalledWith(0, 1)

    fireEvent.click(screen.getByLabelText('Rename RSVP'))
    const input = screen.getByLabelText('Rename page 2')
    fireEvent.change(input, { target: { value: 'Reply' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(h.onRename).toHaveBeenCalledWith(1, 'Reply')

    fireEvent.click(screen.getByText('Add page'))
    expect(h.onAdd).toHaveBeenCalled()
  })
})

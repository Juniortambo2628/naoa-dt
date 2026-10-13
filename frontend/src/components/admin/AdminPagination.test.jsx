import { render, screen, fireEvent } from '@testing-library/react'
import AdminPagination, { pageWindow } from './AdminPagination'

describe('AdminPagination', () => {
  it('windows long page ranges with gaps', () => {
    expect(pageWindow(1, 3)).toEqual([1, 2, 3])
    expect(pageWindow(5, 10)).toEqual([1, 'gap-4', 4, 5, 6, 'gap-10', 10])
  })

  it('shows the visible range and changes page', () => {
    const onPageChange = vi.fn()
    render(<AdminPagination currentPage={2} pageSize={10} totalItems={35} onPageChange={onPageChange} />)

    expect(screen.getByText(/of/).parentElement).toHaveTextContent('11–20 of 35')
    fireEvent.click(screen.getByLabelText('Next page'))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('renders nothing for an empty list', () => {
    const { container } = render(<AdminPagination currentPage={1} pageSize={10} totalItems={0} onPageChange={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })
})

import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SearchProvider } from '../../context/SearchContext'
import AdminEnquiries from './AdminEnquiries'

const enquiries = [
  { id: 1, name: 'Ann', email: 'a@x.test', subject: 'Parking', message: 'Hi', type: 'guest', status: 'pending', created_at: '2026-10-01' },
  { id: 2, name: 'Bea Florals', email: 'b@x.test', subject: 'Flowers', message: 'Hi', type: 'vendor', status: 'replied', created_at: '2026-10-02' },
  { id: 3, name: 'Cal', email: 'c@x.test', subject: 'Lift', message: 'Hi', type: 'transport', status: 'pending', created_at: '2026-10-03' },
]
vi.mock('../../hooks/useApiHooks', () => ({
  useEnquiries: () => ({ data: { data: enquiries }, isLoading: false, refetch: vi.fn() }),
}))

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <SearchProvider><AdminEnquiries /></SearchProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const panel = () => screen.getByRole('complementary', { name: 'Enquiries' })
const shown = (name) => screen.queryAllByText(name).length > 0

describe('Enquiries side panel', () => {
  it('counts each view and filters the list by the one picked', () => {
    renderPage()
    expect(within(panel()).getByRole('button', { name: /Awaiting reply\s*2/ })).toBeInTheDocument()

    fireEvent.click(within(panel()).getByRole('button', { name: /Vendors/ }))
    expect(shown('Bea Florals')).toBe(true)
    expect(shown('Ann')).toBe(false)

    // "Other" is anything that isn't a guest or a vendor.
    fireEvent.click(within(panel()).getByRole('button', { name: /Other/ }))
    expect(shown('Cal')).toBe(true)
    expect(shown('Bea Florals')).toBe(false)
  })
})

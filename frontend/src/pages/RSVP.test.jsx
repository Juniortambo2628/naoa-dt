import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RSVP from './RSVP'

// jsdom has no IntersectionObserver (used by the page's scroll animations).
globalThis.IntersectionObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
}

const getByCode = vi.fn()
vi.mock('../services/api', () => ({
  guestService: { getByCode: (...a) => getByCode(...a), submitRSVP: vi.fn() },
  contentService: { getAll: () => Promise.resolve({ data: {} }) },
  getAssetUrl: (p) => p,
}))

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/rsvp" element={<RSVP />} />
        <Route path="/rsvp/:code" element={<RSVP />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RSVP page', () => {
  beforeEach(() => {
    localStorage.clear()
    getByCode.mockReset().mockResolvedValue({ data: { name: 'Kevin', unique_code: 'ABC123', rsvp_status: 'pending' } })
  })

  it('renders the code form without crashing', async () => {
    renderAt('/rsvp')
    expect(await screen.findByLabelText(/code/i)).toBeInTheDocument()
    expect(getByCode).not.toHaveBeenCalled()
  })

  it('looks up a code from the URL and remembers it', async () => {
    renderAt('/rsvp/ABC123')
    await waitFor(() => expect(getByCode).toHaveBeenCalledWith('ABC123'))
    await waitFor(() => expect(localStorage.getItem('guestInviteCode')).toBe('ABC123'))
  })

  it('reuses the code remembered on this device', async () => {
    localStorage.setItem('guestInviteCode', 'ABC123')
    renderAt('/rsvp')
    await waitFor(() => expect(getByCode).toHaveBeenCalledWith('ABC123'))
  })
})

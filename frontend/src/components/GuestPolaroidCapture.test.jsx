import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import GuestPolaroidCapture from './GuestPolaroidCapture';
import { polaroidService } from '../services/api';

vi.mock('../utils/feedback', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, confirmAction: vi.fn(async () => true) }
})

const minePhoto = (id, caption = '') => ({
  id,
  full_image_url: `http://localhost:8005/storage/polaroids/${id}.jpg`,
  image_path: `/storage/polaroids/${id}.jpg`,
  caption,
  guest_name: 'Nelly Okanda',
  taken_at: '2026-11-06T10:00:00+00:00',
  reactions: { count: 0, by_emoji: {}, mine: null },
  views: 0,
})

function renderPanel() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <GuestPolaroidCapture guestCode="ABC1234" />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('GuestPolaroidCapture', () => {
  beforeEach(() => localStorage.clear())

  afterEach(() => vi.restoreAllMocks())

  it('opens the camera straight away, without an intro panel first', async () => {
    vi.spyOn(polaroidService, 'mine').mockResolvedValue({ data: [] })

    renderPanel()

    // No "Open camera" prompt in front of it: the studio mounts immediately.
    expect(screen.getByRole('dialog', { name: 'Snap Studio' })).toBeInTheDocument()
  })

  it('lists the photos this device shared after the studio closes', async () => {
    vi.spyOn(polaroidService, 'mine').mockResolvedValue({
      data: [minePhoto(11, 'Sunset'), minePhoto(12)],
    })

    renderPanel()
    fireEvent.click(screen.getByLabelText('Close Snap Studio'))

    expect(await screen.findByText('2 shared')).toBeInTheDocument()
    expect(screen.getByLabelText('Delete photo "Sunset"')).toBeInTheDocument()
    expect(screen.getByLabelText('Delete photo')).toBeInTheDocument()
  })

  it('shows an empty state when nothing has been shared', async () => {
    vi.spyOn(polaroidService, 'mine').mockResolvedValue({ data: [] })

    renderPanel()
    fireEvent.click(screen.getByLabelText('Close Snap Studio'))

    expect(await screen.findByText(/Nothing shared yet/)).toBeInTheDocument()
  })

  it('deletes a photo after confirming, and removes it from the grid', async () => {
    vi.spyOn(polaroidService, 'mine').mockResolvedValue({
      data: [minePhoto(11), minePhoto(12)],
    })
    const deleteMine = vi.spyOn(polaroidService, 'deleteMine').mockResolvedValue({ data: {} })

    renderPanel()
    fireEvent.click(screen.getByLabelText('Close Snap Studio'))

    const first = await screen.findAllByLabelText(/^Delete photo/)
    fireEvent.click(first[0])

    await waitFor(() => expect(deleteMine).toHaveBeenCalledWith(11, 'ABC1234'))
    await waitFor(() => expect(screen.getAllByLabelText(/^Delete photo/)).toHaveLength(1))
  })

  it('never calls the API without a device code', async () => {
    vi.spyOn(polaroidService, 'mine').mockResolvedValue({ data: [] })

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <GuestPolaroidCapture />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    fireEvent.click(screen.getByLabelText('Close Snap Studio'))

    await waitFor(() => expect(screen.getByText(/Nothing shared yet/)).toBeInTheDocument())
    expect(polaroidService.mine).not.toHaveBeenCalled()
  })
})

import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import PolaroidFeed from './PolaroidFeed';
import { polaroidService } from '../services/api';

vi.mock('../hooks/useSmartPolling', () => ({
  useSmartPolling: () => ({ hasNewItems: false }),
}))

const PHOTO = {
  id: 1,
  full_image_url: 'http://localhost:8005/storage/polaroids/1.jpg',
  image_path: '/storage/polaroids/1.jpg',
  caption: 'I do',
  location: 'Garden',
  guest_name: null,
  taken_at: '2026-11-06T10:00:00+00:00',
  reactions: { count: 0, by_emoji: {}, mine: null },
  views: 0,
}

const STORY = {
  key: 'couple',
  author: 'The couple',
  is_couple: true,
  latest_at: '2026-11-06 10:00:00',
  items: [{ ...PHOTO, author: 'The couple' }],
}

function LocationProbe() {
  const location = useLocation()
  return <span data-testid="location">{location.pathname + location.search}</span>
}

function renderFeed(initialEntry = '/programme', { stories = [STORY] } = {}) {
  vi.spyOn(polaroidService, 'getAll').mockResolvedValue({ data: [PHOTO] })
  vi.spyOn(polaroidService, 'stories').mockResolvedValue({ data: { stories, total: stories.length } })

  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <QueryClientProvider client={new QueryClient()}>
        <LocationProbe />
        <PolaroidFeed />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('PolaroidFeed story entry', () => {
  afterEach(() => vi.restoreAllMocks())

  it('opens the viewer when arriving with ?stories=1, then drops the param', async () => {
    renderFeed('/programme?stories=1')

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    // The invite deep-links once; a refresh shouldn't reopen the viewer.
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/programme'))
    expect(screen.getByText(/1 of 1/)).toBeInTheDocument()
  })

  it('shows the tray without opening the viewer for a plain visit', async () => {
    renderFeed('/programme')

    expect(await screen.findByText('Stories')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('ignores the param when there are no stories to show', async () => {
    // (Passed through renderFeed, which would otherwise stub one story.)
    renderFeed('/programme?stories=1', { stories: [] })

    expect(await screen.findByText('Captured Moments')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    // The flag stays put rather than opening an empty viewer.
    expect(screen.getByTestId('location')).toHaveTextContent('/programme?stories=1')
  })
})

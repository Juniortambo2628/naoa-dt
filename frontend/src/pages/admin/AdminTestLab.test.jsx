import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SearchProvider } from '../../context/SearchContext'
import AdminTestLab from './AdminTestLab'
import { testLabService } from '../../services/api'

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <SearchProvider><AdminTestLab /></SearchProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

// The layout renders the section switcher twice (desktop aside + mobile chip
// bar), so pick the first match rather than requiring a unique one.
const openSimulations = () => fireEvent.click(screen.getAllByRole('button', { name: /Simulations/ })[0])

describe('Test Lab — song request tests', () => {
  beforeEach(() => {
    // The page checks API health and entity counts on mount.
    vi.spyOn(testLabService, 'healthCheck').mockResolvedValue({
      data: {
        status: 'healthy',
        checks: { database: { status: 'ok', message: 'Connected' } },
        timestamp: '2026-11-06T00:00:00.000Z',
      },
    })
    vi.spyOn(testLabService, 'getStats').mockResolvedValue({ data: { guests: 3 } })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('submits a simulated song request and logs the result', async () => {
    vi.spyOn(testLabService, 'simulateSongRequest').mockResolvedValue({
      data: { song_title: 'Perfect', artist: 'Ed Sheeran' },
    })

    renderPage()
    openSimulations()

    fireEvent.change(screen.getByLabelText('Song title'), { target: { value: 'Perfect' } })
    fireEvent.change(screen.getByLabelText('Artist'), { target: { value: 'Ed Sheeran' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit Test Request' }))

    await waitFor(() =>
      expect(testLabService.simulateSongRequest).toHaveBeenCalledWith({
        song_title: 'Perfect',
        artist: 'Ed Sheeran',
        guest_name: undefined,
      }),
    )
    await waitFor(() => expect(screen.getByText(/Song request simulated/)).toBeInTheDocument())

    // The form clears itself so the next test request starts clean.
    expect(screen.getByLabelText('Song title')).toHaveValue('')
  })

  it('needs a song title before it will submit', () => {
    vi.spyOn(testLabService, 'simulateSongRequest').mockResolvedValue({ data: {} })

    renderPage()
    openSimulations()

    expect(screen.getByRole('button', { name: 'Submit Test Request' })).toBeDisabled()
  })

  it('runs the feature tests and renders the step checklist', async () => {
    vi.spyOn(testLabService, 'songRequestChecks').mockResolvedValue({
      data: {
        passed: 6,
        failed: 0,
        steps: [
          { name: 'Create a test request', status: 'ok', message: 'Saved request #1' },
          { name: 'Mark as played', status: 'ok', message: 'is_played=true with played_at' },
          { name: 'Delete and leave no trace', status: 'ok', message: 'Cleaned up' },
        ],
      },
    })

    renderPage()
    openSimulations()

    fireEvent.click(screen.getByRole('button', { name: 'Run Song Request Tests' }))

    await waitFor(() => expect(testLabService.songRequestChecks).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.getByText('Song Request Test Results')).toBeInTheDocument())

    expect(screen.getByText('6/6 passed')).toBeInTheDocument()
    expect(screen.getByText('Create a test request')).toBeInTheDocument()
    expect(screen.getByText('Mark as played')).toBeInTheDocument()
    expect(screen.getByText('Delete and leave no trace')).toBeInTheDocument()
    expect(screen.getByText(/All 6 song request checks passed/)).toBeInTheDocument()
  })

  it('shows a failed run red in the checklist', async () => {
    vi.spyOn(testLabService, 'songRequestChecks').mockResolvedValue({
      data: {
        passed: 5,
        failed: 1,
        steps: [
          { name: 'Create a test request', status: 'ok', message: 'Saved request #1' },
          { name: 'Counted as pending in the stats', status: 'error', message: 'Stats do not count it as pending' },
        ],
      },
    })

    renderPage()
    openSimulations()

    fireEvent.click(screen.getByRole('button', { name: 'Run Song Request Tests' }))

    await waitFor(() => expect(screen.getByText('5/6 passed')).toBeInTheDocument())
    expect(screen.getByText('Stats do not count it as pending')).toBeInTheDocument()
    expect(screen.getByText(/1 of 6 song request checks failed/)).toBeInTheDocument()
  })
})

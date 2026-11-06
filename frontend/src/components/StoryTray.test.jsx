import { fireEvent, render, screen } from '@testing-library/react';
import StoryTray from './StoryTray';
import { markSeen } from '../utils/stories';

/** A SQL-style date (what the API returns) at now + offset. */
const sqlDate = (offsetMs) =>
  new Date(Date.now() + offsetMs).toISOString().slice(0, 19).replace('T', ' ')

const HOUR = 60 * 60 * 1000

const makeStory = (key, author, latestAt, itemId) => ({
  key,
  author,
  is_couple: key === 'couple',
  latest_at: latestAt,
  items: [
    {
      id: itemId,
      image: `http://localhost:8005/storage/polaroids/${itemId}.jpg`,
      image_path: `/storage/polaroids/${itemId}.jpg`,
      caption: '',
      location: '',
      author,
      taken_at: latestAt,
      reactions: { count: 0, by_emoji: {}, mine: null },
      views: 0,
    },
  ],
})

describe('StoryTray', () => {
  beforeEach(() => localStorage.clear())

  it('splits stories into Today and Earlier without losing their index', () => {
    const older = makeStory('g:kev', 'Kevin T', sqlDate(-3 * 24 * HOUR), 101)
    const fresh = makeStory('g:nel', 'Nelly', sqlDate(-2 * HOUR), 102)
    const onOpen = vi.fn()

    render(<StoryTray stories={[older, fresh]} onOpen={onOpen} />)

    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByText('Earlier')).toBeInTheDocument()

    // Circles still open the story at its index in the original array —
    // that index is what the viewer is handed.
    fireEvent.click(screen.getByLabelText(/Watch Nelly/))
    expect(onOpen).toHaveBeenLastCalledWith(1)

    fireEvent.click(screen.getByLabelText(/Watch Kevin T/))
    expect(onOpen).toHaveBeenLastCalledWith(0)
  })

  it('renders a single section when every story is fresh', () => {
    const fresh = makeStory('g:nel', 'Nelly', sqlDate(-HOUR), 101)

    render(<StoryTray stories={[fresh]} onOpen={vi.fn()} />)

    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.queryByText('Earlier')).not.toBeInTheDocument()
  })

  it('counts unwatched photos and opens the first story', () => {
    const a = makeStory('g:a', 'Nelly', sqlDate(-HOUR), 101)
    const b = makeStory('g:b', 'Kevin T', sqlDate(-2 * HOUR), 102)
    const onOpen = vi.fn()

    render(<StoryTray stories={[a, b]} onOpen={onOpen} />)

    const watchAll = screen.getByRole('button', { name: /Watch all/ })
    expect(watchAll).toHaveTextContent('2') // both photos unseen
    expect(screen.getAllByLabelText(/, new photos/)).toHaveLength(2)

    fireEvent.click(watchAll)
    expect(onOpen).toHaveBeenCalledWith(0)
  })

  it('drops the "new" ring once a story has been watched', () => {
    markSeen([101, 101]) // whatever is marked in this device's storage

    const watched = makeStory('g:nel', 'Nelly', sqlDate(-HOUR), 101)
    render(<StoryTray stories={[watched]} onOpen={vi.fn()} />)

    expect(screen.getByLabelText(/Watch Nelly's story$/)).toBeInTheDocument()
    expect(screen.queryByText(/, new photos/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Watch all/ })).not.toHaveTextContent(/\d/)
  })
})

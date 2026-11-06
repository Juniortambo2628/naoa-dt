import { fireEvent, render, screen } from '@testing-library/react';
import StoryViewer from './StoryViewer';
import { polaroidService } from '../services/api';
import { REACTIONS, STORY_DURATION_MS } from '../utils/stories';

const photo = (id, caption, extra = {}) => ({
  id,
  image: `http://localhost:8005/storage/polaroids/${id}.jpg`,
  image_path: `/storage/polaroids/${id}.jpg`,
  caption,
  location: '',
  author: 'The couple',
  taken_at: '2026-11-02T10:00:00+00:00',
  reactions: { count: 0, by_emoji: {}, mine: null },
  ...extra,
});

const stories = [
  {
    key: 'couple',
    author: 'The couple',
    is_couple: true,
    latest_at: '2026-11-02T10:00:00+00:00',
    items: [
      photo(1, 'I do', { reactions: { count: 2, by_emoji: { '❤️': 2 }, mine: null } }),
      photo(2, 'First dance'),
    ],
  },
  {
    key: 'g:abc123',
    author: 'Nelly Okanda',
    is_couple: false,
    latest_at: '2026-11-03T09:00:00+00:00',
    items: [photo(3, 'Sunset')],
  },
];

describe('StoryViewer', () => {
  afterEach(() => vi.restoreAllMocks())

  it('shows the story, its photos and the reaction bar', () => {
    render(<StoryViewer stories={stories} onClose={vi.fn()} />)

    expect(screen.getByRole('dialog')).toHaveAccessibleName('Story from The couple')
    expect(screen.getByText('I do')).toBeInTheDocument()
    expect(screen.getByText(/\b1 of 2\b/)).toBeInTheDocument()
    // One segment per photo in this author's story…
    expect(screen.getByLabelText('Next photo')).toBeInTheDocument()
    // …and the full offered reaction set.
    expect(screen.getAllByRole('button', { name: /^React / })).toHaveLength(REACTIONS.length)
    expect(screen.getByText('2 reactions')).toBeInTheDocument()
  })

  it('advances within a story, then to the next author', () => {
    render(<StoryViewer stories={stories} onClose={vi.fn()} />)

    fireEvent.click(screen.getByLabelText('Next photo'))
    expect(screen.getByText('First dance')).toBeInTheDocument()
    expect(screen.getByText(/\b2 of 2\b/)).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Next photo'))
    expect(screen.getByText('Nelly Okanda')).toBeInTheDocument()
    expect(screen.getByText('Sunset')).toBeInTheDocument()
  })

  it('goes back to the previous photo of the previous story', () => {
    render(<StoryViewer stories={stories} initialIndex={1} onClose={vi.fn()} />)

    expect(screen.getByText('Sunset')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Previous photo'))
    // Backwards into the newest photo of the previous author.
    expect(screen.getByText('First dance')).toBeInTheDocument()
    expect(screen.getByText('The couple')).toBeInTheDocument()
  })

  it('tapping a reaction posts it and marks the button active', async () => {
    const addReaction = vi.spyOn(polaroidService, 'addReaction').mockResolvedValue({
      data: { count: 3, by_emoji: { '❤️': 3 }, mine: '❤️' },
    })

    render(<StoryViewer stories={stories} guestCode="ABC1234" onClose={vi.fn()} />)

    fireEvent.click(screen.getByLabelText('React ❤️'))

    expect(addReaction).toHaveBeenCalledWith(1, { emoji: '❤️', guest_code: 'ABC1234' })
    expect(await screen.findByLabelText('React ❤️ (yours)')).toBeInTheDocument()
    expect(screen.getByText('3 reactions')).toBeInTheDocument()
  })

  it('tapping the active reaction again removes it', async () => {
    vi.spyOn(polaroidService, 'addReaction').mockResolvedValue({
      data: { count: 1, by_emoji: { '❤️': 1 }, mine: '❤️' },
    })
    const removeReaction = vi.spyOn(polaroidService, 'removeReaction').mockResolvedValue({
      data: { count: 0, by_emoji: {}, mine: null },
    })

    render(<StoryViewer stories={stories} guestCode="ABC1234" onClose={vi.fn()} />)

    fireEvent.click(screen.getByLabelText('React ❤️'))
    await screen.findByLabelText('React ❤️ (yours)')

    fireEvent.click(screen.getByLabelText('React ❤️ (yours)'))
    expect(removeReaction).toHaveBeenCalledWith(1, { guest_code: 'ABC1234' })
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<StoryViewer stories={stories} onClose={onClose} />)

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('uses the configured auto-advance duration', () => {
    render(<StoryViewer stories={stories} onClose={vi.fn()} />)

    const progress = document.querySelector('[style*="story-progress"]')
    expect(progress).not.toBeNull()
    expect(progress.style.animationDuration).toBe(`${STORY_DURATION_MS}ms`)
  })
})

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SnapStudio from './SnapStudio';
import { polaroidService } from '../services/api';

vi.mock('browser-image-compression', () => ({
  default: vi.fn(async (file) => file),
}))

const jpg = (name = 'one.jpg') => new File([new Uint8Array([255, 216, 255])], name, { type: 'image/jpeg' })

beforeAll(() => {
  // jsdom has neither a camera stream nor object URLs.
  URL.createObjectURL = vi.fn(() => 'blob:snap')
  URL.revokeObjectURL = vi.fn()
})

const openStudio = (props = {}) =>
  render(<SnapStudio guestCode="ABC1234" guestName="Nelly Okanda" onClose={vi.fn()} {...props} />)

const pickFiles = (files) => {
  const input = document.querySelector('input[type="file"]')
  fireEvent.change(input, { target: { files } })
}

describe('SnapStudio', () => {
  it('falls back to the file picker when there is no camera', async () => {
    openStudio()

    expect(await screen.findByText('Camera unavailable')).toBeInTheDocument()
    expect(screen.getByLabelText('Choose photos from your device')).toBeInTheDocument()
  })

  it('lists captured shots for review and lets you drop one', async () => {
    openStudio()
    await screen.findByText('Camera unavailable')

    pickFiles([jpg('a.jpg'), jpg('b.jpg')])

    expect(await screen.findAllByLabelText('Remove this photo from the selection')).toHaveLength(2)
    expect(screen.getByRole('button', { name: /^Share/ })).toHaveTextContent('Share 2')

    fireEvent.click(screen.getAllByLabelText('Remove this photo from the selection')[0])

    expect(screen.getAllByLabelText('Keep this photo')).toHaveLength(1)
    expect(screen.getByRole('button', { name: /^Share/ })).toHaveTextContent('Share 1')
  })

  it('shares the selected photos with the guest identity and caption', async () => {
    const batchUpload = vi.spyOn(polaroidService, 'batchUpload').mockResolvedValue({ data: [{}] })

    openStudio()
    await screen.findByText('Camera unavailable')
    pickFiles([jpg('a.jpg')])

    fireEvent.change(screen.getByPlaceholderText(/Add a caption/), {
      target: { value: 'Sunset drinks' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^Share/ }))

    await waitFor(() => expect(batchUpload).toHaveBeenCalledTimes(1))

    const [form] = batchUpload.mock.calls[0]
    expect(form.getAll('images[]')).toHaveLength(1)
    expect(form.get('guest_name')).toBe('Nelly Okanda')
    expect(form.get('guest_code')).toBe('ABC1234')
    expect(form.get('caption')).toBe('Sunset drinks')

    expect(await screen.findByText('Shared to Captured Moments!')).toBeInTheDocument()
  })

  it('reports a failed share without losing the photos', async () => {
    vi.spyOn(polaroidService, 'batchUpload').mockRejectedValue({
      response: { data: { message: 'Too many photos' } },
    })

    openStudio()
    await screen.findByText('Camera unavailable')
    pickFiles([jpg('a.jpg')])

    fireEvent.click(screen.getByRole('button', { name: /^Share/ }))

    expect(await screen.findByText('Too many photos')).toBeInTheDocument()
    // Still on the review grid — the guest can retry or discard.
    expect(screen.getByLabelText('Remove this photo from the selection')).toBeInTheDocument()
  })

  it('holds a burst share at ten photos', async () => {
    openStudio()
    await screen.findByText('Camera unavailable')

    pickFiles(Array.from({ length: 12 }, (_, i) => jpg(`shot-${i}.jpg`)))

    expect(await screen.findAllByLabelText('Remove this photo from the selection')).toHaveLength(10)
    expect(screen.getByText(/maximum of 10 per share/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Share/ })).toHaveTextContent('Share 10')
  })
})

import { render, screen, fireEvent } from '@testing-library/react'
import GiftImage from './GiftImage'

describe('GiftImage', () => {
  it('shows the photo when it loads', () => {
    render(<GiftImage src="https://example.com/mixer.jpg" alt="Mixer" />)
    expect(screen.getByRole('img', { name: 'Mixer' }).tagName).toBe('IMG')
  })

  it('falls back to a placeholder when the photo fails', () => {
    render(<GiftImage src="https://example.com/gone.jpg" alt="Mixer" />)
    fireEvent.error(screen.getByRole('img', { name: 'Mixer' }))
    expect(screen.getByRole('img', { name: 'Mixer' }).tagName).toBe('DIV')
  })

  it('uses the placeholder when there is no photo', () => {
    render(<GiftImage alt="Honeymoon Fund" />)
    expect(screen.getByRole('img', { name: 'Honeymoon Fund' }).tagName).toBe('DIV')
  })
})

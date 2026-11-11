import { render, screen } from '@testing-library/react'
import CardReveal from './CardReveal'

describe('CardReveal', () => {
  it('shows the guest their personal card', () => {
    render(<CardReveal guestName="Amina" coupleNames="Dinah & Tze Ren" dateText="Saturday, November 14, 2026" venue="Zereneti Gardens" />)
    expect(screen.getByText('Dear Amina,')).toBeInTheDocument()
    expect(screen.getByText('Dinah & Tze Ren')).toBeInTheDocument()
    expect(screen.getByText('Zereneti Gardens')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument()
  })
})

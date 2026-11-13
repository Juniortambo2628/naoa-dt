import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import GuestQuickActions from './GuestQuickActions'

const renderBar = (settings = null) => render(
  <MemoryRouter>
    <GuestQuickActions guestCode="ABC123" settings={settings} />
  </MemoryRouter>,
)

describe('GuestQuickActions bottom bar', () => {
  it('shows Invite, four shortcuts and More', () => {
    renderBar({ mpesa_stk_enabled: true })
    const bar = screen.getByRole('navigation', { name: 'Guest quick actions' })
    for (const label of ['Invite', 'Pass', 'Events', 'Gift', 'Snap', 'More']) {
      expect(bar).toContainElement(screen.getByRole('button', { name: label }))
    }
  })

  it('without cash gifts the seating chart takes the free slot', () => {
    renderBar()
    expect(screen.queryByRole('button', { name: 'Gift' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Seating' })).toBeInTheDocument()
  })

  it('Pass shows the guest entry QR', () => {
    renderBar({ mpesa_stk_enabled: true })
    fireEvent.click(screen.getByRole('button', { name: 'Pass' }))
    expect(screen.getAllByText(/Entry pass/i).length).toBeGreaterThan(0)
    expect(screen.getByTitle('Your entry QR code')).toBeInTheDocument()
  })

  it('More opens the remaining tools', () => {
    renderBar({ mpesa_stk_enabled: true })
    fireEvent.click(screen.getByRole('button', { name: 'More' }))
    for (const label of ['Where are you', 'My travel details', 'Seating chart', 'Watch stories']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
  })
})

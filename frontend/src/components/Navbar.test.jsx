import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navbar from './Navbar'

vi.mock('../context/ContentContext', () => ({ useContent: () => ({ isVisible: () => true }) }))
vi.mock('./LanguageSwitcher', () => ({ default: () => null }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }))

const renderNav = () => render(<MemoryRouter><Navbar /></MemoryRouter>)

describe('Navbar', () => {
  beforeEach(() => localStorage.clear())

  it('offers RSVP to guests who have not opened an invitation here', () => {
    renderNav()
    expect(screen.getAllByRole('link', { name: /rsvp/i }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('link', { name: /my invit/i })).toBeNull()
  })

  it('links back to the remembered invitation instead', () => {
    localStorage.setItem('guestInviteCode', 'ABC123')
    renderNav()
    const links = screen.getAllByRole('link', { name: /my invit/i })
    expect(links.length).toBeGreaterThan(0)
    links.forEach((l) => expect(l).toHaveAttribute('href', '/invitation/ABC123'))
  })
})

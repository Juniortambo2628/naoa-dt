import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navbar from './Navbar'

const content = { settings: { wedding_phase: 'before' } }
vi.mock('../context/ContentContext', () => ({ useContent: () => ({ isVisible: () => true, settings: content.settings, contents: {} }) }))
vi.mock('./LanguageSwitcher', () => ({ default: () => null }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }))

const renderNav = () => render(<MemoryRouter><Navbar /></MemoryRouter>)

describe('Navbar', () => {
  beforeEach(() => { localStorage.clear(); content.settings = { wedding_phase: 'before' } })

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

  it('points to the photos once the wedding is over', () => {
    content.settings = { wedding_phase: 'after' }
    renderNav()
    const links = screen.getAllByRole('link', { name: /photos/i })
    expect(links.length).toBeGreaterThan(0)
    links.forEach((l) => expect(l).toHaveAttribute('href', '/gallery'))
    expect(screen.queryByRole('link', { name: /rsvp/i })).toBeNull()
  })
})

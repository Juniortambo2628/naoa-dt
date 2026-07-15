import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import AdminPageHero from './AdminPageHero'

const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>)

describe('AdminPageHero', () => {
  it('renders title', () => {
    renderWithRouter(<AdminPageHero title="Guests" />)
    expect(screen.getByRole('heading', { name: 'Guests' })).toBeInTheDocument()
  })

  it('renders breadcrumb', () => {
    renderWithRouter(<AdminPageHero title="Guests" breadcrumb="Guests" />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getAllByText('Guests').length).toBeGreaterThan(0)
  })

  it('renders description', () => {
    renderWithRouter(<AdminPageHero title="Guests" description="Manage your guests" />)
    expect(screen.getByText('Manage your guests')).toBeInTheDocument()
  })
})

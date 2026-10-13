import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Link } from 'react-router-dom'
import { Save } from 'lucide-react'
import Button from './Button'
import { buttonClass, BUTTON_VARIANTS } from './buttonStyles'

describe('Button', () => {
  it('defaults to the white bordered primary style and type="button"', () => {
    render(<Button>Refresh</Button>)
    const btn = screen.getByRole('button', { name: 'Refresh' })
    expect(btn).toHaveAttribute('type', 'button')
    expect(btn.className).toContain('bg-white/80')
  })

  it('uses the filled brown style for secondary', () => {
    render(<Button variant="secondary" icon={Save}>Add User</Button>)
    expect(screen.getByRole('button', { name: 'Add User' }).className).toContain('bg-[#A67B5B]')
  })

  it('disables and marks busy while loading', () => {
    const onClick = vi.fn()
    render(<Button loading onClick={onClick}>Save</Button>)
    const btn = screen.getByRole('button', { name: 'Save' })
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')
    fireEvent.click(btn)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('renders as a link with the same styles', () => {
    render(<MemoryRouter><Button as={Link} to="/rsvp" variant="secondary">RSVP</Button></MemoryRouter>)
    const link = screen.getByRole('link', { name: 'RSVP' })
    expect(link).toHaveAttribute('href', '/rsvp')
    expect(link).not.toHaveAttribute('type')
    expect(link.className).toBe(buttonClass({ variant: 'secondary' }))
  })

  it('has exactly the toolbar styles', () => {
    expect(Object.keys(BUTTON_VARIANTS)).toEqual(['primary', 'secondary', 'danger'])
  })
})

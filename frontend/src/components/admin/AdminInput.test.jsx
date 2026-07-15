import { render, screen, fireEvent } from '@testing-library/react'
import { AdminInput } from './AdminInput'

describe('AdminInput', () => {
  it('renders input with label', () => {
    render(<AdminInput label="Name" />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('displays value', () => {
    render(<AdminInput label="Name" value="John" readOnly />)
    expect(screen.getByRole('textbox')).toHaveValue('John')
  })

  it('calls onChange', () => {
    const onChange = vi.fn()
    render(<AdminInput label="Name" onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Jane' } })
    expect(onChange).toHaveBeenCalledTimes(1)
  })
})

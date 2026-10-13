import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Grid, List } from 'lucide-react'
import SegmentedControl from './SegmentedControl'
import { BUTTON_VARIANTS } from './buttonStyles'

const options = [
  { value: 'keep', label: 'Keep' },
  { value: 'new', label: 'Use New' },
  { value: 'merge', label: 'Merge' },
]

function Controlled({ initial = 'keep', onChange = () => {}, opts = options }) {
  const [value, setValue] = useState(initial)
  return (
    <SegmentedControl
      aria-label="Resolution"
      options={opts}
      value={value}
      onChange={(v) => { setValue(v); onChange(v) }}
    />
  )
}

describe('SegmentedControl', () => {
  it('renders a labelled radio group with the selected option checked and styled', () => {
    render(<Controlled initial="new" />)
    expect(screen.getByRole('radiogroup', { name: 'Resolution' })).toBeInTheDocument()
    const selected = screen.getByRole('radio', { name: 'Use New' })
    expect(selected).toHaveAttribute('aria-checked', 'true')
    expect(selected.className).toContain(BUTTON_VARIANTS.secondary)
    const other = screen.getByRole('radio', { name: 'Keep' })
    expect(other).toHaveAttribute('aria-checked', 'false')
    expect(other.className).toContain(BUTTON_VARIANTS.primary)
  })

  it('selects an option on click', () => {
    const onChange = vi.fn()
    render(<Controlled onChange={onChange} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Merge' }))
    expect(onChange).toHaveBeenCalledWith('merge')
    expect(screen.getByRole('radio', { name: 'Merge' })).toHaveAttribute('aria-checked', 'true')
  })

  it('does not call onChange when clicking the selected option', () => {
    const onChange = vi.fn()
    render(<Controlled onChange={onChange} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Keep' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('uses a roving tabindex and moves the selection with arrow keys', () => {
    const onChange = vi.fn()
    render(<Controlled onChange={onChange} />)
    const [keep, useNew, merge] = screen.getAllByRole('radio')
    expect(keep).toHaveAttribute('tabindex', '0')
    expect(useNew).toHaveAttribute('tabindex', '-1')

    fireEvent.keyDown(keep, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith('new')
    expect(useNew).toHaveFocus()
    expect(useNew).toHaveAttribute('tabindex', '0')
    expect(keep).toHaveAttribute('tabindex', '-1')

    fireEvent.keyDown(useNew, { key: 'ArrowRight' })
    fireEvent.keyDown(merge, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith('keep')

    fireEvent.keyDown(keep, { key: 'ArrowLeft' })
    expect(onChange).toHaveBeenLastCalledWith('merge')
    expect(merge).toHaveFocus()
  })

  it('skips disabled options', () => {
    const onChange = vi.fn()
    render(<Controlled onChange={onChange} opts={[options[0], { ...options[1], disabled: true }, options[2]]} />)
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Keep' }), { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith('merge')
  })

  it('supports icon-only options with an aria-label', () => {
    render(
      <SegmentedControl
        aria-label="View mode"
        size="sm"
        value="list"
        onChange={() => {}}
        options={[
          { value: 'list', icon: List, ariaLabel: 'List view' },
          { value: 'grid', icon: Grid, ariaLabel: 'Grid view' },
        ]}
      />
    )
    expect(screen.getByRole('radio', { name: 'List view' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Grid view' })).toHaveAttribute('aria-checked', 'false')
  })

  it('stretches options equally when fullWidth', () => {
    render(<SegmentedControl fullWidth options={options} value="keep" onChange={() => {}} />)
    expect(screen.getByRole('radiogroup').className).toContain('w-full')
    screen.getAllByRole('radio').forEach((r) => expect(r.className).toContain('flex-1'))
  })
})

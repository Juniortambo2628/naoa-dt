import { render, screen, fireEvent } from '@testing-library/react'
import ContextMenu from './ContextMenu'

describe('ContextMenu', () => {
  it('renders nothing when closed', () => {
    render(<ContextMenu position={null} items={[{ label: 'Copy', onSelect: vi.fn() }]} onClose={vi.fn()} />)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('runs an item and closes', () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    render(<ContextMenu position={{ x: 10, y: 10 }} items={[{ type: 'header', label: 'Text' }, { label: 'Duplicate', onSelect }]} onClose={onClose} />)
    expect(screen.getByText('Text')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('menuitem', { name: /Duplicate/ }))
    expect(onSelect).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('opens a submenu and keeps open for keepOpen items', () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    render(
      <ContextMenu
        position={{ x: 10, y: 10 }}
        items={[{ label: 'Font', submenu: [{ label: 'Larger', keepOpen: true, onSelect }, { label: 'Italic', checked: true, onSelect: vi.fn() }] }]}
        onClose={onClose}
      />
    )
    fireEvent.click(screen.getByRole('menuitem', { name: /Font/ }))
    expect(screen.getByRole('menuitemcheckbox', { name: /Italic/ })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('menuitem', { name: /Larger/ }))
    expect(onSelect).toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<ContextMenu position={{ x: 0, y: 0 }} items={[{ label: 'A', onSelect: vi.fn() }]} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})

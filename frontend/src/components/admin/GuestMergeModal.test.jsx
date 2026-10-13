import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import GuestMergeModal, { suggestKeeper, groupKey } from './GuestMergeModal'

const guests = [
  { id: 1, name: 'John Doe', rsvp_status: 'pending', email: null },
  { id: 2, name: 'john doe', rsvp_status: 'confirmed', email: 'john@example.com', invitation: { status: 'sent' } },
]

describe('GuestMergeModal', () => {
  it('suggests keeping the record with an RSVP answer', () => {
    expect(suggestKeeper(guests).id).toBe(2)
  })

  it('builds an order-independent group key', () => {
    expect(groupKey({ guests: [{ id: 9 }, { id: 3 }] })).toBe('3-9')
  })

  it('merges the other records into the kept one', async () => {
    const onMerge = vi.fn().mockResolvedValue()
    render(
      <GuestMergeModal
        isOpen
        onClose={() => {}}
        groups={[{ reasons: ['Same name'], guests }]}
        onMerge={onMerge}
        onIgnore={() => {}}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Merge 1 into kept record/ }))
    await waitFor(() => expect(onMerge).toHaveBeenCalledWith(2, [1]))
  })
})

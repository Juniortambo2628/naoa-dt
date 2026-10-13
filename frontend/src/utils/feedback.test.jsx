import { confirmOptions } from './feedback'

describe('confirmOptions', () => {
  it('derives title, verb and tone from a plain message', () => {
    expect(confirmOptions('Delete this guest?')).toMatchObject({ title: 'Delete this guest?', confirmLabel: 'Delete', tone: 'danger', message: null })
    expect(confirmOptions('Send email invitations to 4 guests?')).toMatchObject({ confirmLabel: 'Send', tone: 'default' })
  })

  it('moves long messages into the body', () => {
    const long = 'Are you sure you want to reset RSVP status for ALL guests to pending? This will allow you to send fresh invitations.'
    expect(confirmOptions(long)).toMatchObject({ title: 'Are you sure?', message: long, confirmLabel: 'Reset', tone: 'danger' })
  })
})

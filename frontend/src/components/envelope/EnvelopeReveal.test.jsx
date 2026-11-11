import { render } from '@testing-library/react'
import EnvelopeReveal from './EnvelopeReveal'

describe('EnvelopeReveal', () => {
  it('stays out of the way when the device has no WebGL', () => {
    // jsdom has no WebGL, like an old phone: the normal page shows instead.
    const { container } = render(
      <EnvelopeReveal guestName="Amina" coupleNames="Dinah & Tze Ren" dateText="Saturday" venue="Zereneti Gardens" />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})

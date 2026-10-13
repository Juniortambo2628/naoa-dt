// Guards the "one Button component" rule: the old global .btn-* classes are
// gone, and the toolbar button styles live only in buttonStyles.js.
const sources = import.meta.glob(['/src/**/*.{js,jsx}', '!/src/**/*.test.{js,jsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
})

const offenders = (pattern, allow = []) =>
  Object.entries(sources)
    .filter(([path, code]) => !allow.some((a) => path.endsWith(a)) && pattern.test(code))
    .map(([path]) => path)

describe('button styles', () => {
  it('no file uses the removed .btn-* classes', () => {
    expect(offenders(/\bbtn-(primary|secondary|outline|sm|lg|full|rsvp|tab|claimed|base|icon-text)\b/)).toEqual([])
  })

  it('only buttonStyles.js defines the filled brown button style', () => {
    expect(offenders(/hover:bg-\[#8B5E3C\]/, ['components/buttonStyles.js'])).toEqual([])
  })

  it('no local button-class constants', () => {
    expect(offenders(/\b(BAR_BUTTON|baseButton|variantStyles)\b/)).toEqual([])
  })
})

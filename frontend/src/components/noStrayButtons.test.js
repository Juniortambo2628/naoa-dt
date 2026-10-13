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

// The opening tag of every <button> / <motion.button> in `code` (up to its
// closing `>`, skipping over `{...}` expressions and string literals).
const buttonTags = (code) => {
  const tags = []
  const tagRe = /<(motion\.)?button\b/g
  let m
  while ((m = tagRe.exec(code))) {
    let i = m.index + m[0].length
    let depth = 0
    let quote = null
    for (; i < code.length; i++) {
      const c = code[i]
      if (quote) {
        if (c === quote && code[i - 1] !== '\\') quote = null
      } else if (c === '"' || c === "'" || c === '`') quote = c
      else if (c === '{') depth++
      else if (c === '}') depth--
      else if (c === '>' && depth === 0) break
    }
    tags.push(code.slice(m.index, i))
  }
  return tags
}

// Files where a solid bg-[#A67B5B] on a <button> is NOT a button style.
// Keep this list minimal; every entry needs a reason.
const BROWN_FILL_ALLOW = [
  // On/off switch: the brown fill is the switch track's "on" colour, not a
  // button variant (it has no label text and a sliding knob).
  'components/admin/ToggleButton.jsx',
]

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

  it('no hand-styled <button> uses the filled brown background', () => {
    // Use <Button variant="secondary">, <SegmentedControl> or buttonClass()
    // instead. Tints such as bg-[#A67B5B]/10 are not matched.
    const brownFill = /bg-\[#A67B5B\](?!\/)/
    const found = Object.entries(sources)
      .filter(([path]) => !path.endsWith('components/buttonStyles.js'))
      .filter(([path]) => !BROWN_FILL_ALLOW.some((a) => path.endsWith(a)))
      .filter(([, code]) => buttonTags(code).some((tag) => brownFill.test(tag)))
      .map(([path]) => path)
    expect(found).toEqual([])
  })

  it('the brown-fill allowlist only names files that still need it', () => {
    for (const allowed of BROWN_FILL_ALLOW) {
      const entry = Object.entries(sources).find(([path]) => path.endsWith(allowed))
      expect(entry, allowed).toBeDefined()
      expect(buttonTags(entry[1]).some((tag) => /bg-\[#A67B5B\](?!\/)/.test(tag)), allowed).toBe(true)
    }
  })
})

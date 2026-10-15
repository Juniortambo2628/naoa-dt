// Guards the "one way to change data" rule: in the admin, every service call
// that writes goes through useAdminAction / useBulkAdminAction, so it gets the
// role check, confirmation, feedback and refreshing — and any control using it
// hides itself for view-only collaborators. A write called directly from a
// handler would silently skip all of that.
const sources = import.meta.glob(
  ['/src/pages/admin/*.jsx', '/src/components/admin/*.jsx', '/src/hooks/*.js', '!/src/**/*.test.{js,jsx}'],
  { query: '?raw', import: 'default', eager: true },
)

// Service methods that only read (anything else counts as a write).
// uploadMedia only stores a file; the record that uses it is saved by a guarded form.
const READ_METHOD = /^(get|export|download|validate|healthCheck|translate|search|uploadMedia$)/

// Services with their own gating, documented where they're used:
//  - twoFactor:     a person's own account security (allowed for every role)
//  - notification:  marking your own notifications read
//  - collaboration: Share / Version history / Accept invite (owner/editor checks there)
const EXEMPT_SERVICES = new Set(['twoFactorService', 'notificationService', 'collaborationService'])

// Files allowed to call writes directly, with the reason.
const EXEMPT_FILES = {
  // The data layer: React Query mutation hooks pages build on. Pages must run
  // them through useAdminAction (their .mutate/.mutateAsync calls are checked).
  'hooks/useApiHooks.js': 'data layer',
  // The designer autosaves on every edit (debounced) with its own status
  // indicator; it already skips saving for viewers.
  'pages/admin/InvitationDesigner.jsx': 'autosave',
}

/** Remove every balanced `name(...)` call span from the code. */
function stripCalls(code, names) {
  let out = code
  for (const name of names) {
    let i
    while ((i = out.indexOf(`${name}(`)) !== -1) {
      let j = i + name.length + 1
      let depth = 1
      let quote = null
      for (; j < out.length && depth > 0; j++) {
        const c = out[j]
        if (quote) {
          if (c === quote && out[j - 1] !== '\\') quote = null
        } else if (c === '"' || c === "'" || c === '`') quote = c
        else if (c === '(') depth++
        else if (c === ')') depth--
      }
      out = out.slice(0, i) + out.slice(j)
    }
  }
  return out
}

function directWrites(path, code) {
  const rest = stripCalls(code, ['useBulkAdminAction', 'useAdminAction'])
  const found = []
  for (const m of rest.matchAll(/\b(\w+Service)\.(\w+)\(/g)) {
    const [, service, method] = m
    if (EXEMPT_SERVICES.has(service) || READ_METHOD.test(method)) continue
    found.push(`${path.replace('/src/', '')}: ${service}.${method}()`)
  }
  for (const m of rest.matchAll(/\b(\w+)\.(mutateAsync|mutate)\(/g)) {
    found.push(`${path.replace('/src/', '')}: ${m[1]}.${m[2]}()`)
  }
  return found
}

describe('admin writes', () => {
  it('go through useAdminAction', () => {
    const offenders = Object.entries(sources)
      .filter(([path]) => !Object.keys(EXEMPT_FILES).some((f) => path.endsWith(f)))
      .flatMap(([path, code]) => directWrites(path, code))
    expect(offenders).toEqual([])
  })

  it('the guard itself catches a direct write', () => {
    const code = `const save = async () => { await faqService.update(1, {}) }`
    expect(directWrites('/src/x.jsx', code)).toEqual(['x.jsx: faqService.update()'])
    const wrapped = `const save = useAdminAction((id) => faqService.update(id, {}), { success: 'Saved' })`
    expect(directWrites('/src/x.jsx', wrapped)).toEqual([])
  })
})

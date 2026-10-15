import { parse } from '@babel/parser'
import traverseModule from '@babel/traverse'

// The linter doesn't check JSX names, so a component used without its import
// (e.g. <Button> in a file that never imports Button) only fails when that
// screen renders — in production, as "Button is not defined". This catches it.
const traverse = traverseModule.default || traverseModule
const sources = import.meta.glob(['/src/**/*.jsx', '!/src/**/*.test.jsx'], { query: '?raw', import: 'default', eager: true })

function undefinedComponents(code) {
  const missing = []
  traverse(parse(code, { sourceType: 'module', plugins: ['jsx'] }), {
    JSXOpeningElement(path) {
      const { name } = path.node
      if (name.type === 'JSXIdentifier' && /^[A-Z]/.test(name.name) && !path.scope.hasBinding(name.name)) {
        missing.push(`<${name.name}> on line ${name.loc.start.line}`)
      }
    },
  })
  return missing
}

describe('JSX components', () => {
  it('finds an unimported component', () => {
    expect(undefinedComponents('export default () => <Button />')).toEqual(['<Button> on line 1'])
    expect(undefinedComponents("import Button from './B'; export default () => <Button />")).toEqual([])
  })

  it('every component used in the app is imported or defined', () => {
    const problems = Object.entries(sources).flatMap(([file, code]) =>
      undefinedComponents(code).map((where) => `${file}: ${where}`))
    expect(problems).toEqual([])
  })
})

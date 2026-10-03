import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

// Vitest injects these as globals (test.globals: true in vite.config.js).
const vitestGlobals = {
  describe: 'readonly',
  it: 'readonly',
  test: 'readonly',
  suite: 'readonly',
  expect: 'readonly',
  vi: 'readonly',
  vitest: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
}

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]|^motion$', argsIgnorePattern: '^_' }],
      // The React Compiler lint rules bundled with eslint-plugin-react-hooks v6
      // are advisory and flag idiomatic patterns this project relies on
      // (syncing state from props in effects, data-fetching effects, library
      // refs passed to components like react-moveable). The project has not
      // adopted React Compiler, so these are disabled. The classic, safety
      // critical hook rules (rules-of-hooks, exhaustive-deps) stay enforced.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/refs': 'off',
    },
  },
  // Vitest unit/component tests run with globals enabled.
  {
    files: ['**/*.test.{js,jsx}', 'src/test-setup.js'],
    languageOptions: {
      globals: { ...globals.node, ...vitestGlobals },
    },
  },
  // Node-based tooling / config / Playwright helper files.
  {
    files: ['**/*.config.{js,jsx}', 'tests/**/*.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
])

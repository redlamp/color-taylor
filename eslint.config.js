import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import figmaPlugins from '@figma/eslint-plugin-figma-plugins'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // .obsidian holds the wiki's vault config and any community plugins the
  // vault has installed - vendored JS we neither wrote nor ship.
  globalIgnores(['dist', '.remember', '**/.obsidian']),
  {
    files: ['*.config.{js,ts}'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
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
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // Figma plugin sandbox: QuickJS, not a browser. `figma` and `__html__` are
    // injected by the host. Figma's own rules (deprecated sync APIs, dynamic-page
    // advice) are type-aware, so the TS parser reads types from figma/tsconfig.json
    // - the same project `tsc -p figma` checks.
    files: ['figma/code.js'],
    extends: [figmaPlugins.flatConfigs.recommended],
    languageOptions: {
      globals: { ...globals.browser, figma: 'readonly', __html__: 'readonly' },
      parser: tseslint.parser,
      parserOptions: {
        project: './figma/tsconfig.json',
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      'react-refresh/only-export-components': 'off',
    },
  },
])

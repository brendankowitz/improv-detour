import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';

const BROWSER_GLOBALS = [
  'window', 'document', 'localStorage', 'sessionStorage', 'navigator', 'location',
  'history', 'screen', 'performance', 'fetch', 'speechSynthesis',
  'requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'setInterval',
];

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'playwright-report', 'test-results', 'ios', 'android', 'dev-dist']),

  {
    files: ['**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  },

  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      reactHooks.configs.flat['recommended-latest'],
    ],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },

  // The game engine is pure: no UI, no browser, no wall clock, no unseeded randomness.
  {
    files: ['src/game/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['@app/*', '**/app/**', '@theme/*'], message: 'src/game is the pure engine. It must not depend on the UI.' },
          { group: ['react', 'react-dom', 'react-router', 'react-router-dom', '@ionic/*', '@capacitor/*'],
            message: 'src/game must not depend on React, Ionic or Capacitor.' },
        ],
      }],
      'no-restricted-globals': ['error', ...BROWSER_GLOBALS.map((name) => ({
        name, message: 'src/game must not touch browser globals. Pass what you need in.',
      }))],
      'no-restricted-properties': ['error',
        { object: 'Math', property: 'random', message: 'Use createRng from @game/rng.' },
        { object: 'Date', property: 'now', message: 'The engine never reads the clock. Pass `now` in.' },
      ],
    },
  },
]);

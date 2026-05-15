import { defineConfig } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import sonarjs from 'eslint-plugin-sonarjs';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      sonarjs,
    },
    rules: {
      // Cognitive Complexity - measures how difficult code is to understand
      'sonarjs/cognitive-complexity': ['warn', 10],

      // Code duplication detection
      'sonarjs/no-duplicate-string': ['warn', { threshold: 3 }],
      'sonarjs/no-identical-functions': 'warn',

      // Code smells
      'sonarjs/no-redundant-jump': 'error',
      'sonarjs/no-small-switch': 'warn',
      'sonarjs/no-useless-catch': 'error',
      'sonarjs/prefer-immediate-return': 'warn',
      'sonarjs/prefer-object-literal': 'warn',
      'sonarjs/prefer-single-boolean-return': 'warn',

      // Maintainability
      'sonarjs/no-collapsible-if': 'warn',
      'sonarjs/no-identical-conditions': 'error',
      'sonarjs/no-inverted-boolean-check': 'warn',

      // File/Function size (using standard ESLint rules)
      'complexity': ['warn', 25],
      'max-lines': ['warn', { max: 350, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 230, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['app/api/**/*.ts', 'lib/vault-client.ts'],
    rules: {
      'complexity': ['warn', 25],
      'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true, skipComments: true }],
      'sonarjs/cognitive-complexity': ['warn', 20],
    },
  },
  {
    files: ['scripts/**/*.js'],
    rules: {
      'complexity': 'off',
      'max-lines-per-function': 'off',
      'sonarjs/cognitive-complexity': 'off',
    },
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      'max-lines-per-function': 'off',
      'max-lines': 'off',
      'sonarjs/no-duplicate-string': 'off',
    },
  },
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'public/**', 'node_modules/**'],
  },
]);

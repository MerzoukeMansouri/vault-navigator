import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import sonarjs from 'eslint-plugin-sonarjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    plugins: {
      sonarjs,
    },
    rules: {
      // Cognitive Complexity - measures how difficult code is to understand
      'sonarjs/cognitive-complexity': ['warn', 10],

      // Function/Method complexity
      'sonarjs/max-function-complexity': ['warn', 10],

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
      'max-lines': ['warn', { max: 250, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
    },
  },
];

export default eslintConfig;

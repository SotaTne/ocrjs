import { defineConfig } from 'eslint/config';
import tsParser from '@typescript-eslint/parser';

export default defineConfig([
  {
    files: [
      'packages/**/*.{ts,tsx}',
      'eslint.config.mts',
      'apps/**/*.{ts,tsx}',
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "PropertyDefinition[accessibility='private']",
          message:
            'Use ECMAScript private fields (#name) instead of TypeScript `private` fields.',
        },
      ],
    },
  },
]);

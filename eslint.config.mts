import { defineConfig } from 'eslint/config';
import tsParser from '@typescript-eslint/parser';
import gitignore from 'eslint-config-flat-gitignore';
import fg from 'fast-glob';

const ignoreFiles = [
  '.gitignore',
  ...(await fg(['apps/**/.gitignore', 'packages/**/.gitignore'], {
    dot: true,
  })),
];

export default defineConfig([
  gitignore({
    files: ignoreFiles,
    strict: false,
  }),
  {
    files: ['apps/**/*.{ts,tsx}', 'packages/**/*.{ts,tsx}'],
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.turbo/**',
      'eslint.config.*',
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "PropertyDefinition[accessibility='private'], TSParameterProperty[accessibility='private'], MethodDefinition[accessibility='private']",
          message:
            'Use ECMAScript private fields (#name) instead of TypeScript `private` fields.',
        },
      ],
    },
  },
]);

import tsParser from '@typescript-eslint/parser';
import { defineConfig } from 'eslint/config';
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
    files: [
      'apps/**/*.{ts,tsx}',
      'packages/**/*.{ts,tsx}',
      'eslint.config.mts',
    ],
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.turbo/**',
      '**/.docs/**',
      '**/typedoc/e2e/fixtures/**',
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
            "ClassBody > PropertyDefinition[accessibility='private'], ClassBody > MethodDefinition[accessibility='private'], MethodDefinition[kind='constructor'] TSParameterProperty[accessibility='private']",
          message:
            'Use ECMAScript private fields (#name) instead of TypeScript `private` fields.',
        },
        {
          selector: 'Decorator',
          message:
            'TypeScript decorators are forbidden. Use explicit composition instead.',
        },
      ],
    },
  },
]);

import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/dist-types/**',
      '**/.next/**',
      '**/build/**',
      '**/*.d.ts',
      'node_modules/**',
      'coverage/**',
      'reference/**',
      'prototypes/**',
      'eslint.config.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      globals: {
        console: 'readonly',
        document: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error'
    },
  },
  prettier
);

import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier/flat';

export default [
  { ignores: ['node_modules/', 'coverage/'] },

  js.configs.recommended,

  // server-side code
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      // express identifies error handlers by arity, so `next` must stay declared
      'no-unused-vars': ['error', { argsIgnorePattern: '^_|^next$' }],
    },
  },

  // browser-side code
  {
    files: ['public/**/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: globals.browser,
    },
  },

  // turns off every rule that would fight prettier; must come last
  prettier,
];

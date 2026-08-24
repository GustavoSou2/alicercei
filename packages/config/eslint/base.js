// @ts-check
const eslintConfigPrettier = require('eslint-config-prettier');

/** Shared flat-config rules for every workspace in the monorepo. */
module.exports = [
  eslintConfigPrettier,
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
];

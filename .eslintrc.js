module.exports = {
  root: true,
  extends: ['eslint:recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    'no-console': 'warn',
  },
  overrides: [
    {
      files: ['apps/web/**/*'],
      extends: ['next/core-web-vitals'],
    },
    {
      files: ['apps/api/**/*'],
      extends: ['@nestjs'],
    },
  ],
};


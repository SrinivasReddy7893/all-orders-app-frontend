module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: [
    '!.*.js', // lint dotfile configs (.eslintrc.js, .prettierrc.js, ...)
    'node_modules/',
    'android/',
    'ios/',
    'coverage/',
  ],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'react-native/no-inline-styles': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
  },
};

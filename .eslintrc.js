module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true
  },
  extends: ['standard'],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  ignorePatterns: ['**/dist/**', '**/old/**'],
  rules: {
    semi: [2, 'always']
  }
};

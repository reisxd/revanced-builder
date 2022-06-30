module.exports = {
  env: {
    node: true,
    es2021: true
  },
  extends: ['standard'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    semi: [2, 'always']
  }
};

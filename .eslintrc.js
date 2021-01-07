module.exports = {
  extends: [
    'eslint:recommended',
    'airbnb-base',
    'plugin:lodash/recommended',
    'prettier',
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 8,
    sourceType: 'module',
  },
  plugins: ['import', 'lodash', 'prettier'],
  rules: {
    'brace-style': ['error', '1tbs', { allowSingleLine: false }],
    'class-methods-use-this': 'error',
    'comma-dangle': [
      'error',
      {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'never',
      },
    ],
    complexity: ['error', 15], // push down to 10
    curly: 'error',
    'func-names': 'warn',
    'import/order': 0,
    'import/extensions': ['error', 'never', { json: 'always' }],
    indent: ['error', 2],
    'key-spacing': ['error', { beforeColon: false }],
    'lodash/chaining': ['error', 'never'],
    'lodash/prefer-lodash-method': 0, // to be discussed
    'newline-per-chained-call': ['error', { ignoreChainWithDepth: 3 }],
    'max-depth': ['error', 4],
    'max-len': ['error', { code: 100, ignoreTemplateLiterals: true, ignoreStrings: true }],
    'max-nested-callbacks': ['error', 3],
    'no-console': 'warn',
    'no-underscore-dangle': 0,
    'no-multiple-empty-lines': ['error', { max: 1 }],
    'no-unused-vars': 'warn',
    'prefer-destructuring': [
      'error',
      {
        VariableDeclarator: {
          array: true,
          object: true,
        },
        AssignmentExpression: {
          array: false,
          object: false,
        },
      },
      {
        enforceForRenamedProperties: false,
      },
    ],
    semi: 'error',
    '@typescript-eslint/ban-types': 'warn', // needs fixing, but not in a hurry
    '@typescript-eslint/interface-name-prefix': 'warn',
    '@typescript-eslint/ban-ts-ignore': 'off', // it's not like we WANT ts-ignore
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': 'warn', // so types do not trigger
    '@typescript-eslint/camelcase': 'off', // many API responses are snake_case
    'prettier/prettier': 'error',
  },
  settings: {
    'import/resolver': {
      'eslint-import-resolver-typescript': true,
      configurable: {
        config: './src/config/index',
      },
    },
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  globals: {
    __karma__: true,
    __VERSION__: true,
    __DATA_MODEL_VERSION__: true,
  },
};

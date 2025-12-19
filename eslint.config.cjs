// @ts-check

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: {
        // Node.js 全局变量
        global: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __filename: 'readonly',
        __dirname: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        // VSCode 全局变量
        vscode: 'readonly',
        // 浏览器全局变量
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        // ECMAScript 全局变量
        Array: 'readonly',
        Boolean: 'readonly',
        Date: 'readonly',
        Error: 'readonly',
        Function: 'readonly',
        JSON: 'readonly',
        Math: 'readonly',
        Number: 'readonly',
        Object: 'readonly',
        RegExp: 'readonly',
        String: 'readonly',
        undefined: 'readonly',
      },
    },
    rules: {
      'indent': ['error', 2],
      'linebreak-style': ['error', 'unix'],
      'quotes': ['error', 'single'],
      'semi': ['error', 'never'],
      'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
      'no-undef': 'warn',
      'no-console': 'off',
      'no-constant-condition': ['error', { 'checkLoops': false }],
      'no-empty': ['error', { 'allowEmptyCatch': true }],
      'no-prototype-builtins': 'off',
    },
    files: ['**/*.js'],
    ignores: ['node_modules/**', 'dist/**', 'out/**', 'scripts/**', '*.vsix'],
  },
];
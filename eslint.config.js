import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
	// Apply recommended rules to all files
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],

	// Global ignores
	{
		ignores: [
			'build/',
			'.svelte-kit/',
			'dist/',
			'node_modules/',
			'coverage/',
			'**/*.cjs',
			'vite.config.ts.timestamp-*'
		]
	},

	// Configuration for JavaScript/TypeScript files
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.es2017,
				...globals.node
			},
			parserOptions: {
				sourceType: 'module',
				ecmaVersion: 2020,
				extraFileExtensions: ['.svelte']
			}
		},
		rules: {
			// Allow unused vars that start with underscore
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_'
				}
			],
			// Disallow explicit any
			'@typescript-eslint/no-explicit-any': 'error',
			// Disable some rules that are too noisy for now
			'no-useless-catch': 'warn',
			'prefer-const': 'warn',
			'@typescript-eslint/no-require-imports': 'warn',
			'@typescript-eslint/no-unused-expressions': 'warn',
			'@typescript-eslint/no-unsafe-function-type': 'warn',
			'no-case-declarations': 'warn'
		}
	},

	// Svelte-specific configuration
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		},
		rules: {
			// Svelte-specific rules can go here
			// Allow a11y warnings for now (can be fixed incrementally)
			'svelte/valid-compile': 'warn',
			'svelte/no-unused-svelte-ignore': 'warn',
			'svelte/no-at-html-tags': 'warn',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_'
				}
			]
		}
	},

	// Test files configuration
	{
		files: ['**/*.test.ts', '**/*.test.js', 'src/tests/**/*'],
		rules: {
			// More lenient rules for test files
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': 'off'
		}
	}
];

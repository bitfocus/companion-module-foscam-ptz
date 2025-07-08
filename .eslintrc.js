module.exports = {
	env: {
		node: true,
		es6: true,
	},
	extends: ['eslint:recommended'],
	parserOptions: {
		ecmaVersion: 2020,
	},
	rules: {
		'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
	},
}

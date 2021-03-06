module.exports = {
	root: true,
	env: {
		es2021: true,
		node: true
	},
	extends: ['standard-with-typescript', 'plugin:prettier/recommended', 'prettier'],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 12,
		sourceType: 'module',
		project: './tsconfig.eslint.json',
		tsconfigRootDir: __dirname,
		createDefaultProgram: true
	},
	plugins: ['@typescript-eslint'],
	rules: {
		'@typescript-eslint/no-var-requires': 'off',
		'prefer-promise-reject-errors': 'off',
		'@typescript-eslint/strict-boolean-expressions': 'off',
		'@typescript-eslint/prefer-nullish-coalescing': 'off'
	}
};

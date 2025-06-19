import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import stylistic from '@stylistic/eslint-plugin';

export default defineConfig([
	{
		ignores: [
      "**/node_modules/",
			"_nogit/",
      "res/",
      "*.config.js",
			".git/",
			"dist/",
    ]
	},
	{
		files: ["**/*.{js}"],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				...globals.es2025,
				bootstrap: 'readonly',
			},
			ecmaVersion: 'latest',
			sourceType: 'module'
		},
		plugins: {
			'@stylistic': stylistic,
		},
		rules: {
			...js.configs.recommended.rules,
			'indent': ['error', 'tab', { // Используем табуляцию для отступов
        SwitchCase: 1 // Отступ для case внутри switch
			}],
			'no-tabs': 'off', // Отключаем правило, запрещающее табуляцию
			'no-unused-vars': [
				'error',
				{ 
					varsIgnorePattern: '^_$',  // Точное совпадение с "_"
					argsIgnorePattern: '^_$',
					caughtErrorsIgnorePattern: '^_$'
				}
			],
			'@stylistic/eol-last': ['error', 'always'],
		},
	},
]);

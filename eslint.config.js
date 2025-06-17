import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";

export default defineConfig([
	{
		files: ["**/*.{js,mjs,cjs}"],
		languageOptions: {
			globals: { ...globals.browser, ...globals.node, bootstrap: 'readonly' },
			ecmaVersion: 'latest',
			sourceType: 'module'
		},
		ignores: [
      "**/node_modules/",
			"_nogit/",
      "res/",
      "*.config.js",
			".git/",
    ],
		plugins: {
			js,
		},
		extends: [
			"js/recommended",
		],
		rules: {
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
			]
		}
	}
]);
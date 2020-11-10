const path = require('path');
//const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');

let isDev = process.env.NODE_ENV === 'development';
let isProd = ! isDev;

let es5 = false;

module.exports = {
	//mode: 'development', // development (eval) | production (simple minified)
	devtool: (isDev ? "source-map" : false),
	entry: {
		main: (es5
			? ['@babel/polyfill', './src/sg-model.js'] // поддержка старых браузеров типа IE
			: './src/sg-model.js'
		)
	},
	output: {
		filename: 'sg-model'+(isProd?'.min':'') + (es5 ? ".es5" : ".es6") +'.js',
		path: path.resolve(__dirname, './dist')
	},
	optimization: (()=>{
		let optimization = {};// splitChunks: { chunks: 'all' } };
		if (isProd) optimization.minimizer = [
			new TerserWebpackPlugin()
		];
		return optimization;
	})(),
	plugins: (()=>{
		var plugins = [
			//new CleanWebpackPlugin()
		];
		return plugins;
	})(),
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						//presets: ['@babel/preset-env'],
						presets: [['@babel/preset-env', { targets: { "firefox": "60", "chrome": "67", "safari": "11.1" } }]],
						plugins: [
							[ '@babel/plugin-proposal-class-properties', { loose: true }],
							//'@babel/plugin-transform-shorthand-properties'
						]
					}
				}
			}
		]
	}
};
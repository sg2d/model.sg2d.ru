"use strict";

const webpack = require('webpack');
const path = require('path');
const pkg = require('./package.json');
const fs = require('fs');

module.exports = (env = {}) => {
	const minimize = !! env.MINIMIZE || false;
	const version = pkg.version;
	const license = fs.readFileSync('LICENSE', 'utf8');
	const resolve = relativePath => path.resolve(__dirname, relativePath);

	const banner = 
`${pkg.name} ${version} by @ Kalashnikov Ilya
${pkg.homepage}
License ${pkg.license}${!minimize ? '\n\n' + license : ''}`;

	return {
		entry: {
			'sg-model': './src/sg-model.js',
		},
		node: false,
		output: {
			library: 'SGModel',
			libraryExport: 'default',
			umdNamedDefine: true,
			libraryTarget: 'umd',
			globalObject: 'this',
			path: resolve('./build'),
			filename: `[name]${minimize ? '.min' : ''}.js`
		},
		optimization: { minimize },
		plugins: [
			new webpack.BannerPlugin(banner),
			new webpack.DefinePlugin({
				__SGMODEL_VERSION__: JSON.stringify(version),
			})
		]
	};
};
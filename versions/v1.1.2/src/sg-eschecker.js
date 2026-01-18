"use strict";

/*! SGESChecker - проверка поддерживаемых версий ECMAScript и DOM (Web API)
 * @version 1.1.2
 * @requires ES5+
 * @link https://github.com/sg2d/model.sg2d.ru
 * @license SGESChecker may be freely distributed under the MIT license
 * @copyright 2026 © Калашников Илья (https://model.sg2d.ru, sg2d@yandex.ru)
 */

const ESBUILD_MAX_VERSION_SUPPORT = 2024; // TODO: актуализировать периодически
const MAX_ES_VERSION_DETECTED = 2029;
const MAX_DOM_VERSION_DETECTED = 3;
const __global = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
__global.__SGESChecker = {};
(() => { // IIFE (Immediately Invoked Function Expression) поддерживается, по сути, с самой первой версии стандарта — ECMAScript 1 (1997 год). А arrow functions `() => {}` появились в ECMAScript 2015.
	try {
		__global.__SGESChecker = JSON.parse(localStorage.getItem('ESChecks') || {});
		if (__global.__SGESChecker && __global.__SGESChecker.userAgent === navigator.userAgent) {
			return;
		}
	} catch(_) {
		// no code
	}
	const checks = {
		mathOperators: {
			exponentiation: (() => {
				try {
					return eval('2 ** 3') === 8 ? 'ES2016' : '!ES2016';
				} catch(_) { return '!ES2016'; }
			})()
		},
		stringMethods: {
			trim: String.prototype.trim ? 'ES5' : '!ES5',
			includes: String.prototype.includes ? 'ES2015' : '!ES2015',
			startsWith: String.prototype.startsWith ? 'ES2015' : '!ES2015',
			endsWith: String.prototype.endsWith ? 'ES2015' : '!ES2015',
			padStart: String.prototype.padStart ? 'ES2017' : '!ES2017',
			matchAll: String.prototype.matchAll ? 'ES2020' : '!ES2020',
			replaceAll: String.prototype.replaceAll ? 'ES2021' : '!ES2021',
			at: String.prototype.at ? 'ES2022' : '!ES2022'
		},
		objectMethods: {
			freeze: typeof Object.freeze === 'function' ? 'ES5' : '!ES5',
			getOwnPropertyNames: Object.getOwnPropertyNames ? 'ES5' : '!ES5',
			defineProperty: typeof Object.defineProperty === 'function' ? 'ES5' : '!ES5',
			defineProperties: typeof Object.defineProperties === 'function' ? 'ES5' : '!ES5',
			setPrototypeOf: Object.setPrototypeOf ? 'ES2015' : '!ES2015',
			entries: typeof Object.entries === 'function' ? 'ES2017' : '!ES2017',
			fromEntries: Object.fromEntries ? 'ES2019' : '!ES2019',
			hasOwn: Object.hasOwn ? 'ES2022' : '!ES2022'
		},
		regexp: {
			test: RegExp.prototype.test ? 'ES3' : '!ES3',
			lookbehind: (() => {
				try { // Проверяем поддержку позитивного и негативного lookbehind
					const pos = /(?<=a)b/.test('ab');
					const neg = /(?<!a)b/.test('cb');
					return pos && neg ? 'ES2018' : '!ES2018';
				} catch(_) { return '!ES2018'; }
			})()
		},
		typedArrays: {
			Uint8Array: typeof Uint8Array === 'function' ? 'ES2015' : '!ES2015'
		},
		spread: {
			objectSpread: (() => {
				try { return eval(`const obj1 = { a: 1 }; const obj2 = { b: 2, ...obj1 }; obj2.a === 1;`) ? 'ES2018' : '!ES2018'; } catch (_) { return '!ES2018'; }
			})()
		},
		destructuring: {
			arrayDestructuring: (() => {
				try { eval('const [a, b] = [1, 2];'); return 'ES2015'; } catch(_) { return '!ES2015'; }
			})()
		},
		trailingComma: {
			objectLiterals: (() => {
				try { eval('({ a: 1, })'); return 'ES2017'; } catch(_) { return '!ES2017'; }
			})(),
			functionParams: (() => {
				try { eval('(function(a,) {})'); return 'ES2017'; } catch(_) { return '!ES2017'; }
			})()
		},
		optionalChaining: {
			optionalChain: (() => {
				try {
					return eval('const o = {}; o?.a?.b === undefined') ? 'ES2020' : '!ES2020';
				} catch(_) { return '!ES2020'; }
			})()
		},
		nullishCoalescing: {
			nullishCoalesce: (() => {
				try {
					return eval('(null ?? 42) === 42') ? 'ES2020' : '!ES2020';
				} catch(_) { return '!ES2020'; }
			})()
		},
		numericSeparators: {
			numericSeparator: (() => {
				try {
					return eval('1_000_000 === 1000000') ? 'ES2021' : '!ES2021';
				} catch(_) { return '!ES2021'; }
			})()
		},
		bigInt: {
			BigInt: typeof BigInt === 'function' ? 'ES2020' : '!ES2020'
		},
		tryCatch: {
			optionalCatchBinding: (() => {
				try {
					eval('try { throw 0 } catch(_) { }');
					return 'ES2019';
				} catch(_) { return '!ES2019'; }
			})()
		},
		logicalAssignment: {
			nullishCoalesceAssign: (() => {
				try { let a = null; eval('a ??= 1'); return a === 1 ? 'ES2021' : '!ES2021'; } catch(_) { return '!ES2021'; }
			})(),
			logicalAndAssign: (() => {
				try { let a = true; eval('a &&= false'); return a === false ? 'ES2021' : '!ES2021'; } catch(_) { return '!ES2021'; }
			})(),
			logicalOrAssign: (() => {
				try { let a = false; eval('a ||= true'); return a === true ? 'ES2021' : '!ES2021'; } catch(_) { return '!ES2021'; }
			})()
		},
		iteration: {
			forOf: (() => {
				try { eval('for (const x of [1]);'); return 'ES2015'; } catch(_) { return '!ES2015'; }
			})()
		},
		collections: {
			Set: typeof Set === 'function' ? 'ES2015' : '!ES2015',
			Map: typeof Map === 'function' ? 'ES2015' : '!ES2015',
			WeakSet: typeof WeakSet === 'function' ? 'ES2015' : '!ES2015'
		},
		arrayMethods: {
			isArray: Array.isArray ? 'ES5' : '!ES5',
			flatMap: Array.prototype.flatMap ? 'ES2019' : '!ES2019',
			findLast: Array.prototype.findLast ? 'ES2023' : '!ES2023',
  		toSorted: Array.prototype.toSorted ? 'ES2023' : '!ES2023'
		},
		symbols: {
			Symbol: typeof Symbol === 'function' ? 'ES2015' : '!ES2015'
		},
		classes: {
			class: (() => {
				try { eval('class TestClass {}'); return 'ES2015'; } catch(_) { return '!ES2015'; }
			})(),
			staticMethods: (() => {
				try { return eval(`class T { static m() {} }; typeof T.m === 'function';`) ? 'ES2015' : '!ES2015'; } catch(_) { return '!ES2015'; }
			})(),
			staticBlocks: (() => {
				try {
					return eval(`class T { static x = 0; static { this.x = 42; } }; T.x === 42;`) ? 'ES2022' : '!ES2022';
				} catch(_) { return '!ES2022'; }
			})(),
			privateInstanceMembers: (() => {
				try {
					return eval(`class T { #field = 42; #method() { return this.#field; }	test() { return this.#field === 42 && this.#method() === 42; } }; new T().test();`) ? 'ES2022' : '!ES2022';
				} catch(_) { return '!ES2022'; }
			})(),
			staticPublicProps: (() => {
				try { return eval(`class T { static f = 1; }; T.f === 1; `) ? 'ES2022' : '!ES2022'; } catch(_) { return '!ES2022'; }
			})(),
			staticPrivateProps: (() => {
				try { return eval(`class T { static #p = 1; static getPrivateProp() { return this.#p; } }; T.getPrivateProp() === 1;`) ? 'ES2022' : '!ES2022'; } catch(_) { return '!ES2022'; }
			})()
		},
		network: {
			fetch: typeof fetch === 'function' ? 'ES2015' : '!ES2015'
		},
		abort: {
			AbortController: typeof AbortController === 'function' ? 'ES2018' : '!ES2018',
		},
		modules: {
			dynamicImport: (() => {
				try { eval('import("data:text/javascript,")'); return 'ES2020'; } catch(_) { return '!ES2020'; }
			})(),
			importAssertions: (() => {
				try { new Function('import("x", { assert: { type: "json" } });'); return 'ES2022'; } catch(_) { return '!ES2022'; }
			})()
		},
		promiseAsyncAwait: {
			Promise: typeof Promise === 'undefined' ? '!ES2015' : 'ES2015',
			all: typeof Promise !== 'undefined' && Promise.all ? 'ES2015' : '!ES2015',
			awaitExpression: (() => {
				try { eval('(async () => { await Promise.resolve(); })'); return 'ES2017'; } catch(_) { return '!ES2017'; }
			})(),
			finally: typeof Promise !== 'undefined' && typeof Promise.prototype.finally === 'function' ? 'ES2018' : '!ES2018',
			topLevelAwait: (() => { // Top-level await как правило доступен в тех же средах, что и Promise.withResolvers (Chrome 98+, Node 14.8+). В синхронном checks'е это не проверить (будет что-то типа асихнхронного: window.__tla_check = ...; const script = document.createElement('script'); script.type = 'module'; script.textContent = "..."; script.onload = ...; document.head.appendChild(script); ...)
				return typeof Promise !== 'undefined'  && typeof Promise.withResolvers === 'function' ? 'ES2022' : '!ES2022';
			})(),
			withResolvers: typeof Promise !== 'undefined' && typeof Promise.withResolvers === 'function' ? 'ES2024' : '!ES2024'
		},
		metaProgramming: {
			Proxy: typeof Proxy === 'function' ? 'ES2015' : '!ES2015'
		},
		temporal: {
			Temporal: typeof Temporal !== 'undefined' ? 'ES2026' : '!ES2026'
		},
		pipelineOperator: {
			pipelineOperator: (() => {
				try {
					eval('1 |> (x => x)');
					return 'ES2027'; // TODO: проверить, что это действительно ES2027
				} catch(_) { return '!ES2027'; }
			})(),
		},
		decorators: {
			decorators: (() => {
				try {
					eval(`function d(c) { return c; } @d class X {}`);
					return 'ES2027'; // TODO: проверить, что это действительно ES2027
				} catch(_) { return '!ES2027'; }
			})(),
		},
		dom: {
			createDocumentFragment: typeof document?.createDocumentFragment === 'function' ? 'DOMLl' : '!DOML1',
			eventTarget: (() => {
				let el;
				try {
					if (typeof document === 'undefined') return '!DOMLl';
					el = document.createElement('div');
					let hasTarget = false;
					const handler = (e) => { hasTarget = e.target != null; };
					el.addEventListener('test', handler);
					el.dispatchEvent(new Event('test'));
					return hasTarget ? 'DOML2' : '!DOML2';
				} catch(_) { return '!DOML2'; } finally { el.remove(); }
			})(),
			stopImmediatePropagation: (() => {
				try {
					const ev = new Event('test');
					return typeof ev.stopImmediatePropagation === 'function' ? 'DOML3' : '!DOML3';
				} catch(_) { return '!DOML3'; }
			})()
		}
	};

	// Выясняем какая версия ECMAScript поддерживается
	const supportedESVersions = new Set([1,2,3,4,5, ...Array.from({ length: 15 }, (_, i) => 2015 + i)]);
	const supportedDOMVersions = new Set([1,2,3]);
	for (let groupKey in checks) {
		const group = checks[groupKey];
		for (let featureKey in group) {
			const val = String(group[featureKey]);
			const match = val.match(/\d+/);
			if (match) {
				const version = parseInt(match[0], 10);
				if (val.startsWith('!ES') && supportedESVersions.has(version)) {
					for (let i = version; i <= MAX_ES_VERSION_DETECTED; i++) {
						if (supportedESVersions.has(i)) {
							supportedESVersions.delete(i);
						}
					}
				}
				if (val.startsWith('!DOM') && supportedDOMVersions.has(version)) {
					for (let i = version; i <= MAX_DOM_VERSION_DETECTED; i++) {
						if (supportedDOMVersions.has(i)) {
							supportedDOMVersions.delete(i);
						}
					}
				}
			}
		}
	}
	let maxSupportedESVersion = 0;
	for (let version of supportedESVersions) {
		if (version > maxSupportedESVersion) {
			maxSupportedESVersion = version;
		}
	}
	let maxSupportedDOMVersion = 0;
	for (let version of supportedDOMVersions) {
		if (version > maxSupportedDOMVersion) {
			maxSupportedDOMVersion = version;
		}
	}

	__global.__SGESChecker = {
		checks: checks,
		esVersion: maxSupportedESVersion,
		domVersion: maxSupportedDOMVersion,
		url: window.location.href,
		timestamp: Date.now(),
		userAgent: navigator.userAgent
	};

	localStorage.setItem('ESChecks', JSON.stringify(__global.__SGESChecker));
	
	/*TODO:
	const xhr = new XMLHttpRequest();
	xhr.open('PUT', 'https://metrics.core.sg2d.ru/api/v1/telemetry', true);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.send(JSON.stringify(payload));*/
})();

/**
 * Получить информацию о поддержке версий ES, а также версий DOM
 * @returns {object}
 */
__global.sgESCheck = () => __global.__SGESChecker;

/**
 * Подгрузка скрипта с учетом версии ES и окружения
 * @param {string} src
 * @param {object} [options]
 * @param {number} [options.minES=2022] Минимальная поддерживаемая версия ES
 * @param {string} [options.baseDir=''] Корневая директория минифицированных скриптов
 * @param {boolean} [options.forceMinified=false] Принудительно загрузить минифицированный скрипт
 * @returns {HTMLScriptElement}
 */
__global.sgESLoadScript = (src, options = void 0) => {
	options = typeof options === 'object' ? options : {};
	options.minES = (typeof options.minES === 'number' ? options.minES : 2022);
	options.baseDir = typeof options.baseDir === 'string' ? options.baseDir : '';
	const esVersion = Math.min(ESBUILD_MAX_VERSION_SUPPORT, __global.__SGESChecker.esVersion);
	const script = document.createElement('script');
	script.type = 'module';
	script.defer = true;
	if (esVersion < options.minES) {
		const msg = `Error! A more modern browser with updates ${options.minES}+ is required!`;
		alert(msg);
		throw new Error(msg);
	}
	const srcBase = src.replace(/\.js$/, ''); // Получить часть полного пути к скрипту без ".js"
	script.src = String((location.hostname.startsWith('local') || location.hostname.startsWith('stage')) && !options.forceMinified
		? src
		: `${options.baseDir}${srcBase}-es${esVersion}.min.js`
	).replaceAll('//', '/');
	document.head.appendChild(script);
	return script;
};

//export default __global.__SGESChecker;

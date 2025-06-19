/**
 * SGUtils - функции-утилиты для SGModel и SGModelView
 * @version 1.1.1
 * @requires ES2024+ (ES15+)
 * @link https://github.com/sg2d/model.sg2d.ru
 * @license SGModel may be freely distributed under the MIT license
 * @copyright 2019-2025 © Калашников Илья (https://model.sg2d.ru)
 */

// Среда выполнения кода
export const isNode = ((typeof process === 'object' && process !== null) && (typeof process.versions === 'object') && process.versions.node !== undefined); // eslint-disable-line no-undef
export const isBrowser = (typeof window === 'object' && window !== null && window.document !== undefined);

/**
 * Глобальный объект (window для браузеров, global для Node.js)
 * @protected
 */
export const __global = isNode ? global : window; // eslint-disable-line no-undef

export const __enumerableFalse = { enumerable: false }; // @protected

export const OBJECT_EMPTY = Object.preventExtensions({}); // @aos

/**
	 * Преобразовать элементы коллекции в числа
	 * @aos
	 * @param {Array|object} collection 
	 * @param {number} [precision]
	 * @returns {Array|object}
	 */
export function toNumbers(collection, precision = void 0) {
	for (const p in collection) {
		let value = collection[p];
		if (typeof value === 'string') {
			if (/[\d]+\.[\d]+$/.test(value)) {
				value = value.replace(',', '');
			}
			value = value.replace(',', '.').replace(/\s/g, '').replace('−', '-'); // 6,724.33 -> 6724.33
		}
		collection[p] = (precision ? roundTo(value, precision) : Number(value));
	}
	return collection;
};

/**
 * Rounding to the required precision
 * @param {Number} value
 * @param {Number} [precision=0]
 * @returns {Number}
 */
export function roundTo(value, precision = 0) {
	const m = 10 ** precision;
	return Math.round(Number(value) * m) / m;
};

/** @public */
export function toBooleanOrNull(value) {
	return value === null ? null : Boolean(value);
};

/** @public */
export function toStringOrNull(value) {
	return value === null ? null : String(value);
};

export function toNumberOrNull(value, precision = void 0) {
	return value === null ? null : toNumber(value, precision);
};

/** @public */
export function isEmpty(value) {
	if (value) {
		return Object.keys(value).length === 0 && value.constructor === Object;
	}
	return true;
};

/** @public */
export function sleep(ms = 33) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export function isPromise(object) {
	if (object instanceof Promise) return true;
	return !!object && (typeof object.then === 'function');
}

export function isSet(object) {
	if (object instanceof Set) return true;
	return !!object && (object.constructor?.name === 'Set');
}

export function isMap(object) {
	if (object instanceof Map) return true;
	return !!object && (object.constructor?.name === 'Map');
}

// Функция-заглушка
export const fStub = (v) => v;

/** @public */
export const isPrimitive = (v) => v !== Object(v);

/** @public */
export const isObject = (val) => val !== null && typeof val === 'object';

export function toNumber(value, precision = void 0) {
	if (typeof value === 'string') {
		if (/[\d]+\.[\d]+$/.test(value)) {
			value = value.replace(',', '');
		}
		value = value.replace(',', '.').replace(/\s/g, '').replace('−', '-'); // 6,724.33 -> 6724.33
	}
	return precision ? roundTo(value, precision) : Number(value);
};

/** @public */
export function upperFirstLetter(s) {
	return s.charAt(0).toUpperCase() + s.slice(1);
};

/**
 * Получить число в двоичном формате с разделителями каждые 4 бита.
 * @param {number} num
 * @param {number} [bits]
 * @returns {string}
 */
export function toPaddedBinary(num, bits = 8) {
	let binaryStr = num.toString(2).padStart(bits, '0');
	binaryStr = binaryStr.replace(/(\d{4})(?=\d)/g, '$1_');
	return `0b${binaryStr}`;
}

/**
 * Сгенерировать uuid
 * @returns {string}
 */
export const uuidLite = function() {
	return crypto.randomUUID && crypto.randomUUID() // must be https protocol to support the function crypto.randomUUID()
	|| '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c => (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16));
}

const ITEM_HASH_LEN = 16;

/**
 * sha256 - Хеширование данных
 * [js-sha256]{@link https://github.com/emn178/js-sha256}
 * @version 0.11.0
 * @author Chen, Yi-Cyuan [emn178@gmail.com]
 * @copyright Chen, Yi-Cyuan 2014-2024
 * @license MIT
 * @minify https://minify-js.com
 * @notes Удалёны: код для sha224, определение root, экспорты, код использующий Node.js
 *//* eslint-disable */
 const __sha256 = function(){"use strict";var t="input is invalid type",h=("undefined"!=typeof ArrayBuffer),i="0123456789abcdef".split(""),
	r=[-2147483648,8388608,32768,128],s=[24,16,8,0],
	e=[1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298],
	n=["hex","array","digest","arrayBuffer"],o=[];Array.isArray||(Array.isArray=function(t){return"[object Array]"===Object.prototype.toString.call(t)}),h&&!ArrayBuffer.isView&&(ArrayBuffer.isView=function(t){return"object"==typeof t&&t.buffer&&t.buffer.constructor===ArrayBuffer});
	var a=function(t){return function(h){return new u(!0).update(h)[t]()}},f=function(t){return function(h,i){return new c(h,!0).update(i)[t]()}};
	function u(t){t?(o[0]=o[16]=o[1]=o[2]=o[3]=o[4]=o[5]=o[6]=o[7]=o[8]=o[9]=o[10]=o[11]=o[12]=o[13]=o[14]=o[15]=0,this.blocks=o):this.blocks=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],this.h0=1779033703,this.h1=3144134277,this.h2=1013904242,this.h3=2773480762,this.h4=1359893119,this.h5=2600822924,this.h6=528734635,this.h7=1541459225,this.block=this.start=this.bytes=this.hBytes=0,this.finalized=this.hashed=!1,this.first=!0}
	function c(i,r){var s,e=typeof i;if("string"===e){var n,o=[],a=i.length,f=0;for(s=0;s<a;++s)(n=i.charCodeAt(s))<128?o[f++]=n:n<2048?(o[f++]=192|n>>>6,o[f++]=128|63&n):n<55296||n>=57344?(o[f++]=224|n>>>12,o[f++]=128|n>>>6&63,o[f++]=128|63&n):(n=65536+((1023&n)<<10|1023&i.charCodeAt(++s)),o[f++]=240|n>>>18,o[f++]=128|n>>>12&63,o[f++]=128|n>>>6&63,o[f++]=128|63&n);i=o}else{if("object"!==e)throw new Error(t);
	if(null===i)throw new Error(t);if(h&&i.constructor===ArrayBuffer)i=new Uint8Array(i);else if(!(Array.isArray(i)||h&&ArrayBuffer.isView(i)))throw new Error(t)}i.length>64&&(i=new u(!0).update(i).array());var c=[],y=[];for(s=0;s<64;++s){var p=i[s]||0;c[s]=92^p,y[s]=54^p}u.call(this,r),this.update(y),this.oKeyPad=c,this.inner=!0,this.sharedMemory=r}u.prototype.update=function(i){if(!this.finalized){var r,e=typeof i;
	if("string"!==e){if("object"!==e)throw new Error(t);if(null===i)throw new Error(t);if(h&&i.constructor===ArrayBuffer)i=new Uint8Array(i);else if(!(Array.isArray(i)||h&&ArrayBuffer.isView(i)))throw new Error(t);r=!0}for(var n,o,a=0,f=i.length,u=this.blocks;a<f;){if(this.hashed&&(this.hashed=!1,u[0]=this.block,this.block=u[16]=u[1]=u[2]=u[3]=u[4]=u[5]=u[6]=u[7]=u[8]=u[9]=u[10]=u[11]=u[12]=u[13]=u[14]=u[15]=0),r)for(o=this.start;a<f&&o<64;++a)u[o>>>2]|=i[a]<<s[3&o++];else for(o=this.start;a<f&&o<64;++a)(n=i.charCodeAt(a))<128?u[o>>>2]|=n<<s[3&o++]:n<2048?(u[o>>>2]|=(192|n>>>6)<<s[3&o++],u[o>>>2]|=(128|63&n)<<s[3&o++]):n<55296||n>=57344?(u[o>>>2]|=(224|n>>>12)<<s[3&o++],u[o>>>2]|=(128|n>>>6&63)<<s[3&o++],u[o>>>2]|=(128|63&n)<<s[3&o++]):(n=65536+((1023&n)<<10|1023&i.charCodeAt(++a)),u[o>>>2]|=(240|n>>>18)<<s[3&o++],u[o>>>2]|=(128|n>>>12&63)<<s[3&o++],u[o>>>2]|=(128|n>>>6&63)<<s[3&o++],u[o>>>2]|=(128|63&n)<<s[3&o++]);this.lastByteIndex=o,this.bytes+=o-this.start,o>=64?(this.block=u[16],this.start=o-64,this.hash(),this.hashed=!0):this.start=o}return this.bytes>4294967295&&(this.hBytes+=this.bytes/4294967296<<0,this.bytes=this.bytes%4294967296),this}},
	u.prototype.finalize=function(){if(!this.finalized){this.finalized=!0;var t=this.blocks,h=this.lastByteIndex;t[16]=this.block,t[h>>>2]|=r[3&h],this.block=t[16],h>=56&&(this.hashed||this.hash(),t[0]=this.block,t[16]=t[1]=t[2]=t[3]=t[4]=t[5]=t[6]=t[7]=t[8]=t[9]=t[10]=t[11]=t[12]=t[13]=t[14]=t[15]=0),t[14]=this.hBytes<<3|this.bytes>>>29,t[15]=this.bytes<<3,this.hash()}},
	u.prototype.hash=function(){var t,h,i,r,s,n,o,a,f,u=this.h0,c=this.h1,y=this.h2,p=this.h3,l=this.h4,d=this.h5,b=this.h6,w=this.h7,A=this.blocks;for(t=16;t<64;++t)h=((s=A[t-15])>>>7|s<<25)^(s>>>18|s<<14)^s>>>3,i=((s=A[t-2])>>>17|s<<15)^(s>>>19|s<<13)^s>>>10,A[t]=A[t-16]+h+A[t-7]+i<<0;for(f=c&y,t=0;t<64;t+=4)this.first?(n=704751109,w=(s=A[0]-210244248)-1521486534<<0,p=s+143694565<<0,this.first=!1):(h=(u>>>2|u<<30)^(u>>>13|u<<19)^(u>>>22|u<<10),r=(n=u&c)^u&y^f,w=p+(s=w+(i=(l>>>6|l<<26)^(l>>>11|l<<21)^(l>>>25|l<<7))+(l&d^~l&b)+e[t]+A[t])<<0,p=s+(h+r)<<0),h=(p>>>2|p<<30)^(p>>>13|p<<19)^(p>>>22|p<<10),r=(o=p&u)^p&c^n,b=y+(s=b+(i=(w>>>6|w<<26)^(w>>>11|w<<21)^(w>>>25|w<<7))+(w&l^~w&d)+e[t+1]+A[t+1])<<0,h=((y=s+(h+r)<<0)>>>2|y<<30)^(y>>>13|y<<19)^(y>>>22|y<<10),r=(a=y&p)^y&u^o,d=c+(s=d+(i=(b>>>6|b<<26)^(b>>>11|b<<21)^(b>>>25|b<<7))+(b&w^~b&l)+e[t+2]+A[t+2])<<0,h=((c=s+(h+r)<<0)>>>2|c<<30)^(c>>>13|c<<19)^(c>>>22|c<<10),r=(f=c&y)^c&p^a,l=u+(s=l+(i=(d>>>6|d<<26)^(d>>>11|d<<21)^(d>>>25|d<<7))+(d&b^~d&w)+e[t+3]+A[t+3])<<0,u=s+(h+r)<<0,this.chromeBugWorkAround=!0;this.h0=this.h0+u<<0,this.h1=this.h1+c<<0,this.h2=this.h2+y<<0,this.h3=this.h3+p<<0,this.h4=this.h4+l<<0,this.h5=this.h5+d<<0,this.h6=this.h6+b<<0,this.h7=this.h7+w<<0},
	u.prototype.hex=function(){this.finalize();var t=this.h0,h=this.h1,r=this.h2,s=this.h3,e=this.h4,n=this.h5,o=this.h6,a=this.h7;return i[t>>>28&15]+i[t>>>24&15]+i[t>>>20&15]+i[t>>>16&15]+i[t>>>12&15]+i[t>>>8&15]+i[t>>>4&15]+i[15&t]+i[h>>>28&15]+i[h>>>24&15]+i[h>>>20&15]+i[h>>>16&15]+i[h>>>12&15]+i[h>>>8&15]+i[h>>>4&15]+i[15&h]+i[r>>>28&15]+i[r>>>24&15]+i[r>>>20&15]+i[r>>>16&15]+i[r>>>12&15]+i[r>>>8&15]+i[r>>>4&15]+i[15&r]+i[s>>>28&15]+i[s>>>24&15]+i[s>>>20&15]+i[s>>>16&15]+i[s>>>12&15]+i[s>>>8&15]+i[s>>>4&15]+i[15&s]+i[e>>>28&15]+i[e>>>24&15]+i[e>>>20&15]+i[e>>>16&15]+i[e>>>12&15]+i[e>>>8&15]+i[e>>>4&15]+i[15&e]+i[n>>>28&15]+i[n>>>24&15]+i[n>>>20&15]+i[n>>>16&15]+i[n>>>12&15]+i[n>>>8&15]+i[n>>>4&15]+i[15&n]+i[o>>>28&15]+i[o>>>24&15]+i[o>>>20&15]+i[o>>>16&15]+i[o>>>12&15]+i[o>>>8&15]+i[o>>>4&15]+i[15&o]+i[a>>>28&15]+i[a>>>24&15]+i[a>>>20&15]+i[a>>>16&15]+i[a>>>12&15]+i[a>>>8&15]+i[a>>>4&15]+i[15&a]},
	u.prototype.toString=u.prototype.hex,
	u.prototype.digest=function(){this.finalize();var t=this.h0,h=this.h1,i=this.h2,r=this.h3,s=this.h4,e=this.h5,n=this.h6,o=this.h7;return[t>>>24&255,t>>>16&255,t>>>8&255,255&t,h>>>24&255,h>>>16&255,h>>>8&255,255&h,i>>>24&255,i>>>16&255,i>>>8&255,255&i,r>>>24&255,r>>>16&255,r>>>8&255,255&r,s>>>24&255,s>>>16&255,s>>>8&255,255&s,e>>>24&255,e>>>16&255,e>>>8&255,255&e,n>>>24&255,n>>>16&255,n>>>8&255,255&n,o>>>24&255,o>>>16&255,o>>>8&255,255&o]},
	u.prototype.array=u.prototype.digest,
	u.prototype.arrayBuffer=function(){this.finalize();var t=new ArrayBuffer(32),h=new DataView(t);return h.setUint32(0,this.h0),h.setUint32(4,this.h1),h.setUint32(8,this.h2),h.setUint32(12,this.h3),h.setUint32(16,this.h4),h.setUint32(20,this.h5),h.setUint32(24,this.h6),h.setUint32(28,this.h7),t},c.prototype=new u,c.prototype.finalize=function(){if(u.prototype.finalize.call(this),this.inner){this.inner=!1;var t=this.array();u.call(this,this.sharedMemory),this.update(this.oKeyPad),this.update(t),u.prototype.finalize.call(this)}};
	var y=function(){var t=a("hex");t.create=function(){return new u},t.update=function(h){return t.create().update(h)};for(var h=0;h<n.length;++h){var i=n[h];t[i]=a(i)}return t}();y.sha256=y,y.sha256.hmac=function(){var t=f("hex");t.create=function(t){return new c(t)},t.update=function(h,i){return t.create(h).update(i)};for(var h=0;h<n.length;++h){var i=n[h];t[i]=f(i)}return t}();return y.sha256}();
export const sha256 = __sha256.sha256;/* eslint-enable */

/**
 * Получить первые N шестнадцатеричных цифер хеша
 * @param {string} line 
 * @param {number} [len]
 * @returns {string}
 */
export const sha256trimL = (line, len = ITEM_HASH_LEN) => {
	return sha256(line).substring(0, len);
};

/**
 * Преобразует текстовое представление объекта из атрибита в Javascript-объект.
 * Пример sg-атрибута со значениями: sg-item-variables="{ $tagClass: 'text-bg-primary', $tagStyle: 'background-color: $green', $x: -123.45, $y: 400, $description: 'Some text3...' }"
 * @ai ChatGPT
 * @param {string} line 
 * @returns {object}
 */
export function parseItemVariablesLine(line) {
	const result = {};
	const content = line.trim().slice(1, -1); // Убираем { и }
	let pairs = content.split(/,(?![^[]*\]|[^{]*\})/); // Разбиваем по запятым, игнорируя вложенные структуры
	pairs.forEach(pair => {
		let [key, value] = pair.split(/:(.+)/).map(s => s.trim()); // Разделяем по первому двоеточию
		key = key.replace(/^"|"$/g, '').replace(/^'|'$/g, ''); // Убираем кавычки у ключа
		if (value.startsWith("'") && value.endsWith("'")) {
			value = value.slice(1, -1); // Убираем одинарные кавычки у строк
		} else if (!isNaN(value)) {
			value = Number(value); // Преобразуем числа
		} else if (value === 'true' || value === 'false') {
			value = value === 'true'; // Преобразуем boolean
		} else {
			value = `$${value}`; // Если значение - это не число и без одинарных кавычек, значит это имя свойства!
		}
		result[key] = value;
	});
	return result;
}

/**
 * Получить массив строк из текстового представления в формате PostgreSQL массива
 * @param {string} line
 * @returns {Array}
 */
export function parsePgStrArray(line) {
	const result = [];
	if (line.startsWith('{') && line.endsWith('}')) {
		if (line.at(1) === '"' && line.at(-2) === '"') {
			line = line.slice(2, -2);
			const item = line.split('","');
			item.forEach(line => {
				if (line.startsWith('(') && line.endsWith(')')) {
					const arr = [];
					result.push(arr);
					line = line.slice(1, -1).replaceAll('\\"', '"').replaceAll('\\\\', '\\').replaceAll('""', '$DOUBLE_QUOTE$');
					const parts = line.matchAll(/"([^"]+(?:\\[^"]+)*)"|([^,]+)/g);
					parts.forEach(part => {
						if (part === '""') {
							arr.push('');
						} else {
							const str = part[1] || part[2];
							arr.push(str.replace('\\\\', '\\').replaceAll('$DOUBLE_QUOTE$', '"'));
						}
					});
				} else {
					result.push(line);
				}
			});
		} else {
			line = line.slice(1, -1);
			const item = line.split(',');
			result.push(...item);
		}
	}
	return result;
}

/**
 * Клонирование с вложенными объектами, причём вложенные объекты также клонируются за исключением объектов-инстансов пользовательских классов.
 * P.S: стандартную функцию structuredClone() не используем, т.к. она не поддерживает свойства-функции и не учитывает особенности объектов на основе пользовательских классов
 * @param {object|primitive} source Исходный объект
 * @param {WeakMap} [_seen] Для внутреннего использования (отслеживание циклических ссылок)
 * @return {object|primitive}
 */
export function clone(source, _seen = new WeakMap()) {
	if (source === null || typeof source !== 'object') {
		return source;
	}
	if (_seen.has(source)) {
		return _seen.get(source);
	}
	let dest;
	if (Array.isArray(source)) {
		dest = [];
		_seen.set(source, dest);
		for (let i = 0; i < source.length; i++) {
			dest[i] = clone(source[i], _seen);
		}
	} else if (isSet(source)) {
		dest = new Set();
		_seen.set(source, dest);
		for (const value of source) {
			dest.add(clone(value, _seen));
		}
	} else if (isMap(source)) {
		dest = new Map();
		_seen.set(source, dest);
		for (const [key, value] of source) {
			dest.set(key, clone(value, _seen));
		}
	} else if (Object.getPrototypeOf(source) !== Object.prototype) {
		return source; // Инстансы пользовательских классов передаём по ссылке!
	} else {
		dest = {};
		_seen.set(source, dest);
		for (const p in source) {
			if (Object.hasOwn(source, p)) {
				dest[p] = clone(source[p], _seen);
			}
		}
	}
	return dest;
};

/**
 * Перезаписать рекурсивно значения всех свойств/элементов объекта/массива **dest** соответствующими значениями свойств/элементов объекта/массива **sources**
 * @param {object|array} dest
 * @param {object|array} source
 * @param {number} [flags=0b0011]	Флаги:
 * 	0001 (1) - добавлять незнакомые свойства, т.е. свойства, которые есть в source, но нет в dest - будут копироваться
 * 	0010 (2) - режим форса (перезаписывает свойство даже если типы разные)
 * @param {string} [comments]			Комментарий для отладки ошибок
 * @param {string} [_path]				Приватный параметр для внутреннего использования при рекурсивных вызовах
 * @param {object} [_seen]				Для защиты от циклических ссылок
 * @returns {dest}								Модифицированный dest
 */
/*export function initObjectByObject(dest, source, flags = 0b0011, comments = '', _path = '{...}', _seen = new WeakSet()) {
	if (!isObject(dest)) {
		console.warn(`"dest" is not an object at ${_path}! ${comments}`);
		return dest;
	}
	if (!isObject(source)) {
		console.warn(`"source" is not an object at ${_path}! ${comments}`);
		return dest;
	}
	if (_seen.has(source)) {
		console.warn(`Circular reference detected at ${_path}! ${comments}`);
		return dest;
	}
	_seen.add(source);
	const allowAddNew = (flags & 1) === 1;
	const forceReplace = (flags & 2) === 2;
	for (const propName in source) {
		const sourceVal = source[propName];
		const destHasProp = Object.hasOwn(dest, propName);	
		if (destHasProp || allowAddNew) {
			const destVal = dest[propName];
			if (isObject(sourceVal)) {
				if (isObject(destVal) || forceReplace) {
					if (!isObject(destVal)) {
						dest[propName] = Array.isArray(sourceVal) ? [] : {};
					}
					initObjectByObject(dest[propName], sourceVal, flags, comments, `${_path}.${propName}`, _seen);
				} else {
					console.warn(`Type mismatch at ${_path}["${propName}"] — skip copying nested object. ${comments}`);
				}
			} else {
				dest[propName] = sourceVal;
			}
		} else {
			console.warn(`Property missing in dest: ${_path}["${propName}"] will be ignored. ${comments}`);
		}
	}
	return dest;
};*/

const ret = {
	__enumerableFalse,
	OBJECT_EMPTY,
	fStub,
	isEmpty,
	isPrimitive,
	isObject,
	isPromise,
	isSet,
	isMap,
	toNumberOrNull,
	toNumber,
	toNumbers,
	toBooleanOrNull,
	toStringOrNull,
	roundTo,
	upperFirstLetter,
	sleep,
	toPaddedBinary,
	uuidLite,
	sha256,
	sha256trimL,
	parseItemVariablesLine,
	parsePgStrArray,
	clone,
	//initObjectByObject, // TODO DEL?
};
Object.defineProperties(ret, Object.keys(ret).reduce((acc, name) => (acc[name] = __enumerableFalse, acc), {}));
ret.isNode = isNode;
ret.isBrowser = isBrowser;
ret.__global = __global;

export default ret;

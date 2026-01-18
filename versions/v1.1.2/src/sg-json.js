"use strict";

/*!
 * SGJSON - Работа с JSON в SGModel
 * @version 1.1.2
 * @requires ES2025+ (ES16+)
 * @link https://github.com/sg2d/model.sg2d.ru
 * @license SGJSON may be freely distributed under the MIT license
 * @copyright 2019-2025 © Калашников Илья (https://model.sg2d.ru, sg2d@yandex.ru)
 */

import SGModel from './sg-model.js';
import Utils from './sg-utils.js';

const __standardFunctions = {};
for (const name of Object.getOwnPropertyNames(Utils.__global)) {
	const value = Utils.__global[name];
	if (typeof value === 'function' && value.toString().includes('[native code]')) {
		__standardFunctions[value.name] = value;
	}
}
delete __standardFunctions['Object'];

class DeclarationCache extends Map {
	get(func) {
		if (!super.has(func)) {
			const prefix = __standardFunctions[func.name] ? 'standard ' : '';
			const decl = String(func).startsWith('class ')
				? `[[${prefix}class ${func.name}]]`
				: `[[${prefix}function${func.name ? ` ${func.name}` : ''}(${Array(func.length).fill('_').join(', ')})]]`;
			this.set(func, decl);
		}
		return super.get(func);
	}
}

export default class SGJSON {
	static FLAGS = {
		NONE:												0b0000_0000_0000,
		WITH_EMPTIES:								0b0000_0000_0001,
		FUNCTION_DECLARATION:				0b0000_0000_0010,
		USER_FUNCTION_DETAILS:			0b0000_0000_0100,
		//TODO:											0b0000_0000_1000,
		PRINT_OBJECT_TYPE:					0b0000_0001_0000,
		ALL_ATTRIBUTES:							0b0000_1000_0000,
		RUN_TOJSON:									0b0001_0000_0000, // системный флаг
		SKIP_FUNCTION_DECLARATION:	0b0010_0000_0000, // системный флаг
		NAME_WITH_TYPE:							0b0100_0000_0000, // системный флаг
		PRINT_ELEMENT_TYPE:					0b1000_0000_0000, // системный флаг (для вывода типа элемента-объекта массива)
		JSON_DEBUG: 								0b0001_0001_0110, // RUN_TOJSON | FUNCTION_DECLARATION | USER_FUNCTION_DETAILS | PRINT_OBJECT_TYPE
	};
	static #jsonStandardProto = [Object.prototype, Array.prototype, Function.prototype];
	static #cacheDeclFunctions = new DeclarationCache();

	static getCodeFlags(flags) {
		const results = new Set();
		for (const code in this.FLAGS) {
			if ((flags & this.FLAGS[code]) !== 0) {
				results.add(code);
			}
		}
		return `${SGModel.utils.toPaddedBinary(flags, 8)}: ${[...results].join(',')}`;
	}

	/**
	 * Рекурсивное преобразование коллекции с учетом флагов и предотвращения циклических ссылок в обычный объект/массив
	 */
	static #convertCollection(instance, value, flags, _seen) {
		if (Array.isArray(value)) {
			const _flags = flags | ((flags & this.FLAGS.PRINT_OBJECT_TYPE) ? this.FLAGS.PRINT_ELEMENT_TYPE : 0); // Т.к. в массивах у элементов нет возможности вывести тип, то выводим тип последним свойством элемента в виде `"[[Prototype.constructor]]": "[[class XXX]]"`
			return value.map(value => this.get(value, _flags, instance, _seen));
		}
		if (Utils.isSet(value)) return this.get([...value], flags, instance, _seen);
		if (Utils.isMap(value)) return this.get(Object.fromEntries(value), flags, instance, _seen);
		if (!Utils.isObject(value)) {
			throw new Error(`value is not an object!`);
		}
		if (__standardFunctions[value.constructor?.name]) {
			return typeof value.toJSON === 'function' ? value.toJSON(flags, _seen) : value.toString();
		}
		const result = {};
		for (const name in value) { // Включая унаследованные свойства и методы
			try {
				const val = this.get(value[name], flags, instance, _seen);
				const _flags = (!Utils.isObject(val) || Object.keys(val).length) ? flags | this.FLAGS.NAME_WITH_TYPE : flags;
				result[this.#jsonName(instance, name, value[name], _flags)] = val;
			} catch {
				// Геттеры, выбрасывающие исключения — игнорируем
			}
		}
		if (
			(((flags & (~this.FLAGS.PRINT_OBJECT_TYPE)) === 0) && (flags & (this.FLAGS.FUNCTION_DECLARATION | this.FLAGS.USER_FUNCTION_DETAILS)))
			|| ((flags & this.FLAGS.PRINT_ELEMENT_TYPE) !== 0)
		) {
			const declFunction = (value.constructor !== Object) && this.#cacheDeclFunctions.get(value.constructor);
			if (declFunction) result['[[Prototype.constructor]]'] = declFunction;
		}
		return result;
	}

	static #jsonName(instance, name, value, flags = 0) {
		if ((instance?.constructor?.printPropertyType === true || (flags & this.FLAGS.PRINT_OBJECT_TYPE)) && !Utils.isPrimitive(value)) {
			const proto = Object.getPrototypeOf(value);
			const isClass = (typeof value === 'function' ? this.#cacheDeclFunctions.get(value) : '').includes('[[class');
			return this.#jsonStandardProto.includes(proto)
				? (
					isClass && (flags & this.FLAGS.NAME_WITH_TYPE)
						? `${name}:::${value.name || '[[Unnamed function]]'}`
						: name
				)
				: `${name}${proto.name ? `::${proto.name}` : (value.constructor?.name ? `:${value.constructor.name}` : '')}`;
		}
		return name;
	}

	/**
	 * Получить json-представление данных (например, для сохранения в постоянное хранилище)
	 * @param {object} instance - инстанс SGModel
	 * @param {number} [flags] - Флаги, см. в описании для `get()`
	 * @param {WeakSet} [_seen] - Для внутреннего использования (отслеживание циклических ссылок)
	 * @returns {object}
	 */
	static getData(instance, flags = 0, _seen = new WeakSet()) {
		const dest = {};
		if (_seen.has(instance)) {
			return '[[Circular reference]]';
		}
		_seen.add(instance);
		const properties = (flags & this.FLAGS.ALL_ATTRIBUTES) ? Object.keys(instance.data) : (
			Array.isArray(instance.constructor.storageProperties) ?
				instance.constructor.storageProperties :
				Object.keys(instance.data).filter(name => !name.startsWith('_'))); // Свойства, начинающиеся с '_', игнорируются
		for (let name of properties) {
			const value = instance.data[name];
			if (Utils.isPrimitive(value)) {
				if (value || (flags & this.FLAGS.WITH_EMPTIES)) {
					dest[name] = value;
				}
			} else {
				if (flags & this.FLAGS.RUN_TOJSON) {
					name = this.#jsonName(instance, name, value, flags);
				}
				if (value instanceof SGModel) {
					dest[name] = this.getData(value, flags, _seen);
				} else if (Array.isArray(value) && (instance.defaults[name]?.type === SGModel.TYPES.ARRAY_MODEL)) {
					dest[name] = value.map((item) => (item instanceof SGModel ? this.getData(item, flags, _seen) : this.get(item, flags, instance, _seen)));
				} else if (typeof value === 'function') {
					if (flags & this.FLAGS.FUNCTION_DECLARATION) {
						const declFunction = this.#cacheDeclFunctions.get(value);
						dest[name] = declFunction;
					}
				} else {
					dest[name] = this.#convertCollection(instance, value, flags, _seen);
				}
			}
		}
		_seen.delete(instance);
		return dest;
	}

	/**
	 * Подготовить объект на основе инстанса SGModel для преобразования в текстовое json-представление
	 * @param {object} instance - инстанс SGModel
	 * @param {number} [flags] - Флаги, см. в описании для `get()`
	 * @param {WeakSet} [_seen] - Для внутреннего использования (отслеживание циклических ссылок)
	 * @returns {string}
	 */
	static toJSON(instance, flags = void 0, _seen = new WeakSet()) {
		if (flags === void 0) { // Для вывода статических свойств и методов пользовательских классов
			flags = this.FLAGS.RUN_TOJSON;
			if (instance?.constructor?.allowJSONFunctions) {
				flags |= this.FLAGS.FUNCTION_DECLARATION | this.FLAGS.USER_FUNCTION_DETAILS;
			}
		}
		const result = Object.assign(
			{
				data: this.getData(instance, flags | this.FLAGS.ALL_ATTRIBUTES | this.FLAGS.WITH_EMPTIES | this.FLAGS.RUN_TOJSON, _seen),
			},
			this.get(instance, flags, instance, _seen)
		);
		if (flags & (this.FLAGS.FUNCTION_DECLARATION | this.FLAGS.USER_FUNCTION_DETAILS)) {
			const declClass = this.#cacheDeclFunctions.get(instance.constructor);
			_seen.add(instance);
			result[declClass] = this.get(instance.constructor, flags | this.FLAGS.FUNCTION_DECLARATION | this.FLAGS.USER_FUNCTION_DETAILS | this.FLAGS.SKIP_FUNCTION_DECLARATION, instance, _seen);
			const declSGModel = this.#cacheDeclFunctions.get(SGModel);
			result[declClass][declSGModel] = this.get(SGModel, this.FLAGS.USER_FUNCTION_DETAILS | this.FLAGS.SKIP_FUNCTION_DECLARATION, instance, _seen);
			Object.assign(result[declClass][declSGModel].utils ??= {}, {
				isNode: SGModel.utils.isNode,
				isBrowser: SGModel.utils.isBrowser,
				__global: String(SGModel.utils.__global),
			});
			_seen.delete(instance);
		}
		return result;
	}

	/**
	 * Подготовить данные к json-представлени
	 * @param {*} value
	 * @param {number} [flags] - Флаги:
	 * 		FUNCTION_DECLARATION - Свойства-функции попадут в результат в виде текстового объявления
	 *		USER_FUNCTION_DETAILS - Свойства-функции будут обработаны и выведены как объект
	 * 		WITH_EMPTIES - В данных (this.data) оставлять свойства с пустыми (нулевыми) значениями (!value не будет проигнорирован)
	 * 		ALL_ATTRIBUTES - Будут обработаны все данные в this.data, а не только те, которые указаны storageProperties или не начинающиеся с "_"
	 * @param {object} [instance] - Инстанс для детализации SGModel-инстансов (параметр не обязателен)
	 * @param {WeakSet} [_seen] - Для внутреннего использования (отслеживание циклических ссылок)
	 * @returns 
	 */
	 static get(value, flags = 0, instance = void 0, _seen = new WeakSet()) {
		if (Utils.isPrimitive(value)) {
			if (Object.is(value, NaN)) return 'NaN';
			if (value === Infinity) return `Infinity`;
			if (value === -Infinity) return `-Infinity`;
			return value;
		}
		if (_seen.has(value)) {
			return '[[Circular reference]]';
		}
		_seen.add(value);
		let result = void 0;
		if (typeof value === 'function') {
			if (flags & this.FLAGS.SKIP_FUNCTION_DECLARATION) {
				result = Object.fromEntries(Object.entries(value).map(
					([name, val]) => ([this.#jsonName(instance, name, val, flags), this.get(val, flags & (~this.FLAGS.SKIP_FUNCTION_DECLARATION), instance, _seen)])
				));
			} else {
				const declFunction = this.#cacheDeclFunctions.get(value);
				if (flags & this.FLAGS.USER_FUNCTION_DETAILS) {
					if (__standardFunctions[value.name]) {
						if (flags & this.FLAGS.FUNCTION_DECLARATION) {
							result = declFunction;
						} else {
							// no code (result = void 0)
						}
					} else {
						const staticProperties = Object.fromEntries(Object.entries(value).map(
							([name, value]) => ([this.#jsonName(instance, name, value, flags), this.get(value, flags, instance, _seen)])
						));
						if (Object.keys(staticProperties).length) {
							result = staticProperties;//{ [declFunction]: staticProperties	};
						} else {
							result = declFunction;
						}
					}
				} else if (flags & this.FLAGS.FUNCTION_DECLARATION) {
					result = declFunction;
				} else {
					if (SGModel.isBasedOnModel(value, this.FLAGS.NONE)) {
						result = declFunction;
					}
				}
			}
		} else { // object
			result = this.#convertCollection(instance, value, flags, _seen);
		}
		_seen.delete(value);
		return result;
	}

	/**
	 * Получить отладочный объект/значение переменной
	 * @param {*} value 
	 * @param {number} flags 
	 * @param {object} instance 
	 * @returns {*}
	 */
	static debug(value, instance = void 0, flags = this.FLAGS.JSON_DEBUG) {
		if (value instanceof SGModel) {
			return value.toJSON(this.FLAGS.JSON_DEBUG);
		}
		return this.get(value, flags, instance);
	}
}

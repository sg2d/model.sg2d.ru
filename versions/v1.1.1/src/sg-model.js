"use strict";

import Utils from './sg-utils.js';
import SGTypes from './sg-types.js';
import SGJson from './sg-json.js';

/**
 * SGModel - Библиотека-класс для структурирования веб-приложений с помощью биндинг-моделей. Библиотека хорошо адаптирована для наследования классов. Может использоваться как в браузере, так и на Node.js.
 * @english A library class for structuring web applications using binding models. The library is well adapted for inheritance classes. Can be used both in the browser and on Node.js.
 * @version 1.1.1
 * @requires ES2024+ (ES15+)
 * @link https://github.com/sg2d/model.sg2d.ru
 * @license SGModel may be freely distributed under the MIT license
 * @copyright 2019-2025 © Калашников Илья (https://model.sg2d.ru)
 */
class SGModel {

	/**
	 * Версия библиотеки (фиксируется при сборке проекта)
 	 * @readonly
	 * @constant {string}
	 */
	static version = (typeof __SGMODEL_VERSION__ !== 'undefined' ? __SGMODEL_VERSION__ : '1.1.1'); // eslint-disable-line no-undef

	static utils = Utils;
	static json = SGJson;
	static TYPES = SGTypes.TYPES;
	static BaseType = SGTypes.BaseType;

	/**
	 * @constant {array}
	 */
	static standardKeys = ['id','code','uuid','uid','index','hash'];

	/**
	 * Выводить или нет объявления функций при вызове toJSON() или JSON.strigify()
	 * @overridden
	 */
	static allowJSONFunctions = false;

	/**
	 * Выводить или нет тип объекта в имени свойства при вызове toJSON() или JSON.strigify()
	 * @overridden
	 */
	static printPropertyType = false;

	/**
	 * Флаг, передаваемый в вызове **.on(...)** для выполнения колбэка сразу же
	 * @constant {boolean}
	 */
	static FLAGS = Object.freeze({
		NONE:												0b0000_0000_0000,
		IMMEDIATELY:								0b0000_0000_0001,
		OFF_MAY_BE:									0b0000_0000_0010, // Если в процессе вызова колбэков может быть выполнен `this.off()`, нужно передать этот флаг
		PREV_VALUE_CLONE:						0b0000_0000_0100, // Клонировать предыдущее значение (тяжелое клонирование для объектов/массивов)
		NO_CALLBACKS:								0b0000_0000_1000, // Не выполнять колбэки
		FORCE_CALLBACKS:						0b0000_0001_0000, // Выполнить колбэки, даже если не было изменений
		NO_DESTROY_INSTANCE_MODEL:	0b0000_0010_0000, // не вызывать destroy() у инстансов на основе SGModel
		INCLUDING_INSTANCE:					0b0001_0000_0000, // системный флаг (При проверке значения свойства на тип SGModel будут учтены инстансы)
		FIRST_VALIDATE:							0b0010_0000_0000, // системный флаг
	});

	/**
	 * Возможен только один инстанс класса (Singleton)
	 */
	static singleInstance = false;

	/**
	 * Возможно несколько инстансов класса
	 */
	static multipleInstances = false;

	/**
	 * Автоматическое сохранение в хранилище при изменении любого свойства
	 */
	static autoSave = false;

	/**
	 * Значения свойств по умолчанию и тип. Задаётся в классах потомках. Может быть либо объектом со свойствами, либо функцией, возвращающей объект со свойствами.
	 * Есть несколько способов описать каждое свойство:
	 * 	- значение (тип определяется автоматически)
	 *  - тип (значение устанавливается пустое для данного типа)
	 *  - значение и явное указание типа в формате массива `[value, type]` или в виде объекта `{ value, type }`
	 * @overridden
	 */
	/*static defaults = { prop1: 12345, prop2: SGModel.TYPE.$TYPE, prop3: [[22,333,10], SGModel.TYPES.$TYPE], prop4: { value: {a: 1, b: 22}, type: SGModel.TYPES.$TYPE }};*/
	/*static defaults = () => { return {...}; };*/

	/**
	 * Если указано непустое строковое значение, то данные синхронизируются с локальным хранилищем.
	 * P.S: Поддерживается хранения данных как одного экземпляра класса (одиночного экземпляра), так и нескольких экземпляров: `localStorageKey + '_' + id`
	 */
	static localStorageKey = ''; // override

	/**
	 * Разрешить неявное объявление свойств (тип этих свойств определяется автоматически при первом получении значения свойства)
	 * Явное объявление свойств - через defaults и properties в конструкторе, не явное - в других местах кода.
	 * @overridden
	 */
	static allowUndeclaredProperties = true;

	/**
	 * Ссылка на единственный экземпляр класса при singleInstance = true
	 * @protected
	 * @overridden
	 * @type {object}
	 */
	static __instance = null;

	/**
	 * Все инстансы классов-потомков от SGModel и SGModelView
	 * @protected
	 */
	static __instances = {};

	/**
	 * Все инстансы классов-потомков от SGModel и SGModelView в разрезе имён классов-потомков
	 * @protected
	 */
	static __instancesByClass = {};

	/**
	 * Все классы-потомки от SGModel и SGModelView
	 * @protected
	 */
	static __classes = {};

	/**
	 * Хеш формируется для всех классов-потомков от SGModel (SGModelView) как sha256 от String(this.constructor)
	 * @protected
	 * @overridden
	 * @type {string}
	 */
	/*static __hash = '';*/

	/**
	 * Инкриминирующее значение счётчика
	 * @private
	 */
	static #uid = 0;

	static {
		console.debug('SGModel version:', this.version);
		Object.defineProperties(this, // TODO: ES2026 использовать декоратор @enumerableFalse?
			'__instance,__instances,__instancesByClass,__classes,\
			standardKeys,singleInstance,multipleInstances,autoSave,localStorageKey,allowUndeclaredProperties,printPropertyType,allowJSONFunctions,\
			json,utils,TYPES,BaseType,FLAGS'
				.split(',').reduce((result, name) => (result[name.trim()] = Utils.__enumerableFalse, result), {})
		);
	}

	/**
	 * Значение сквозного счётчика текущего экземпляра класса унаследованного от SGModel
	 * @protected
	 */
	__uid = 0;

	/**
	 * Главный объект экземпляров SGModel (свойства экземпляра).
	 * Для доступа используйте Proxy-объект this.data или методы get(), set(), addTo(), removeFrom(), clearProperty()
	 * @private
	 */
	#data = null;

	#onChangeCallbacks = {};

	/**
	 * Proxy-объект для #data
	 * @public
	 * @type {Proxy}
	 */
	data = null;

	/**
	 * Имена свойств, для которых принудительно выставляется флаг FLAGS.IMMEDIATELY в моменте, когда регистрируется подписчик, т.е. выполняется `this.on()`
	 */
	deferredProperties = new Set();

	/**
	 * Данные singleton-экземпляра (задаётся только в классах-потомках!)
	 * @public
	 * @overridden
	 * @type {Proxy}
	 */
	/*static data;*/

	#initializationResolve = null;
	#initializationReject = null;

	/**
	 * Объект Promise, отвечающий за инициализацию (функции resolve() и reject() доступны внутри объекта)
	 * @public
	 * @type {Promise}
	 */
	initialization = (() => {
		const publicProm = Promise.withResolvers();
		const privateProm = Promise.withResolvers();
		this.#initializationResolve = publicProm.resolve;
		this.#initializationReject = publicProm.reject;
		publicProm.promise.reject = publicProm.reject;
		publicProm.promise.__promise = privateProm.promise;	// @private
		publicProm.promise.__resolve = privateProm.resolve;	// @private
		publicProm.promise.__reject = privateProm.reject;		// @private
		return publicProm.promise;
	})();

	/**
	 * @public
	 * @type {boolean}
	 */
	initialized = (
		//this.initialization.__sg_instance = this, // @debug
		false
	);

	/**
	 * Вызывается сразу после создания экземпляра. Переопределяется в классах потомках.
	 * @overridden
	 * @public
	 * @returns {undefined|boolean}
	 */
	async initialize() {
		// no code
	}

	/**
	 * reset manually!
	 * @public
	 */
	changed = false;

	/**
	 * Если true, значит экземпляр прошёл процедуру уничтожения destroy()
	 */
	destroyed = false;

	/**
	 * SGModel конструктор
	 * @param {object} [properties] - Свойства (атрибуты)
	 * @param {object} [options] - Опции
	 * @param {object} [thisProperties] - Свойства и методы, передаваемые в контекст **this** создаваемого инстанса
	 */
	constructor(properties = {}, options = void 0, thisProperties = void 0) {
		const self = this;
		if (!Utils.isObject(properties)) {
			throw new Error('properties must be object!');
		}
		if (Utils.isObject(thisProperties)) {
			Object.assign(this, thisProperties);
		}
		if (!this.constructor.__hash) {
			this.constructor.__hash = Utils.sha256(String(this.constructor).split('\n').map(line => line.trim()).join('\n'));
		}
		if (this.constructor.singleInstance) {
			if (this.constructor.__instance) {
				throw new Error('this.constructor.__instance not is empty!');
			}
			this.constructor.__instance = this;
		} else {
			this.constructor.multipleInstances = true;
		}

		if (Utils.isObject(this.constructor.options)) {
			this.options = Utils.clone(this.constructor.options);
		} else {
			this.options = {};
		}
		if (Utils.isObject(options)) {
			Object.assign(this.options, options);
		}

		const defaults = this.defaults = typeof (this.constructor.defaults ??= {}) === 'function'
			? this.constructor.defaults()
			: this.constructor.defaults;
		
		this.uuid ??= properties.uuid || (Utils.isPrimitive(defaults.uuid) ? defaults.uuid : void 0) || Utils.uuidLite();
		delete defaults.uuid;
		this.__uid = SGModel.#nextUID();
		const __class = SGModel.__classes[this.constructor.name];
		if (__class && __class.__hash !== this.constructor.__hash) {
			throw new Error(`Class ${this.constructor.name} has already been defined earlier (__hash "${__class.__hash}" repeated)!`);
		}
		SGModel.__classes[this.constructor.name] = this.constructor;
		if (SGModel.__instances[this.uuid]) {
			throw new Error(`uuid "${this.uuid}" already exists! See ${this.constructor.name}`);
		}
		SGModel.__instances[this.uuid] = this;
		(SGModel.__instancesByClass[this.constructor.name] = SGModel.__instancesByClass[this.constructor.name] || {})[this.uuid] = this;
		
		let storage = Utils.OBJECT_EMPTY;
		if (this.constructor.localStorageKey) {
			try {
				storage = JSON.parse( localStorage.getItem(
					`${this.constructor.localStorageKey}${this.constructor.singleInstance ? '' : `:${this.uuid}`}`
				) || {});
				if (!Utils.isObject(storage)) storage = Utils.OBJECT_EMPTY;
			} catch {true}
		}
		this.#data = {};
		for (const name of new Set([...Object.keys(defaults), ...Object.keys(properties), ...Object.keys(storage)])) {
			const isInDefault = Object.hasOwn(defaults, name);
			const isInProperties = Object.hasOwn(properties, name);
			const isInStorage = Object.hasOwn(storage, name);
			if (isInDefault) {
				const defaultValue = defaults[name];
				if (Utils.isObject(defaultValue)) {
					if (SGTypes.isPairValueType(defaultValue) && SGTypes.isBaseTypeProto(defaultValue[1])) {
						defaults[name] = { value: defaultValue[0], type: defaultValue[1] };
					} else if (SGTypes.isBaseTypeProto(defaultValue.type)) {
						defaults[name] = { value: defaultValue.value, type: defaultValue.type };
					} else {
						defaults[name] = SGTypes.buildValueType(defaultValue);
					}
				} else if (typeof defaultValue === 'function') {
					defaults[name] = SGTypes.isBaseTypeProto(defaultValue)
						? { value: defaultValue(), type: defaultValue }
						: SGTypes.buildValueType(defaultValue);
				} else {
					defaults[name] = SGTypes.buildValueType(defaultValue);
				}
			} else if (isInProperties) {
				const value = properties[name];
				if (Utils.isObject(value)) {
					if (SGTypes.isPairValueType(value) && SGTypes.isBaseTypeProto(value[1])) {
						defaults[name] = { value: value[1](), type: value[1] };
						properties[name] = value[0];
					} else if (SGTypes.isBaseTypeProto(value.type)) {
						defaults[name] = SGTypes.buildDefaultValueType(void 0, value.type);
						properties[name] = value.value;
					} else {
						defaults[name] = SGTypes.buildDefaultValueType(value);
					}
				} else if (typeof value === 'function') {
					if (SGTypes.isBaseTypeProto(value)) {
						defaults[name] = { value: value(), type: value };
						properties[name] = Utils.clone(defaults[name].value);
					} else {
						defaults[name] = SGTypes.buildDefaultValueType(value, void 0);
					}
				} else {
					defaults[name] = SGTypes.buildDefaultValueType(value);
				}
			}
			if (!Object.hasOwn(defaults, name)) continue; // Устаревшие storage-свойства игнорируются
			const valueOrig = isInStorage
				? storage[name] // TODO?: Utils.initObjectByObject(this.#data, data, void 0, `Instance of ${this.constructor.name} with uuid ${this.uuid} (uid=${this.__uid})`);
				: isInProperties
					? properties[name]
					: Utils.clone(defaults[name].value);
			if (valueOrig === void 0) continue;
			const { value } = this.validateProperty(name, valueOrig, valueOrig, void 0, SGModel.FLAGS.FIRST_VALIDATE);
			if (value === void 0) continue;
			this.#data[name] = value;
		}
		
		this.data = new Proxy(this.#data, {
			get(_data, name, receiver) { // eslint-disable-line no-unused-vars
				if (!self.constructor.allowUndeclaredProperties && (name in self.defaults === false)) {
					throw new Error(`Properties "${name}" doesn't exists! May not be registered in defaults! ${self.getDebugInfo()}`);
				}
				return _data[name];
			},
			set(_data, name, value, receiver) { // eslint-disable-line no-unused-vars
				if (name in self.defaults === false) {
					throw new Error(`Properties "${name}" doesn't exists! May not be registered in defaults! ${self.getDebugInfo()}`);
				}
				self.set(name, value);
				return true; // возвращаем всегда true, т.к. для false получим ошибку "Uncaught TypeError: 'set' on proxy: trap returned falsish for property 'filters'""
			},
			deleteProperty(_data, name) {
				if (name in self.defaults === false) {
					return self.set(name, void 0);
				}
				return false; // возвращаем false (значение не было успешно удалено)
			},
		});

		if (this.constructor.singleInstance) {
			this.constructor.data = this.data;
			Object.defineProperty(this.constructor, 'data', Utils.__enumerableFalse);
		}
		Object.defineProperties(this, {
			initialization: Utils.__enumerableFalse,
			data: Utils.__enumerableFalse,
			deferredProperties: Utils.__enumerableFalse,
		});

		// Дёргаем __initialize() и initialize() экземпляра после выполнения конструктора, что бы инициализировались приватные свойства (для SGModelView актуально)!
		setTimeout(async () => {
			this.__initialize(() => {
				Promise.all([
					this.initialize(),
					this.initialization.__promise
				]).then((results) => {
					const isError = results[0] === false || results[1] === false || results[0] instanceof Error || results[1] instanceof Error;
					this.initialized = !isError;
					if (isError) {
						this.#initializationReject(results);
					} else {
						this.#initializationResolve(true);
					}
				});
			});
		});
	}
	
	/**
	 * Вызывается когда экземпляр создан
	 * @protected
	 * @overridden Переопределяется в SGModelView
	 * @param {function} callback
	 * @return {Promise}
	 */
	async __initialize(callback) {
		callback();
		return this.initialization.__resolve(true);
	}

	/**
	 * @param {boolean} changed 
	 * @returns {boolean|Promise} 
	 */
	#changedAndCallbacks(changed, name, valueOrCollection, previous, options = Utils.OBJECT_EMPTY, flags = 0) {
		if (changed) {
			this.changed = true;
		}
		if (changed || (flags & SGModel.FLAGS.FORCE_CALLBACKS)) {
			if ((flags & SGModel.FLAGS.NO_CALLBACKS) === 0) {
				let callbacks = this.#onChangeCallbacks[name];
				if (callbacks) {
					previous = (options.previous_value !== void 0 ? options.previous_value : previous);
					if (flags & SGModel.FLAGS.OFF_MAY_BE) {
						callbacks = Utils.clone(callbacks);
					}
					let _val = void 0, i;
					for (i in callbacks) {
						const callback = callbacks[i];
						_val = callback.f.call(
							callback.c ? callback.c : this,
							callback.d ? callback.d : valueOrCollection,
							previous,
							name,
						);
						if (_val !== void 0) {
							previous = _val;
						}
					}
				}
				if (this.onAllCallback) {
					this.onAllCallback();
				}
			}
			if (this.constructor.autoSave === true) {
				return this.save();
			}
			return true;
		}
		return false;
	}

	/**
	 * Принимает имя свойства, новое и предыдущее значения, проверяет/модифицирует значение и возвращает откорректированное значение +признак изменения
	 * @public
	 * @param {string} name
	 * @param {mixed} nextValue
	 * @param {mixed} [previous] Для сложных объектов сами объекты сохраняются (не пересоздаются!), но очищаются! Для изменения элементов коллекции используйте методы addTo(), removeFrom() и др.
	 * @param {object} [options]
	 * @param {function}	[options.format] - Функция для обработки элемента коллекции (item, index)=>{return...}. Например, можно элемент в виде массива ['http://test.ru', 'Title...'] превратить в объект { url: 'http://test.ru', title: 'Title...' }
	 * @param {number} [flags]
	 * @returns {object} { value, previous, changed } Для сложных объектов - value - это сама коллекция!
	 */
	validateProperty(name, nextValue, previous = void 0, options = Utils.OBJECT_EMPTY, flags = 0) {
		if (nextValue === void 0) {
			throw new Error(`The "nextValue" parameter must have a value (received undefined)! ${this.getDebugInfo()}`);
		}
		const result = {
			value: previous,
			previous: (flags & SGModel.FLAGS._PREV_VALUE_CLONE) ? Utils.clone(previous) : previous,
			changed: false,
		};
		const defType = (this.defaults[name] ??= SGTypes.buildDefaultValueType(nextValue));
		switch (defType.type) {
			case SGModel.TYPES.ANY: break;
			case SGModel.TYPES.NUMBER: nextValue = Utils.toNumberOrNull(nextValue); break;
			case SGModel.TYPES.STRING: nextValue = Utils.toStringOrNull(nextValue); break;
			case SGModel.TYPES.BOOLEAN: nextValue = Utils.toBooleanOrNull(nextValue); break;
			case SGModel.TYPES.XY: {
				if (!Utils.isObject(nextValue)) nextValue = { x: Number(nextValue), y: Number(nextValue) };
				if (Object.keys(nextValue).length !== 2 || !Object.hasOwn(nextValue, 'x') || !Object.hasOwn(nextValue, 'y')) {
					throw new Error(`Property "${name}" must be in {x, y} object format! ${this.getDebugInfo()}`);
				}
				nextValue.x = Utils.toNumberOrNull(nextValue.x);
				nextValue.y = Utils.toNumberOrNull(nextValue.y);
				result.changed = true;
				if (Utils.isObject(previous)) {
					if (previous.x === nextValue.x && previous.y === nextValue.y) {
						result.changed = false;
					} else {
						previous.x = nextValue.x;
						previous.y = nextValue.y;
					}
					nextValue = previous;
				}
				break;
			}
			case SGModel.TYPES.ARRAY: case SGModel.TYPES.ARRAY_NUMBERS: {
				if (!nextValue) {
					nextValue = [];
				} else if (typeof nextValue === 'string') {
					nextValue = Utils.parsePgStrArray(nextValue);
				}
				if (!Array.isArray(nextValue)) {
					throw new Error(`Property "${name}" must be based on Array! ${this.getDebugInfo()}`);
				}
				if (nextValue !== previous) {
					if (typeof options.format === 'function') {
						nextValue.forEach((value, index) => (nextValue[index] = options.format(value, index)));
					} else if (defType.type === SGModel.TYPES.ARRAY_NUMBERS) {
						Utils.toNumbers(nextValue); // TODO precision
					}
					if (Array.isArray(previous)) {
						const len = nextValue.length;
						if (nextValue.length === previous.length) {
							for (let index = 0; index < len; index++) {
								if (previous[index] !== nextValue[index]) {
									previous[index] = nextValue[index];
									result.changed = true;
								}
							}
						} else {
							result.changed = true;
							previous.length = len;
							for (let index = 0; index < len; index++) {
								previous[index] = nextValue[index];
							}
						}
						nextValue = previous;
					} else {
						result.changed = true;
					}
				} else {
					if ((flags & SGModel.FLAGS.FIRST_VALIDATE) && defType.type === SGModel.TYPES.ARRAY_NUMBERS) {
						Utils.toNumbers(nextValue);
					}
				}
				break;
			}
			case SGModel.TYPES.OBJECT: {
				if (typeof nextValue !== 'object') { // null допускается!
					throw new Error(`Property "${name}" must be based on Object! ${this.getDebugInfo()}`);
				}
				if (nextValue === null) {
					result.changed = previous !== null;
				} else {
					if (nextValue !== previous) {
						if (typeof options.format === 'function') {
							for (const prop in nextValue) nextValue[prop] = options.format(nextValue[prop], prop);
						}
						if (Utils.isObject(previous)) {
							for (const prop in previous) {
								if (!Object.hasOwn(nextValue, prop)) {
									delete previous[prop];
									result.changed = true;
								}
							}
							for (const prop in nextValue) {
								if (!Object.hasOwn(previous, prop) || (previous[prop] !== nextValue[prop])) {
									previous[prop] = nextValue[prop];
									result.changed = true;
								}
							}
							nextValue = previous;
						} else {
							result.changed = true;
						}	
					}
				}
				break;
			}
			case SGModel.TYPES.SET: {
				if (typeof nextValue === 'string') {
					nextValue = Utils.parsePgStrArray(nextValue);
				}
				if (!Array.isArray(nextValue) && !Utils.isSet(nextValue)) {
					throw new Error(`Property "${name}" must be a Set class, Array or string in the format "{value1,value2,...}"! ${this.getDebugInfo()}`);
				}
				if (nextValue !== previous) {
					const inputArray = Array.isArray(nextValue) ? nextValue : Array.from(nextValue);
					const processedArray = (typeof options.format === 'function')
						? inputArray.map((v, i) => options.format(v, i))
						: inputArray;
					if (Utils.isSet(previous)) {
						for (const val of previous) {
							if (!processedArray.includes(val)) {
								previous.delete(val);
								result.changed = true;
							}
						}
						for (const val of processedArray) {
							if (!previous.has(val)) {
								previous.add(val);
								result.changed = true;
							}
						}
						nextValue = previous;
					} else {
						nextValue = new Set(processedArray);
						result.changed = true;
					}
				}
				break;
			}
			case SGModel.TYPES.MAP: {
				if (typeof nextValue === 'string') {
					nextValue = new Map(
						Utils.parsePgStrArray(nextValue)
							.map((item, index) => [index, options.format?.(item, index) ?? item])
					);
				} else if (Utils.isObject(nextValue) && !Utils.isMap(nextValue)) {
					const entries = Array.isArray(nextValue) ? nextValue : Object.entries(nextValue);
					nextValue = new Map(
						entries.flatMap((pair, index) => 
							pair.length === 2 
								? [[pair[0], options.format?.(pair[1], pair[0], index) ?? pair[1]]] 
								: (console.warn(`Error validating property "${name}" - nextValue is not in the correct format!`), [])
						)
					);
				} else if (nextValue !== previous && Utils.isMap(nextValue) && typeof options.format === 'function') {
					let index = 0;
					nextValue.forEach(([key, value]) => nextValue.set(key, options.format(value, index++, key)));
				}
				if (!Utils.isMap(nextValue)) {
					throw new Error(`Property "${name}" must be based on Object (not null)! ${this.getDebugInfo()}`);
				}
				if (Utils.isMap(previous)) {
					if (nextValue !== previous) {
						for (const [key, _] of previous) {
							if (!nextValue.has(key)) {
								previous.delete(key);
								result.changed = true;
							}
						}
						for (const [key, val] of nextValue) {
							if (!previous.has(key) || previous.get(key) !== val) {
								previous.set(key, val);
								result.changed = true;
							}
						}
						nextValue = previous;
					}
				} else {
					result.changed = true;
				}
				break;
			}
			case SGModel.TYPES.MODEL: {
				if (nextValue !== null && !SGModel.isBasedOnModel(nextValue)) {
					throw new Error(`The value of property "${name}" must be an SGModel-based instance or be an SGModel (SGModelView)! ${this.getDebugInfo()}`);
				}
				if (nextValue !== previous) {
					if ((flags & SGModel.FLAGS.NO_DESTROY_INSTANCE_MODEL) === 0 && (previous instanceof SGModel)) {
						previous.destroy(flags);
					}
					result.changed = true;
				}
				break;
			}
			case SGModel.TYPES.ARRAY_MODEL: {
				if (!Array.isArray(nextValue)) {
					throw new Error(`The value of the property "${name}" must be an array of SGModel (SGModelView) based instances! ${this.getDebugInfo()}`);
				}
				if (previous !== nextValue) {
					if (Array.isArray(previous)) {
						if ((flags & SGModel.FLAGS.NO_DESTROY_INSTANCE_MODEL) === 0) {
							previous.forEach(prevItem => ((prevItem instanceof SGModel) && !nextValue.includes(prevItem) && prevItem.destroy(flags)));
						}
						if (previous.length === nextValue.length) {
							for (let i = 0; i < previous.length; i++) {
								if (previous[i] !== nextValue[i]) {
									result.changed = true;
									break;
								}
							}
						} else {
							result.changed = true;
						}
						if (result.changed) {
							previous.length = 0;
							previous.push(...nextValue);
						}
					} else {
						result.changed = true;
					}
					nextValue = previous;
				}
				break;
			}
			case SGModel.TYPES.FUNCTION: {
				if (typeof nextValue !== 'function') nextValue = null;
				break;
			}
			default: {
				throw new Error(`Unknown type specified for property "${name}"! ${this.getDebugInfo()}`);
			}
		}
		result.value = nextValue;
		if (!defType.type.isComplex) {
			result.changed = (nextValue !== previous);
		}
		return result;
	}
	
	/**
	* Задать значение свойству
	* @param {string}	name
	* @param {mixed}	[valueOrCollection] - Если не задан (т.е. передан undefined), то свойство и его подписчики удаляются
	* @param {object}	[options]
	* @param {mixed}		[options.previous_value] - Использовать это значение в качестве предыдущего значения в колбэках подписчиков
	* @param {function}	[options.format] - Функция для обработки элемента коллекции (item, index)=>{return...}. Например, можно элемент в виде массива ['http://test.ru', 'Title...'] превратить в объект { url: 'http://test.ru', title: 'Title...' }
	* @param {number}	[flags] - Возможные флаги:
	*			`FLAGS.OFF_MAY_BE`
	*			`FLAGS.PREV_VALUE_CLONE`
	*			`FLAGS.NO_CALLBACKS`
	*			`FLAGS.FORCE_CALLBACKS`
	*			`FLAGS.NO_DESTROY_INSTANCE_MODEL'
	* @param {Event}	[event] - может передаваться в SGModelView-инстансах
	* @param {DOMElement} [elem] - может передаваться в SGModelView-инстансах
	* @return {boolean|Promise} Если значение было изменено, будет возвращено `true` или Promise при `static autoSave = true`
	*/
	set(name, valueOrCollection = void 0, options = Utils.OBJECT_EMPTY, flags = 0, event = void 0, elem = void 0) { // eslint-disable-line no-unused-vars
		if (!this.constructor.allowUndeclaredProperties && !Object.hasOwn(this.defaults, name)) {
			throw new Error(`Properties "${name}" doesn't exists! May not be registered in defaults or constructor, or set allowUndeclaredProperties = true! ${this.getDebugInfo()}`);
		}
		let previous = this.#data[name], value, changed;
		if (valueOrCollection === void 0) {
			this.#off(name);
			changed = (previous !== void 0);
			if ((flags & SGModel.FLAGS.NO_DESTROY_INSTANCE_MODEL) === 0) {
				if (this.defaults[name]?.type === SGModel.TYPES.MODEL && previous instanceof SGModel) {
					previous.destroy(flags);
				} else if (Array.isArray(previous) && this.defaults[name]?.type === SGModel.TYPES.ARRAY_MODEL) {
					for (const item of previous) {
						if (item instanceof SGModel) item.destroy(flags);
					}
				}
			}
			delete this.#data[name];
		} else {
			({ value, previous, changed } = this.validateProperty(name, valueOrCollection, previous, options, flags));
		}
		if (changed) {
			this.#data[name] = value;
		}
		changed = this.#changedAndCallbacks(changed, name, value, previous, options, flags);
		if (changed) {
			if (this.initialized !== true) {
				this.deferredProperties.add(name);
			}
		}
		return changed;
	}

	/**
	 * Добавить элемент/свойство в коллекцию - один из методов для работы с массивами, объектами и коллекциями Map/Set
	 * @param {string} name
	 * @param {mixed} value
	 * @param {mixed} [key] Указывается для коллекций объектов и множеств Map
	 * @param {object} [options]
	 * @param {function}	[options.format] - Функция для обработки элемента коллекции (item, index)=>{return...}. Например, можно элемент в виде массива ['http://test.ru', 'Title...'] превратить в объект { url: 'http://test.ru', title: 'Title...' }
	 * @param {number} [flags]
	 * @returns {boolean|Promise} true, если данные в свойстве изменились (например, для коллекции-Set добавление уже существующего значения в коллекции метод вернёт false). Вернёт Promise при autoSave=true
	 */
	addTo(name, value, key = void 0, options = Utils.OBJECT_EMPTY, flags = 0) {
		let collection = this.#data[name];
		let changed = false;
		switch (this.defaults[name]?.type) {
			case SGModel.TYPES.ARRAY: {
				value = (typeof options.format === 'function') && options.format(value, collection.length) || value;
				collection.push(value);
				changed = true;
				break;
			}
			case SGModel.TYPES.ARRAY_NUMBERS: {
				value = (typeof options.format === 'function') && options.format(value, collection.length) || value;
				collection.push(Number(value));
				changed = true;
				break;
			}
			case SGModel.TYPES.OBJECT: {
				if (collection === null) this.#data[name] = collection = SGModel.TYPES.OBJECT();
				if (collection[key] !== value) {
					collection[key] = (typeof options.format === 'function') && options.format(value, key) || value;
					changed = true;
				}
				break;
			}
			case SGModel.TYPES.SET: {
				if (!collection.has(value)) {
					collection.add((typeof options.format === 'function') && options.format(value, collection.size) || value);
					changed = true;
				}
				break;
			}
			case SGModel.TYPES.MAP: {
				if (!collection.has(key) || collection.get(key) !== value) {
					collection.set(key, (typeof options.format === 'function') && options.format(value, key) || value);
					changed = true;
				}
				break;
			}
			case SGModel.TYPES.ARRAY_MODEL: {
				if (options.format) {
					throw new Error(`For the property with name "${name}" and type "TYPES.ARRAY_MODEL" does not have an options.format parameter! ${this.getDebugInfo()}`);
				}
				collection.push(value);
				changed = true;
				break;
			}
			default: throw new Error(`The property with name "${name}" has a simple data type! ${this.getDebugInfo()}`);
		}
		changed = this.#changedAndCallbacks(changed, name, collection, null, options, flags);
		if (changed) {
			if (this.initialized !== true) {
				this.deferredProperties.add(name);
			}
		}
		return changed;
	}

	/**
	 * Удалить элемент/свойство из коллекции - один из методов для работы с массивами, объектами и коллекциями Map/Set
	 * @param {string} name
	 * @param {string} key - Для Array - это индекс элемента, для объектов - это имя свойства, для Map - это имя ключа, для Set - это значение
	 * @returns {boolean|Promise} true, если данные в свойстве изменились. Вернёт Promise при autoSave=true
	 */
	removeFrom(name, key, options = void 0, flags = 0) {
		const type = this.defaults[name]?.type;
		const collection = this.#data[name];
		if (collection === void 0) {
			return false;
		}
		let changed = false;
		switch (type) {
			case SGModel.TYPES.ARRAY: case SGModel.TYPES.ARRAY_MODEL: case SGModel.TYPES.ARRAY_NUMBERS: {
				if (collection.length) {
					let deletedElements;
					if (typeof key === 'number') { // Значит keyName = 'index'
						deletedElements = collection.splice(key, 1); // collection как объект останется тем же!
						if (deletedElements.length) {
							changed = true;
						}
					} else {
						const firstElement = collection[0];
						if (Utils.isObject(firstElement)) { // элементы коллекции - объекты
							if (typeof key === 'bigint') { // Значит keyName = 'id'
								if (!firstElement.id) {
									throw new Error(`For key with type BigInt, if the collection elements are objects, then they must store the property key - id! Property name (collection): "${name}". ${this.getDebugInfo()}`);
								}
								const index = collection.findIndex((item) => {
									return (BigInt(item.id) === key);
								});
								if (index >= 0) {
									deletedElements = collection.splice(index, 1);
									changed = true;
								}
							} else if (typeof key === 'string') { // keyName = 'uuid' или keyName = 'code' или keyName = 'hash'
								if (!firstElement.uuid && !firstElement.code && !firstElement.hash) {
									throw new Error(`For key with type String, if the collection elements are objects, then they must store the property key - uuid or code or hash! Property name (collection): "${name}". ${this.getDebugInfo()}`);
								}
								const index = collection.findIndex((item) => {
									return ((item.uuid === key) || (item.code === key) || (item.hash === key));
								});
								if (index >= 0) {
									deletedElements = collection.splice(index, 1);
									changed = true;
								}
							} else {
								throw new Error(`key has an unsupported data type! Property name (collection): "${name}". ${this.getDebugInfo()}`);
							}
						} else {
							throw new Error(`key is not a Number, but the collection contains primitive elements! Property name (collection): "${name}". ${this.getDebugInfo()}`);
						}
					}
					if (type === SGModel.TYPES.ARRAY_MODEL && Array.isArray(deletedElements) && (flags & SGModel.FLAGS.NO_DESTROY_INSTANCE_MODEL) === 0) {
						while (deletedElements.length > 0) {
							deletedElements.pop()?.destroy?.(flags);
						}
					}
				}
				break;
			}
			case SGModel.TYPES.OBJECT: {
				if (collection !== null && Object.hasOwn(collection, key)) {
					delete collection[key];
					changed = true;
				}
				break;
			}
			case SGModel.TYPES.SET: case SGModel.TYPES.MAP: {
				if (collection.has(key)) {
					collection.delete(key);
					changed = true;
				}
				break;
			}
			default: {
				throw new Error(`The property with name "${name}" has a simple data type! ${this.getDebugInfo()}`);
			}
		}
		changed = this.#changedAndCallbacks(changed, name, collection, null, options, flags);
		if (changed) {
			if (this.initialized !== true) {
				this.deferredProperties.add(name);
			}
		}
		return changed;
	}

	/**
	 * Перебор всех элементов в коллекции
	 * @param {string} name
	 * @param {function} callback (item, indexOrKey) => {...}
	 */
	forEach(name, callback) {
		const collection = this.#data[name];
		switch (this.defaults[name]?.type) {
			case SGModel.TYPES.ARRAY: case SGModel.TYPES.ARRAY_MODEL: case SGModel.TYPES.ARRAY_NUMBERS: {
				for (let index = 0; index < collection.length; index++) {
					callback(collection[index], index);
				}
				break;
			}
			case SGModel.TYPES.OBJECT: {
				if (collection === null) break;
				for (const key in collection) {
					callback(collection[key], key);
				}
				break;
			}
			case SGModel.TYPES.SET: {
				for (const key in collection) {
					callback(collection[key], key);
				}
				break;
			}
			case SGModel.TYPES.MAP: {
				for (const [key, value] of collection) {
					callback(value, key);
				}
				break;
			}
			default: {
				throw new Error(`Unknown type for property "${name}"! ${this.getDebugInfo()}`);
			}
		}
	}

	/**
	 * Очистить свойство - метод работает также со сложными типами данных - с массивами, объектами и коллекциями Map/Set
	 * @param {string} name
	 * @returns {boolean|Promise} true, если данные в свойстве изменились.
	 */
	clearProperty(name, options = Utils.OBJECT_EMPTY, flags = 0) {
		const typeDefault = this.defaults[name]?.type;
		if (typeDefault) {
			const defaultValue = this.defaults[name]?.type?.();
			return this.set(name, defaultValue, options, flags);
		}
		throw new Error(`Unknown type for property "${name}"! ${this.getDebugInfo()}`);
	}

	/**
	 * Получить размер - один из методов для работы с массивами, объектами и коллекциями Map/Set
	 * @param {string} name 
	 * @returns {number}
	 */
	size(name) {
		const collection = this.#data[name];
		if (collection === void 0) {
			return 0;
		}
		switch (this.defaults[name]?.type) {
			case SGModel.TYPES.ARRAY: case SGModel.TYPES.ARRAY_MODEL: case SGModel.TYPES.ARRAY_NUMBERS: return collection.length;
			case SGModel.TYPES.OBJECT: return collection === null ? 0 : Object.keys(collection).length;
			case SGModel.TYPES.SET: case SGModel.TYPES.MAP: return collection.size;
		}
		throw new Error(`The property with name "${name}" has a simple data type! ${this.getDebugInfo()}`);
	}
	
	/**
	 * Получить значение свойства. Если свойство с таким именем не существует, то ошибка не будет выброшена
	 * @param {string} name
	 * @returns {mixed}
	 */
	get(name) {
		return this.#data[name];
	}

	/** @private */
	#on(name, func, context = void 0, data = void 0, flags = 0) {
		let callbacks = this.#onChangeCallbacks[name];
		if (!callbacks) callbacks = this.#onChangeCallbacks[name] = [];
		callbacks.push({f: func, c: context, d: data});
		if (flags & SGModel.FLAGS.IMMEDIATELY) {
			func.call(context ? context : this, data ? data : this.#data[name], this.#data[name], name);
		}
	}

	/**
	 * Задать колбэк на изменение свойства
	 * @param {string|array} name
	 * @param {function} func
	 * @param {object} [context] If not specified, the **this** of the current object is passed
	 * @param {mixed} [data]	If **data** is set, then this value (data) is passed instead of the current value of the property
	 * @param {number} [flags=0] Valid flags:
	 *		**SGModel.FLAGS.IMMEDIATELY** - **func** will be executed once now
	 */
	on(name, func, context = void 0, data = void 0, flags = 0) {
		let deferredDetected = false;
		if (Array.isArray(name)) {
			for (let i = 0; i < name.length; i++) {
				if (!deferredDetected && this.deferredProperties.has(name[i])) {
					flags = flags | SGModel.FLAGS.IMMEDIATELY;
					deferredDetected = true;
				}
				this.#on.call(this,
					name[i],
					func,
					Array.isArray(context) ? context[i] : context,
					Array.isArray(data) ? data[i] : data,
					flags
				);
			}
		} else {
			if (this.deferredProperties.has(name)) {
				flags = flags | SGModel.FLAGS.IMMEDIATELY;
			}
			this.#on.call(this, name, func, context, data, flags);
		}
	}
	
	/**
	 * Задать единый колбэк на изменение любого свойства
	 * @param {function} func
	 * @param {number} [flags=0] Допустимые флаги:
	 *		**SGModel.FLAGS.IMMEDIATELY** - колбэк будет выполнен в первый раз сразу же здесь
	 */
	setOnAllCallback(func, flags = 0) {
		this.onAllCallback = func;
		if (flags & SGModel.FLAGS.IMMEDIATELY) {
			this.onAllCallback();
		}
	}

	#off(name, func) {
		const callbacks = this.#onChangeCallbacks[name];
		if (callbacks) {
			if (func) {
				for (let i = 0; i < callbacks.length; i++) {
					if (callbacks[i].f === func) {
						callbacks.splice(i, 1);
						i--;
					}
				}
			} else {
				callbacks.length = 0;
			}
		}
	}

	/**
	 * Удаляет колбэк на изменение свойства
	 * @param {string|array} name
	 * @param {function} func
	 */
	off(name, func) {
		if (name) {
			if (Array.isArray(name)) {
				for (let i = 0; i < name.length; i++) {
					this.#off.call(this, name[i], func);
				}
			} else {
				this.#off.apply(this, arguments);
			}
		} else {
			for (const f in this.#onChangeCallbacks) {
				this.#onChangeCallbacks[f].length = 0;
			}
		}
	}

	/**
	 * Проверяет, есть ли свойство 
	 * @param {string} name
	 */
	has(name) {
		return Object.hasOwn(this.#data, name);
	}
	
	/**
	 * Вызвать колбэки подписчиков, которые выполняются при изменении значения свойства
	 * @param {string} name
	 * @param {mixed} [value]
	 * @param {number} [flags] Допустимые флаги:
	 *		**SGModel.FLAGS.OFF_MAY_BE** - если в процессе выполнения колбэков может быть выполнена отписка (`.off()`), нужно передать этот флаг.
	 */
	trigger(name, value = void 0, flags = 0) {
		if (!this.constructor.allowUndeclaredProperties && !Object.hasOwn(this.defaults, name)) {
			throw new Error(`Properties "${name}" doesn't exists! May not be registered in defaults or constructor! ${this.getDebugInfo()}`);
		}
		let callbacks = this.#onChangeCallbacks[name];
		if (callbacks) {
			if (flags & SGModel.FLAGS.OFF_MAY_BE) {
				callbacks = Utils.clone(callbacks);
			}
			for (const i in callbacks) {
				const cb = callbacks[i];
				if (cb.d !== void 0 || value !== void 0) {
					cb.f.call( cb.c ? cb.c : this, cb.d !== void 0 ? cb.d : value, this.#data[name], this.#data[name], name );
				} else {
					cb.f.call( cb.c ? cb.c : this, this.#data[name], this.#data[name], name );
				}
			}
		}
	}

	/**
	 * Очистить все свойства, задав значения по умолчанию
	 */
	clearToDefaults() {
		for (const name in this.data) {
			if (Object.hasOwn(this.defaults, name)) {
				this.data[name] = Utils.clone(this.defaults[name].value);
			} else {
				throw new Error(`Default value not found for property "${name}"`);
			}
		}
	}

	/**
	 * Очистить все свойства
	 * @param {object} [options]
	 * @param {number} [flags=0]
	 * @param {function} [_callback] - колбэк для внутреннего использования движком
	 * @returns {boolean|Promise} Если изменилось хотя бы одно свойство, то вернёт true или Promise в зависимости от того синхронизируются ли данные с каким-нибудь хранилищем
	 */
	clear(options = void 0, flags = 0, _callback = void 0) {
		let changed = false;
		for (const name in this.defaults) {
			const result = this.clearProperty(name, options, flags);
			if (_callback) {
				if (result === true) {
					_callback(name);
				} else if (Utils.isPromise(result)) {
					result.then((status) => (status === true && _callback(name)));
				}
			}
			if (!changed) {
				if (Utils.isPromise(result)) {
					changed = result; // TODO: асинхронное хранилище
				} else if (result === true) {
					changed = true;
				}
			}
		}
		return changed;
	}
	
	/**
	 * Сохранить данные инстанса в постоянном хранилище.
	 * @overridden Вы можете переопределить этот метод и сохранить, например, в удаленную базу данных, сделав асинхронные запросы к серверу
	 * @returns {Promise}
	 */
	async save() {
		if (!this.constructor.localStorageKey) {
			throw new Error(`The static property "localStorageKey" is not set! ${this.getDebugInfo()}`);
		}
		const dest = this.getData();
		localStorage.setItem(
			`${this.constructor.localStorageKey}${this.constructor.singleInstance ? '' : `:${this.uuid}`}`,
			JSON.stringify(dest)
		);
		return true;
	}

	/**
	 * Получить ключевую информацию об инстансе при выбросе исключений
	 * @returns {string}
	 */
	getDebugInfo() {
		let keyValue;
		for (const key of SGModel.standardKeys) {
			if (key === 'uuid') continue;
			const value = this.get(key);
			if (value) {
				keyValue = { key, value };
				break;
			}
		}
		return `Instance of ${this.constructor.name} with UUID "${this.uuid}" [${keyValue?`${keyValue.key}=${keyValue.value}, `:''}__uid=${this.__uid}]`;
	}
	
	/**
	 * Удалить инстанс. Учитывает вложенные инстансы в свойствах.
	 * Выполняет destroy() для всех вложенных инстансов, не проверяя их нахождение в родительских инстансах (TODO?)
	 */
	destroy(flags = 0) {
		if (this.destroyed) {
			return;
		}
		this.destroyed = true;
		this.off();
		delete SGModel.__instancesByClass[this.constructor.name][this.uuid];
		delete SGModel.__instances[this.uuid];
		if (this.constructor.singleInstance) {
			this.constructor.__instance = null;
		}
		if ((flags & SGModel.FLAGS.NO_DESTROY_INSTANCE_MODEL) === 0) {
			for (let name in this.#data) {
				const type = this.defaults[name]?.type;
				if (type === SGModel.TYPES.ARRAY_MODEL || type === SGModel.TYPES.MODEL) {
					this.clearProperty(name);
				}
			}
		}
	}
	
	/**
	 * Проверяет базируется ли класс или объект на SGModel
	 * @param {object|function} source
	 * @param {number} [flags]
	 * @returns 
	 */
	static isBasedOnModel(source, flags = SGModel.FLAGS.INCLUDING_INSTANCE) {
		if ((flags & SGModel.FLAGS.INCLUDING_INSTANCE) && source instanceof SGModel) return true;
		while (source) {
			if (source === SGModel) return true;
			source = Object.getPrototypeOf(source);
		}
		return false;
	}

	/**
	 * Получить json-представление данных (например, для сохранения в постоянное хранилище)
	 * @param {number} [flags] - Флаги, см. в классе `SGJson`
	 * @param {WeakSet} [_seen] - Для внутреннего использования (отслеживание циклических ссылок)
	 * @returns {object}
	 */
	getData(flags = 0, _seen = new WeakSet()) {
		return SGJson.getData(this, flags, _seen);
	}

	/**
	 * Подготовить объект на основе инстанса для преобразования в текстовое json-представление
	 * @param {number} [flags] - Флаги, см. в классе `SGJson`
	 * @param {WeakSet} [_seen] - Для внутреннего использования (отслеживание циклических ссылок)
	 * @returns {string}
	 */
	toJSON(flags = void 0, _seen = new WeakSet()) {
		return SGJson.toJSON(this, flags, _seen);
	}
	
	/**
	 * Возвращает экземпляр синглтона. По умолчанию создает его при необходимости
	 * @public
	 * @param {boolean} [createIfMissing=true] Если true, создается экземпляр, если он не существует
	 *                                         Если false, вместо создания выбрасывается ошибка
	 * @throws {Error} Если синглтон настроен неправильно (когда `singleInstance` имеет значение false)
	 * @returns {object}
	 */
	static getInstance(createIfMissing = true) {
		if (!this.singleInstance) {
			throw new Error('Singleton not configured (singleInstance = false)!');
		}
		if (!this.__instance && !createIfMissing) {
			throw new Error('Singleton instance does not exist and creation is disabled!');
		}
		return this.__instance ?? (this.__instance = new this());
	};

	static #nextUID() {
		return ++SGModel.#uid;
	}
}

if (typeof globalThis === 'object' && globalThis !== null) globalThis.SGModel = SGModel;
else if (Utils.isNode && typeof module === 'object') module.exports = SGModel; // eslint-disable-line no-undef
else if (Utils.isBrowser) window['SGModel'] = SGModel;

export default SGModel;

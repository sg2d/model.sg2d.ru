"use strict";

/**
 * SGModel - Библиотека-класс для структурирования веб-приложений с помощью биндинг-моделей. Это упрощенный аналог Backbone.js! Библиотека хорошо адаптирована для наследования классов. Может использоваться как в браузере, так и на Node.js.
 * @english A library class for structuring web applications using binding models. This is a simplified version of Backbone.js! The library is well adapted for inheritance classes. Can be used both in the browser and on Node.js.
 * @version 1.0.10
 * @requires ES2024+ (ES15+)
 * @link https://github.com/sg2d/model.sg2d.ru
 * @license SGModel may be freely distributed under the MIT license
 * @copyright 2019-2025 © Калашников Илья (https://model.sg2d.ru)
 */
class SGModel {

	/**
	 * Library version (fixed in minified version)
 	 * @readonly
	 */
	static version = typeof __SGMODEL_VERSION__ !== 'undefined' ? __SGMODEL_VERSION__ : '1.0.10';

	/**
	 * @readonly
	 */
	static isNode = ((typeof process === 'object' && process !== null) && (process.versions instanceof Object) && process.versions.node !== undefined);

	/**
	 * @readonly
	 */
	static isBrowser = (typeof window === 'object' && window !== null && window.document !== undefined);
	
	/**
	 * SGModel types
	 * @constant
	 */
	static TYPES = [
		'ANY:mixed',
		'NUMBER:simple',
		//'INTEGER:simple', // @announcement v1.1+
		//'DECIMAL:simple', // @announcement v1.1+
		//'DECIMAL_PRECISION_1:simple', // @announcement v1.1+
		//'DECIMAL_PRECISION_2:simple', // @announcement v1.1+
		//'DECIMAL_PRECISION_3:simple', // @announcement v1.1+
		//'DECIMAL_PRECISION_4:simple', // @announcement v1.1+
		'STRING:simple',
		'BOOLEAN:simple',
		'FUNCTION:simple',
		'XY:complex', // координата
		'OBJECT:complex',
		'ARRAY:complex',
		'ARRAY_NUMBERS:complex', // @deprecated make? TODO
		'OBJECT_NUMBERS:complex', // @deprecated make? TODO
		'SET:complex', // коллекции new Set()
		'MAP:complex', // коллекции new Map()
		//'DATASET:complex', // @announcement v1.1+
	];
	static TYPES_COMPLEX = {};

	/**
	 * Enable singleton pattern for model
	 */
	static singleInstance = false;

	/**
	 * @private
	 */
	static __instance = null;

	/** @protected */
	static __instances = {};

	/** @protected */
	static __instancesByClass = {};

	/** Properties default values */
	static defaultProperties = {}; // override

	/** Property data types */
	static typeProperties = {}; // override

	/**
	 * If a non-empty string value is specified, then the data is synchronized with the local storage.
	 * Support for storing data as one instance of a class (single instance), and several instances: **localStorageKey + '_' + id**
	 */
	static localStorageKey = ''; // override

	/**
	 * Allow implicit property declaration (the type of these properties is determined automatically based on how these properties are applied in the view)
	 * @announcement v1.1+
	 */
	//static allowUndeclaredProperties = false; // override

	/**
	 * Аutomatically detected properties (to allow implicit declaration of properties, the static property allowUndeclaredProperty must be set to true)
	 * @announcement v1.1+
	 * @protected
	 */
	//static __autoDetectedProperties = {};

	/**
	 * Значение сквозного счётчка текущего экземпляра класса унаследованного от SGModel
	 * @protected
	 */
	__uid = 0;

	/**
	 * Инкриминирующее значение счётчика
	 * @private
	 */
	static #uid = 0;

	/**
	 * Главный объект экземпляров SGModel (свойства экземпляра).
	 * Для доступа используйте Proxy-объект this.data или методы get(), set(), addTo(), removeFrom(), clearProperty()
	 * @private
	 */
	#data = null;

	/**
	 * Proxy-объект для #data
	 * @public
	 */
	data = null;

	/**
	 * Данные singleton-экземляра (по умолчанию не задано)
	 */
	//static data;

	/**
	 * Объект и методы промиса, отвечающие за инициализацию (результат this.initialize())
	 * @public
	 */
	initialization = Promise.withResolvers();

	/**
	 * Это this.initialization.promise
	 * @public
	 */
	initialized = (this.initialization.promise._sg_instance = this, this.initialization.promise);

	/**
	 * reset manually!
	 * @public
	 */
	changed = false;

	/**
	 * Если true, значит экземпляр прошёл процедуру уничтожения destroy()
	 */
	destroyed = false;

	static #nextUID() {
		return ++SGModel.#uid;
	}

	/**
	 * @private
	 */
	#onChangeCallbacks = {};

	static #vcResult = { // @aos (for acceleration and optimization, but synchronously)
		value: null,
		previous: null,
		changed: false,
		isComplexType: false,
	};

	/** @private */
	#on(name, func, context = void 0, data = void 0, flags = 0) {
		let callbacks = this.#onChangeCallbacks[name];
		if (!callbacks) callbacks = this.#onChangeCallbacks[name] = [];
		callbacks.push({f: func, c: context, d: data});
		if (flags & SGModel.FLAG_IMMEDIATELY) {
			func.call(context ? context : this, data ? data : this.#data[name], this.#data[name], name);
		}
	}
	
	/** @private */
	#off(name, func) {
		const callbacks = this.#onChangeCallbacks[name];
		if (callbacks) {
			if (func) {
				for (var i = 0; i < callbacks.length; i++) {
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
	 * @private
	 * @param {boolean} changed 
	 * @returns {boolean|Promise} 
	 */
	#changedAndCallbacks(changed, name, valueOrCollection, previous, options = SGModel.OBJECT_EMPTY, flags = 0) {
		if (changed) {
			this.changed = true;
		}
		if (changed || (flags & SGModel.FLAG_FORCE_CALLBACKS)) {
			if ((flags & SGModel.FLAG_NO_CALLBACKS) === 0) {
				const callbacks = this.#onChangeCallbacks[name];
				if (callbacks) {
					previous = (options.previous_value !== void 0 ? options.previous_value : previous);
					if (flags & SGModel.FLAG_OFF_MAY_BE) {
						callbacks = SGModel.clone(callbacks);
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
	 * SGModel constructor
	 * @param {object} [properties={}] Properties
	 * @param {object} [clonedOptions] Custom settings
	 * @param {object} [thisProperties] Properties and methods passed to the **this** context of the created instance
	 */
	constructor(properties = {}, clonedOptions = void 0, thisProperties = void 0) {
		const self = this;
		if (typeof thisProperties === 'object' && thisProperties !== null) {
			Object.assign(this, thisProperties); // add internal properties to the object, accessible through this.*
		}
		if (this.constructor.singleInstance) {
			if (this.constructor.__instance) {
				throw new Error('Error! this.constructor.__instance not is empty!');
			}
			this.constructor.__instance = this;
		} else {
			this.constructor.multipleInstances = true;
		}
		if (typeof properties !== 'object' || properties === null) {
			throw new Error('Error! properties must be object!');
		}
		if (!Object.hasOwn(this.constructor, 'defaultProperties')) {
			this.constructor.defaultProperties = {};
		}
		if (!Object.hasOwn(this.constructor, 'typeProperties')) {
			this.constructor.typeProperties = {};
		}

		let defaults = this.defaults();

		this.uuid = this.uuid || defaults.uuid || properties.uuid || crypto.randomUUID && crypto.randomUUID() // must be https protocol to support the function crypto.randomUUID()
			|| '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c => (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16));
		delete defaults.uuid;
		delete properties.uuid;

		this.__uid = SGModel.#nextUID();

		SGModel.__instances[this.uuid] = this;
		(SGModel.__instancesByClass[this.constructor.name] = SGModel.__instancesByClass[this.constructor.name] || {})[this.uuid] = this;
		
		// Check static options
		if (typeof this.constructor.options === 'object' && this.constructor.options !== null) {
			this.options = SGModel.clone(this.constructor.options);
		} else {
			this.options = {};
		}
		
		if (typeof clonedOptions === 'object' && clonedOptions !== null) {
			Object.assign(this.options, SGModel.clone(clonedOptions));
		}
		
		// override defaults by localStorage data
		if (this.constructor.localStorageKey) {
			const data = JSON.parse(localStorage.getItem(this.constructor.localStorageKey + (this.constructor.singleInstance ? '' : ':' + this.uuid)));
			if (typeof data === 'object' && data !== null) {
				SGModel.initObjectByObject(defaults, data);
			}
		}
		
		if (Object.keys(properties).length) {
			properties = SGModel.clone(properties);
		}

		for (const propName in defaults) {
			this.constructor.typeProperties[propName] = this.constructor.typeProperties[propName] || this.getType(defaults[propName]);
			if (!Object.hasOwn(properties, propName)) {
				properties[propName] = defaults[propName];
			}
		}

		for (const propName in properties) {
			const valueOrCollection = properties[propName];
			if (valueOrCollection === void 0) {
				delete properties[propName];
			} else {
				const { value } = this.validateProperty(
					propName,
					valueOrCollection,	// nextValue
					defaults[propName],	// previousValue
					void 0, // options
					0, // flags
				);
				properties[propName] = value;
			}
		}

		this.#data = SGModel.defaults({}, defaults, properties);
		this.data = new Proxy(this.#data, {
			get(properties, prop, receiver) {
				if (prop in properties) {
					return properties[prop];
				}
				throw new Error(`Error! Properties "${prop}" doen't exists! (may not be registered in defaultProperties)`);
			},
			set(properties, prop, value, receiver) {
				if (prop in properties) {
					self.set(prop, value);
					return true;
				}
				throw new Error(`Error! Properties "${prop}" doen't exists! (may not be registered in defaultProperties)`);
			},
			deleteProperty(properties, prop) {
				self.#off(prop);
				delete properties[prop];
			},
		});

		if (this.constructor.singleInstance) {
			this.constructor.data = this.data;
		}
		
		// Дёргаем initialize() экземпляра после выполнения конструктора, что бы инициализировались приватные свойства! См. также #deferredProperties в SGModelView.
		setTimeout(() => {
			//this.initialized = this.initialize.apply(this, arguments);
			this.initialize.apply(this, arguments);
		}, 0);
	}
	
	/**
	 * Called when an instance is created. Override in your classes
	 * @return {Promise}
	 */
	async initialize() {
		//return Promise.resolve(true); // stub (you can override this method)
		return this.initialization.resolve(true); // stub (you can override this method)
	}

	/**
	 * Sets the default property values. Overriden
	 * @returns {object}
	 */
	defaults() {
		return SGModel.clone(this.constructor.defaultProperties);
	}

	/**
	 * Принимает имя свойства, новое и предыдущее значения, проверяет/модифицирует значение и возвращает откорректированное значение +признак изменения
	 * @public
	 * @param {string} name
	 * @param {mixed} nextValue
	 * @param {mixed} [previousValue] Для сложных объектов сами объекты сохраняются (не пересоздаются!), но очищаются! Для изменения элементов коллекции используйте методы addTo(), removeFrom() и др.
	 * @param {object} [options=SGModel.OBJECT_EMPTY]
	 * @param {function}	[options.format] - Функция для обработки элемента коллекции (item, index)=>{return...}. Например, можно элемент в виде массива ['http://test.ru', 'Title...'] превратить в объект { url: 'http://test.ru', title: 'Title...' }
	 * @param {number} [flags=0]
	 * @returns {object} SGModel.#vcResult = { value, previous, changed, isComplexType } Для сложных объектов - value - это сама коллекция!
	 */
	validateProperty(name, nextValue, previous = void 0, options = SGModel.OBJECT_EMPTY, flags = 0) {
		if (nextValue === void 0) {
			throw new Error(`Error in this.validateProperty()! The "nextValue" parameter must have a value!`);
		}
		SGModel.#vcResult.changed = false;
		SGModel.#vcResult.isComplexType = false;
		SGModel.#vcResult.value = previous;
		if (flags & SGModel.FLAG_PREV_VALUE_CLONE) {
			SGModel.#vcResult.previous = SGModel.clone(previous);
		} else {
			SGModel.#vcResult.previous = previous;
		}

		const typeProperty = this.constructor.typeProperties[name] || 0;
		switch (typeProperty) {
			case SGModel.TYPE_ANY: case SGModel.TYPE_FUNCTION: break;
			case SGModel.TYPE_NUMBER: nextValue = SGModel.toNumberOrNull(nextValue); break;
			case SGModel.TYPE_STRING: nextValue = SGModel.toStringOrNull(nextValue); break;
			case SGModel.TYPE_BOOLEAN: nextValue = SGModel.toBooleanOrNull(nextValue); break;
			case SGModel.TYPE_XY: {
				if (!(nextValue instanceof Object)) {
					throw new Error(`Error in validateProperty()! Property "${name}" (${this.constructor.name}) must be based on Object (not null, not Object.create(null))!`);
				}
				nextValue.x = SGModel.toNumberOrNull(nextValue.x);
				nextValue.y = SGModel.toNumberOrNull(nextValue.y);
				SGModel.#vcResult.isComplexType = true;
				SGModel.#vcResult.changed = true;
				if (typeof previous === 'object' && previous !== null) {
					if (previous.x === nextValue.x && previous.y === nextValue.y) {
						SGModel.#vcResult.changed = false;
					} else {
						previous.x = nextValue.x;
						previous.y = nextValue.y;
					}
					nextValue = previous;
				}
				break;
			}
			case SGModel.TYPE_ARRAY: case SGModel.TYPE_ARRAY_NUMBERS: {
				if (typeof nextValue === 'string') {
					nextValue = this.parsePgStrArray(nextValue);
				}
				if (!Array.isArray(nextValue)) {
					nextValue = [nextValue];
				}
				if (typeProperty === SGModel.TYPE_ARRAY_NUMBERS) {
					SGModel.toNumbers(nextValue); // TODO precision
				}
				SGModel.#vcResult.isComplexType = true;
				SGModel.#vcResult.changed = true;
				if (nextValue !== previous && (previous instanceof Array)) {
					// TODO: сделать по элементное сравнение (с учётом JSON.stringify элементов-объектов) ?
					previous.length = 0;
					previous.push(...nextValue);
					nextValue = previous;	
				}
				if (typeof options.format === 'function') {
					for (let index = 0; index < nextValue.length; index++) {
						nextValue[index] = options.format(nextValue[index], index);
					}
				}
				break;
			}
			case SGModel.TYPE_OBJECT: case SGModel.TYPE_OBJECT_NUMBERS: {
				if (!(nextValue instanceof Object)) {
					throw new Error(`Error in validateProperty()! Property "${name}" (${this.constructor.name}) must be based on Object (not null, not Object.create(null))!`);
				}
				if (typeProperty === SGModel.TYPE_OBJECT_NUMBERS) {
					SGModel.toNumbers(nextValue); // TODO precision
				}
				SGModel.#vcResult.isComplexType = true;
				SGModel.#vcResult.changed = true;
				if (nextValue !== previous && (previous instanceof Object)) {
					// TODO: сделать по элементное сравнение (с учётом JSON.stringify элементов-объектов) ?
					for (const propName in previous) {
						delete previous[propName];
					}
					Object.assign(previous, nextValue);
					nextValue = previous;	
				}
				if (typeof options.format === 'function') {
					for (let propName in nextValue) {
						nextValue[propName] = options.format(nextValue[propName], propName);
					}
				}
				break;
			}
			case SGModel.TYPE_SET: {
				if (typeof nextValue === 'string') {
					nextValue = this.parsePgStrArray(nextValue);
				}
				if (!Array.isArray(nextValue) && !(nextValue instanceof Set)) {
					throw new Error(`Error in validateProperty()! Property "${name}" (${this.constructor.name}) must be a Set class, Array or string in the format "{value1,value2,...}"!`); // TODO: формат строки м.б. сложнее, например, не просто элементы, а записи, т.е. вложенные {}
				}
				SGModel.#vcResult.isComplexType = true;
				SGModel.#vcResult.changed = true;
				if (nextValue !== previous && (previous instanceof Set)) {
					previous.clear();
					for (const value of nextValue) {
						previous.add(value);
					}
					nextValue = previous;
				} else if (!(nextValue instanceof Set)) {
					nextValue = new Set(nextValue);
				}
				if (typeof options.format === 'function') {
					let index = 0;
					const aTemp = Array.from(nextValue);
					for (const value of aTemp) {
						nextValue.delete(value);
						nextValue.add(options.format(value, index++));
					}
				}
				break;
			}
			case SGModel.TYPE_MAP: {
				if (typeof nextValue === 'string') {
					const arr = this.parsePgStrArray(nextValue);
					nextValue = new Map();
					for (let index = 0; index < arr.length; index++) {
						nextValue.set(index, arr[index]);
					}
				}
				if (!(nextValue instanceof Map)) {
					throw new Error(`Error in validateProperty()! Property "${name}" (${this.constructor.name}) must be based on Object (not null, not Object.create(null))!`);
				}
				SGModel.#vcResult.isComplexType = true;
				SGModel.#vcResult.changed = true;
				if (nextValue !== previous && (previous instanceof Map)) {
					// TODO: сделать по элементное сравнение (с учётом JSON.stringify элементов-объектов) ?
					previous.clear();
					for (const [key, value] of nextValue) {
						previous.set(key, value);
					}
					nextValue = previous;
				}
				if (typeof options.format === 'function') {
					for (const [key, value] of nextValue) {
						nextValue.set(key, options.format(value, key));
					}
				}
				break;
			}
			default: {
				throw new Error(`Error in validateProperty()! Unknown type specified for property "${name}" (${this.constructor.name})!`);
			}
		}
		SGModel.#vcResult.value = nextValue;
		if (!SGModel.#vcResult.isComplexType) {
			SGModel.#vcResult.changed = (nextValue !== previous);
		}
		return SGModel.#vcResult;
	}
	
	/**
	* Set property value
	* @param {string}	name
	* @param {mixed}	valueOrCollection
	* @param {object}	[options=SGModel.OBJECT_EMPTY]
	* @param {mixed}	[options.previous_value] - Use this value as the previous value
	* @param {function}	[options.format] - Функция для обработки элемента коллекции (item, index)=>{return...}. Например, можно элемент в виде массива ['http://test.ru', 'Title...'] превратить в объект { url: 'http://test.ru', title: 'Title...' }
	* @param {number}	[flags=0] - Valid flags: **FLAG_OFF_MAY_BE** | **FLAG_PREV_VALUE_CLONE** | **FLAG_NO_CALLBACKS** | **FLAG_FORCE_CALLBACKS**
	* @param {Event}	[event] - event when using SGModelView
	* @param {DOMElement} [elem] - event source element when using SGModelView
	* @return {boolean|Promise} If the value was changed will return **true** or Promise for option autoSave=true
	*/
	set(name, valueOrCollection, options = SGModel.OBJECT_EMPTY, flags = 0, event = void 0, elem = void 0) {
		var previous = this.#data[name];
		var changed;
		if (valueOrCollection === void 0) {
			delete this.#data[name];
		} else {
			var { value: valueOrCollection, previous, changed } = this.validateProperty(name, valueOrCollection, previous, options, flags);
		}
		if (changed) {
			this.#data[name] = valueOrCollection;
		}
		return this.#changedAndCallbacks(changed, name, valueOrCollection, previous, options, flags);
	}

	/**
	 * Добавить элемент/свойство в коллекцию - один из методов для работы с массивами, объектами и коллекциями Map/Set
	 * @param {string} name
	 * @param {mixed} value
	 * @param {mixed} [key] Указывается для коллекций объектов и множеств Map
	 * @param {object} [options=SGModel.OBJECT_EMPTY]
	 * @param {function}	[options.format] - Функция для обработки элемента коллекции (item, index)=>{return...}. Например, можно элемент в виде массива ['http://test.ru', 'Title...'] превратить в объект { url: 'http://test.ru', title: 'Title...' }
	 * @param {number} [flags=0]
	 * @returns {boolean|Promise} true, если данные в свойстве изменились (например, для коллекции-Set добавление уже существующего значения в коллекции метод вернёт false). Вернёт Promise при autoSave=true
	 */
	addTo(name, value, key = void 0, options = SGModel.OBJECT_EMPTY, flags = 0) {
		const collection = this.#data[name];
		let changed = false;
		switch (this.constructor.typeProperties[name]) {
			case SGModel.TYPE_ARRAY: {
				value = (options.format instanceof Function) && options.format(value, collection.length) || value;
				collection.push(value);
				changed = true;
				break;
			}
			case SGModel.TYPE_ARRAY_NUMBERS: {
				value = (options.format instanceof Function) && options.format(value, collection.length) || value;
				collection.push(Number(value));
				changed = true;
				break;
			}
			case SGModel.TYPE_OBJECT: {
				if (collection[key] !== value) {
					value = (options.format instanceof Function) && options.format(value, key) || value;
					collection[key] = value;
					changed = true;
				}
				break;
			}
			case SGModel.TYPE_OBJECT_NUMBERS: {
				value = Number(value);
				if (collection[key] !== value) {
					value = (options.format instanceof Function) && options.format(value, key) || value;
					collection[key] = value;
					changed = true;
				}
				break;
			}
			case SGModel.TYPE_SET: {
				if (!collection.has(value)) {
					value = (options.format instanceof Function) && options.format(value, collection.size) || value;
					collection.add(value);
					changed = true;
				}
				break;
			}
			case SGModel.TYPE_MAP: {
				if (!collection.has(key) || collection.get(key) !== value) {
					value = (options.format instanceof Function) && options.format(value, key) || value;
					collection.set(key, value);
					changed = true;
				}
				break;
			}
			default: throw new Error(`Error in size() method! The property with name "${name}" (${this.constructor.name}) has a simple data type!`);
		}
		return this.#changedAndCallbacks(changed, name, collection, null, options, flags);
	}

	/**
	 * Удалить элемент/свойство из коллекции - один из методов для работы с массивами, объектами и коллекциями Map/Set
	 * @param {string} name
	 * @param {string} indexOrKeyOrValue - Для Array - это индекс элемента, для объектов - это имя свойства, для Map - это имя ключа, для Set - это значение
	 * @returns {boolean|Promise} true, если данные в свойстве изменились. Вернёт Promise при autoSave=true
	 */
	removeFrom(name, indexOrKeyOrValue, options = void 0, flags = 0) {
		const collection = this.#data[name];
		if (collection === void 0) {
			return false;
		}
		let changed = false;
		switch (this.constructor.typeProperties[name]) {
			case SGModel.TYPE_ARRAY: case SGModel.TYPE_ARRAY_NUMBERS: {
				if (collection.length) {
					if (typeof indexOrKeyOrValue === 'number') { // Значит keyName = 'index'
						const deletedElements = collection.splice(indexOrKeyOrValue, 1); // collection как объект останется тем же!
						if (deletedElements.length) {
							changed = true;
						}
					} else {
						const firstElement = collection[0];
						if (firstElement instanceof Object) { // элементы коллекции - объекты
							if (typeof indexOrKeyOrValue === 'bigint') { // Значит keyName = 'id'
								if (!firstElement.id) {
									throw new Error(`Error in removeFrom() method! For indexOrKeyOrValue with type BigInt, if the collection elements are objects, then they must store the property key - id!`);
								}
								const index = collection.findIndex((item) => {
									return (BigInt(item.id) === indexOrKeyOrValue);
								});
								if (index >= 0) {
									collection.splice(index, 1);
									changed = true;
								}
							} else if (typeof indexOrKeyOrValue === 'string') { // keyName = 'uuid' или keyName = 'code' или keyName = 'hash'
								if (!firstElement.uuid && !firstElement.code && !firstElement.hash) {
									throw new Error(`Error in removeFrom() method! For indexOrKeyOrValue with type String, if the collection elements are objects, then they must store the property key - uuid or code or hash!`);
								}
								const index = collection.findIndex((item) => {
									return ((item.uuid === indexOrKeyOrValue) || (item.code === indexOrKeyOrValue) || (item.hash === indexOrKeyOrValue));
								});
								if (index >= 0) {
									collection.splice(index, 1);
									changed = true;
								}
							} else {
								throw new Error(`Error in removeFrom() method! indexOrKeyOrValue has an unsupported data type!`);
							}
						} else {
							throw new Error(`Error in removeFrom() method! indexOrKeyOrValue is not a Number, but the collection contains primitive elements!`);
						}
					}
				}
				break;
			}
			case SGModel.TYPE_OBJECT: case SGModel.TYPE_OBJECT_NUMBERS: {
				if (Object.hasOwn(collection, indexOrKeyOrValue)) {
					delete collection[indexOrKeyOrValue];
					changed = true;
				}
				break;
			}
			case SGModel.TYPE_SET: case SGModel.TYPE_MAP: {
				if (collection.has(indexOrKeyOrValue)) {
					collection.delete(indexOrKeyOrValue);
					changed = true;
				}
				break;
			}
			default: {
				throw new Error(`Error in removeFrom() method! The property with name "${name}" (${this.constructor.name}) has a simple data type!`);
			}
		}
		return this.#changedAndCallbacks(changed, name, collection, null, options, flags);
	}

	/**
	 * Перебор всех элементов в коллекции
	 * @param {string} name
	 * @param {function} callback (item, indexOrKey) => {...}
	 */
	forEach(name, callback) {
		const collection = this.#data[name];
		switch (this.constructor.typeProperties[name]) {
			case SGModel.TYPE_ARRAY: case SGModel.TYPE_ARRAY_NUMBERS: {
				for (let index = 0; index < collection.length; index++) {
					callback(collection[index], index);
				}
				break;
			}
			case SGModel.TYPE_OBJECT: case SGModel.TYPE_OBJECT_NUMBERS: {
				let index = 0;
				for (const value of collection) {
					callback(value, index++);
				}
				break;
			}
			case SGModel.TYPE_SET: {
				for (const key in collection) {
					callback(collection[key], key);
				}
				break;
			}
			case SGModel.TYPE_SET: {
				for (const [key, value] of collection) {
					callback(value, key);
				}
				break;
			}
			default: {
				throw new Error(`Error in forEach() method! Unknown type for property "${name}"!`);
			}
		}
	}

	/**
	 * Очистить свойство - методов работает также со сложными типами данных - с массивами, объектами и коллекциями Map/Set
	 * @param {string} name
	 * @returns {boolean|Promise} true, если данные в свойстве изменились.
	 */
	clearProperty(name, options = void 0, flags = 0) {
		let changed = false;
		const valueOrCollection = this.#data[name];
		switch (this.constructor.typeProperties[name] || SGModel.TYPE_ANY) {
			case SGModel.TYPE_ANY: changed = (valueOrCollection !== null); this.#data[name] = null; break;
			case SGModel.TYPE_STRING: changed = (valueOrCollection !== ''); if (changed) this.#data[name] = ''; break;
			case SGModel.TYPE_NUMBER: changed = (valueOrCollection !== 0); this.#data[name] = 0; break;
			case SGModel.TYPE_BOOLEAN: changed = (valueOrCollection !== false); this.#data[name] = false; break;
			case SGModel.TYPE_ARRAY: case SGModel.TYPE_ARRAY_NUMBERS: {
				if (Array.isArray(valueOrCollection)) {
					if (valueOrCollection.length !== 0) {
						valueOrCollection.length = 0;
						changed = true;
					}
				} else {
					this.#data[name] = valueOrCollection = [];
					changed = true;
				}
				break;
			}
			case SGModel.TYPE_OBJECT: case SGModel.TYPE_OBJECT_NUMBERS: {
				if (valueOrCollection instanceof Object) {
					for (const p in valueOrCollection) {
						delete valueOrCollection[p];
						changed = true;
					}
				} else {
					this.#data[name] = valueOrCollection = {};
					changed = true;
				}
				break;
			}
			case SGModel.TYPE_SET: {
				if (valueOrCollection instanceof Set) {
					if (valueOrCollection.size) {
						valueOrCollection.clear();
						changed = true;
					}
				} else {
					this.#data[name] = new Set();
					changed = true;
				}
				break;
			}
			case SGModel.TYPE_MAP: {
				if (valueOrCollection instanceof Map) {
					if (valueOrCollection.size) {
						valueOrCollection.clear();
						changed = true;
					}
				} else {
					this.#data[name] = new Map();
					changed = true;
				}
				break;
			}
			case SGModel.TYPE_XY: {
				if (!(valueOrCollection instanceof Object)) {
					valueOrCollection = this.#data[name] = {};
				}
				if (valueOrCollection.x !== 0 || valueOrCollection.y !== 0) {
					valueOrCollection.x = 0;
					valueOrCollection.y = 0;
					changed = true;
				}
				break;
			}
			default: throw new Error(`Error in clearProperty()! Unknown type for property "${name}"!`);
		}
		return this.#changedAndCallbacks(changed, name, valueOrCollection, null, options, flags);
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
		switch (this.constructor.typeProperties[name]) {
			case SGModel.TYPE_ARRAY: case SGModel.TYPE_ARRAY_NUMBERS: return collection.length;
			case SGModel.TYPE_OBJECT: case SGModel.TYPE_OBJECT_NUMBERS: return Object.keys(collection).length;
			case SGModel.TYPE_SET: case SGModel.TYPE_MAP: return collection.size;
		}
		throw new Error(`Error in size() method! The property with name "${name}" (${this.constructor.name}) has a simple data type!`);
	}
	
	/** Get property value */
	get(name) {
		return this.#data[name];
	}

	/**
	 * Получить тип свойства в формате SGModel
	 * @param {mixed} value 
	 * @returns {SGModel.TYPE}
	 */
	getType(value) {
		switch (typeof value) {
			case 'number': return SGModel.TYPE_NUMBER;
			case 'string': return SGModel.TYPE_STRING;
			case 'boolean': return SGModel.TYPE_BOOLEAN;
			case 'function': return SGModel.TYPE_FUNCTION;
			case 'object': {
				if (Array.isArray(value)) return SGModel.TYPE_ARRAY;
				if (value instanceof Set) return SGModel.TYPE_SET;
				if (value instanceof Map) return SGModel.TYPE_MAP;
				if (value instanceof Object) return SGModel.TYPE_OBJECT;
				console.warn('Warning in this.getType()! Object value must be based on Object (not null, not Object.create(null))!');
			}
		}
		return SGModel.TYPE_ANY;
	}

	/**
	 * Set trigger for property change
	 * @param {string|array} name
	 * @param {function} func
	 * @param {object} [context] If not specified, the **this** of the current object is passed
	 * @param {mixed} [data]	If **data** is set, then this value (data) is passed instead of the current value of the property
	 * @param {number} [flags=0] Valid flags:
	 *		**SGModel.FLAG_IMMEDIATELY** - **func** will be executed once now
	 */
	on(name, func, context = void 0, data = void 0, flags = 0) {
		if (Array.isArray(name)) {
			for (let i = 0; i < name.length; i++) {
				this.#on.call(this,
					name[i],
					func,
					Array.isArray(context) ? context[i] : context,
					Array.isArray(data) ? data[i] : data,
					flags
				);
			}
		} else {
			this.#on.apply(this, arguments);
		}
	}
	
	/** Check if there is a property in the model */
	has(name) {
		return Object.hasOwn(this.#data, name);
	}
	
	/**
	 * Set trigger to change any property
	 * @param {function} func
	 * @param {number} [flags=0] Valid flags:
	 *		**SGModel.FLAG_IMMEDIATELY** - **func** will be executed once now
	 */
	setOnAllCallback(func, flags = 0) {
		this.onAllCallback = func;
		if (flags & SGModel.FLAG_IMMEDIATELY) {
			this.onAllCallback();
		}
	}

	/**
	 * Remove trigger on property change
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
	 * Execute callbacks that are executed when the property value changes
	 * @param {string} name
	 * @param {mixed} [value]
	 * @param {number} [flags=0] Valid flags:
	 *		**SGModel.FLAG_OFF_MAY_BE** - if set can be **.off()**, then you need to pass this flag
	 */
	trigger(name, value = void 0, flags = 0) {
		const callbacks = this.#onChangeCallbacks[name];
		if (callbacks) {
			if (flags & SGModel.FLAG_OFF_MAY_BE) {
				callbacks = SGModel.clone(callbacks);
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
	 * Очистить все свойства, задава значения по умолчанию
	 */
	clearToDefaults() {
		for (const propName in this.constructor.defaultProperties) {
			this.data[propName] = this.constructor.defaultProperties[propName];
		}
	}

	/**
	 * Очистить все свойства
	 * @param {object} [options]
	 * @param {number} [flags=0]
	 * @returns {boolean|Promise} Если изменилось хотя бы одно свойство, то вернёт true или Promise в зависимости от того синхронизируются ли данные с каким-нибудь хранилищем
	 */
	clear(options = void 0, flags = 0) {
		let changed = false;
		for (const name in this.constructor.typeProperties) {
			const result = this.clearProperty(name, options, flags);
			if (!changed) {
				if (result instanceof Promise) {
					changed = result;
				} else if (result === true) {
					changed = true;
				}
			}
		}
		return changed;
	}
	
	/**
	 * Save instance data to local storage.
	 * You can override this method and save, for example, to a remote database by making asynchronous requests to the server
	 * @return Promise
	 */
	save() {
		if (!this.constructor.localStorageKey) {
			throw new Error('Error in this.save()! The static property "localStorageKey" is not set!');
		}
		const dest = this.getData();
		localStorage.setItem(this.constructor.localStorageKey + (!this.constructor.singleInstance ? ':' + this.uuid : ''), JSON.stringify(dest));
		return Promise.resolve(true);
	}
	
	/**
	 * Get data for saved
	 * @public
	 * @return {object}
	 */
	getData(bDeleteEmpties = true) { // SGModel.DELETE_EMPTIES=true
		const dest = {};
		if (Array.isArray(this.constructor.storageProperties)) {
			for (let i = 0; i < this.constructor.storageProperties.length; i++) {
				const name = this.constructor.storageProperties[i];
				const value = this.#data[name];
				if (value || value === 0 || value === '' || !bDeleteEmpties) {
					dest[name] = value;
				}
			}
		} else {
			// Discard properties starting with '_'
			for (const name in this.#data) {
				if (name[0] === '_') continue;
				const value = this.#data[name];
				if (value || value === 0 || value === '' || !bDeleteEmpties) {
					dest[name] = value;
				}
			}
		}
		return dest;
	}
	
	/** Destroy the instance */
	destroy() {
		this.off();
		delete SGModel.__instancesByClass[this.constructor.name][this.uuid];
		delete SGModel.__instances[this.uuid];
		this.destroyed = true;
		this.constructor.__instance = null;
	}
	
	/**
	 * Получить массив строк из текстового представления массива в формате PostgreSQL
	 * @param {string} line 
	 * @returns {Array}
	 */
	parsePgStrArray(line) {
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

	/** @public */
	static getOrCreateInstance = function() {
		if (!this.singleInstance) {
			throw new Error('Error in getOrCreateInstance()! static singleInstance is false!');
		}
		if (this.__instance) {
			return this.__instance;
		}
		this.__instance = new this();
		return this.__instance;
	};

	/**
	 * Method **save()** for single instance of a class
	 */
	static save() {
		if (this.__instance) {
			if (this.singleInstance) {
				return this.__instance.save();
			} else {
				throw new Error('Error! The class must be with singleInstance=true!');
			}
		}
		throw new Error('Error! this.__instance is empty!');
	};

}

SGModel.TYPES.forEach((typeDef, index) => {
  const [typeCode, complex] = typeDef.split(':');
  SGModel[`TYPE_${typeCode}`] = index;
  if (complex === 'complex') {
    SGModel.TYPES_COMPLEX[index] = true;
    SGModel.TYPES_COMPLEX[typeCode] = true;
  }
});

/**
 * The flag passed in the **.on(...)** call to execute the callback
 * @constant {boolean}
 */
SGModel.FLAG_IMMEDIATELY = 1;

/** @private */
SGModel.OBJECT_EMPTY = Object.preventExtensions({}); // @aos

SGModel.FLAG_OFF_MAY_BE = 0b00000001; // if set can be .off(), then you need to pass this flag
SGModel.FLAG_PREV_VALUE_CLONE = 0b00000010; // Pass the previous value (heavy clone for objects / arrays)
SGModel.FLAG_NO_CALLBACKS = 0b00000100; // if given, no callbacks are executed
SGModel.FLAG_FORCE_CALLBACKS = 0b00001000; // execute callbacks even if there is no change

SGModel.DELETE_EMPTIES = true;

SGModel.fStub = (v) => v;

/**
 * If **dest** does not have a property from **sources**, then it is copied from **sources** to **dest** (composite objects are copied completely using recursion!)
 * @param {object} dest
 * @param {object} sources 
 */
SGModel.defaults = function(dest, ...sources) {
	for (let i = sources.length; i--; ) {
		const source = sources[i];
		for (const p in source) {
			if (dest[p] === void 0) {
				dest[p] = (typeof source[p] === 'object' ? SGModel.clone(source[p]) : source[p]);
			}
		}
	}
	return dest;
};

/**
 * Full cloning (with nested objects).
 * Attention! There is no check for circular references. You cannot allow nested objects to refer to each other through properties, because recursion is used!
 * @param {object|primitive} source
 * @return {object|primitive}
 */
SGModel.clone = function(source) {
	// Стандартную функцию structuredClone() не используем, т.к. она не поддерживает свойства-функции и не учитывает особенности объектов на основе пользовательских классов
	let dest;
	if (Array.isArray(source)) {
		dest = [];
		for (let i = 0; i < source.length; i++) {
			dest[i] = (
				typeof source[i] === 'object' ?
				SGModel.clone(source[i]) :
				source[i]
			);
		}
	} else if (typeof source === 'object') {
		if (source === null) {
			dest = null;
		} else {
			if (source instanceof Set) {
				dest = new Set();
				for (const value of source) {
					dest.add(SGModel.clone(value));
				}
			} else if (source instanceof Map) {
				dest = new Map();
				for (const [key, value] of source) {
					dest.set(key, SGModel.clone(value));
				}
			} else {
				dest = {};
				for (const p in source) {
					dest[p] = (
						typeof source[p] === 'object' ?
						SGModel.clone(source[p]) :
						source[p]
					);
				}
			}
		}
	} else {
		dest = source; // string, number, boolean, function
	}
	return dest;
};

/**
 * Перезаписать рекурсивно значения всех свойств/элементов объекта/массива **dest** соответствующими значениями свойств/элементов объекта/массива **sources**.
 * @english Fill the values **dest** with the values from **source** (with recursion). If there is no property in **source**, then it is ignored for **dest**
 * @param {object|array} dest
 * @param {object|array} source
 * @returns {dest}
 */
SGModel.initObjectByObject = function(dest, source) {
	if (Array.isArray(dest)) {
		for (let index = 0; index < source.length; index++) {
			if (typeof dest[index] === 'object') {
				this.initObjectByObject(dest[index], source[index]);
			} else {
				dest[index] = source[index];
			}
		}
	} else if (dest instanceof Object) {
		for (const propName in dest) {
			if (source.hasOwnProperty(propName)) {
				if (typeof dest[propName] === 'object') {
					this.initObjectByObject(dest[propName], source[propName]);
				} else {
					dest[propName] = source[propName];
				}
			}
		}
	} else {
		dest = source;
	}
	return dest;
};

/** @public */
SGModel.upperFirstLetter = function(s) {
	return s.charAt(0).toUpperCase() + s.slice(1);
};

SGModel.toNumberOrNull = function(value, precision = void 0) {
	if (value === null || value === '') {
		return null;
	}
	return SGModel.toNumber(value, precision);
};

SGModel.toNumber = function(value, precision = void 0) {
	if (typeof value === 'string') {
		if (/[\d]+\.[\d]+$/.test(value)) {
			value = value.replace(',', '');
		}
		value = value.replace(',', '.').replace(/\s/g, '').replace('−', '-'); // 6,724.33 -> 6724.33
	}
	return precision ? SGModel.roundTo(value, precision) : Number(value);
};

/**
 * Преобразовать элементы коллекции в числа
 * @aos
 * @param {Array|object} collection 
 * @param {number} [precision]
 * @returns {Array|object}
 */
SGModel.toNumbers = function(collection, precision = void 0) {
	var value;
	for (var p in collection) {
		var value = collection[p];
		if (typeof value === 'string') {
			if (/[\d]+\.[\d]+$/.test(value)) {
				value = value.replace(',', '');
			}
			value = value.replace(',', '.').replace(/\s/g, '').replace('−', '-'); // 6,724.33 -> 6724.33
		}
		collection[p] = (precision ? SGModel.roundTo(value, precision) : Number(value));
	}
	return collection;
};

/**
 * Rounding to the required precision
 * @param {Number} value
 * @param {Number} [precision=0]
 * @returns {Number}
 */
SGModel.roundTo = function(value, precision = 0) {
	const m = 10 ** precision;
	return Math.round(Number(value) * m) / m;
};

/** @public */
SGModel.toBooleanOrNull = function(value) {
	if (value === null) {
		return null;
	}
	if (typeof value === 'string') {
		return value === '1' || value.toUpperCase() === 'TRUE' ? true : false;
	}
	return Boolean(value);
};

/** @public */
SGModel.toStringOrNull = function(value) {
	if (value === null) {
		return null;
	}
	return value ? String(value) : '';
};

/** @public */
SGModel.isEmpty = function(value) {
	if (value) {
		return Object.keys(value).length === 0 && value.constructor === Object;
	}
	return true;
};

/**
 * Enable multiple instances
 */
SGModel.multipleInstances = true;

/**
 * Automatic saving to storage when any property is changed
 */
SGModel.autoSave = false;

// TODO: назначение статических методов get, set, addTo и т.д. написать в виде единственного блока кода? Учесть JSDoc!

/**
 * Method **get()** for single instance of a class
 */
SGModel.get = function(...args) {
	return this.__instance && this.__instance.get(...args);
};

/**
 * Method **set()** for single instance of a class
 */
SGModel.set = function(...args) {
	return this.__instance && this.__instance.set(...args);
};

/**
 * Method **addTo()** for single instance of a class
 */
SGModel.addTo = function(...args) {
	return this.__instance && this.__instance.addTo(...args);
};

/**
 * Method **removeFrom()** for single instance of a class
 */
SGModel.removeFrom = function(...args) {
	return this.__instance && this.__instance.removeFrom(...args);
};

/**
 * Method **clearProperty()** for single instance of a class
 */
SGModel.clearProperty = function(...args) {
	return this.__instance && this.__instance.clearProperty(...args);
};

/**
 * Method **size()** for single instance of a class
 */
SGModel.size = function(...args) {
	return this.__instance && this.__instance.size(...args);
};

/**
 * Method on() for single instance of a class
 * @public
 */
SGModel.on = function(...args) {
	return this.__instance && this.__instance.on(...args);
};

/**
 * Method *off()** for single instance of a class
 */
SGModel.off = function(...args) {
	return this.__instance && this.__instance.off(...args);
};

if (typeof globalThis === 'object') globalThis.SGModel = SGModel;

if (SGModel.isNode) {
	module.exports = SGModel;
} else if (SGModel.isBrowser) {
	window['SGModel'] = SGModel;
}

export default SGModel;
"use strict";

/**
 * SGModel - Библиотека-класс для структурирования веб-приложений с помощью биндинг-моделей. Это упрощенный аналог Backbone.js! Библиотека хорошо адаптирована для наследования классов. Может использоваться как в браузере, так и на Node.js.
 * @english A library class for structuring web applications using binding models. This is a simplified version of Backbone.js! The library is well adapted for inheritance classes. Can be used both in the browser and on Node.js.
 * @version 1.1.0
 * @requires ES2024+ (ES15+)
 * @link https://github.com/sg2d/model.sg2d.ru
 * @license SGModel may be freely distributed under the MIT license
 * @copyright 2019-2025 © Калашников Илья (https://model.sg2d.ru)
 */
class SGModel {

	/**
	 * Library version (fixed in minified version)
 	 * @readonly
	 * @type {string}
	 */
	static version = (typeof __SGMODEL_VERSION__ !== 'undefined' ? __SGMODEL_VERSION__ : '1.1.0'); // eslint-disable-line no-undef

	/**
	 * @readonly
	 * @type {boolean}
	 */
	static isNode = ((typeof process === 'object' && process !== null) && (process.versions instanceof Object) && process.versions.node !== undefined);

	/**
	 * @readonly
	 * @type {boolean}
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

	static TYPES_COMPLEX = this.TYPES.reduce((results, typeDef, index) => {
		const [typeCode, complex] = typeDef.split(':');
		this[`TYPE_${typeCode}`] = index;
		if (complex === 'complex') {
			results[index] = true;
			results[typeCode] = true;
		}
		return results;
	}, {});

	/**
	 * Enable singleton pattern for model
	 */
	static singleInstance = false;

	/**
	 * @private
	 * @type {object}
	 */
	static __instance = null;

	/** @protected */
	static __instances = {};

	/** @protected */
	static __instancesByClass = {};

	/**
	 * Формируется для всех классов-потомков от SGModel (SGModelView)
	 * sha256 от String(this.constructor)
	 * @protected
	 * @overridden
	 * @type {string}
	 */
	/*static __hash = '';*/

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
	 * @announcement v1.2?
	 */
	//static allowUndeclaredProperties = true; // override

	/**
	 * Аutomatically detected properties (to allow implicit declaration of properties, the static property allowUndeclaredProperty must be set to true)
	 * @announcement v1.2?
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
	 * @type {Proxy}
	 */
	data = null;

	/**
	 * Данные singleton-экземляра (по умолчанию не задано)
	 * @public
	 * @overridden
	 * @type {Proxy}
	 */
	/*static data;*/

	/**
	 * Объект promise и функции resolve() и reject() промиса, отвечающие за инициализацию
	 * @public
	 * @type {object}
	 */
	initialization = Promise.withResolvers();

	/**
	 * @public
	 * @type {boolean}
	 */
	initialized = (
		//this.initialization.promise.__sg_instance = this, // @debug
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
		if (!this.constructor.__hash) {
			this.constructor.__hash = SGModel.sha256(String(this.constructor));
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

		this.uuid = this.uuid || defaults.uuid || properties.uuid || SGModel.uuidLite();
		delete defaults.uuid;
		delete properties.uuid;

		this.__uid = SGModel.#nextUID();

		if (SGModel.__instances[this.uuid]) {
			throw new Error(`Error in ${this.constructor.name}! uuid "${this.uuid}" already exists!`);
		}
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
			get(properties, prop, receiver) { // eslint-disable-line no-unused-vars
				if (prop in properties) {
					return properties[prop];
				}
				throw new Error(`Error! Properties "${prop}" doen't exists! (may not be registered in defaultProperties)`);
			},
			set(properties, prop, value, receiver) { // eslint-disable-line no-unused-vars
				if (prop in properties) {
					self.set(prop, value);
					return true;
				}
				throw new Error(`Error! Properties "${prop}" doen't exists! (may not be registered in defaultProperties)`);
			},
			deleteProperty(properties, prop) {
				if (prop in properties) {
					self.#off(prop);
					delete properties[prop];
				}
				return true;
			},
		});

		if (this.constructor.singleInstance) {
			this.constructor.data = this.data;
		}
		
		// Дёргаем __initialize() и initialize() экземпляра после выполнения конструктора, что бы инициализировались приватные свойства (для SGModelView актуально)! См. также #deferredProperties в SGModelView.
		setTimeout(async () => {
			this.__initialize(() => {
				const result = this.initialize();
				if (result instanceof Promise) {
					result.then((result) => (this.initialized = (typeof result === 'boolean' ? result : true)));
				} else {
					this.initialized = (typeof result === 'boolean' ? result : true);
				}
			});
		});
	}
	
	/**
	 * Called when an instance is created.
	 * @protected
	 * @overridden Переопределяется в SGModelView
	 * @param {function} callback
	 * @return {Promise}
	 */
	async __initialize(callback) {
		callback();
		return this.initialization.resolve(true);
	}

	/**
	 * Sets the default property values. Can be overridden
	 * @returns {object}
	 */
	defaults() {
		return SGModel.clone(this.constructor.defaultProperties);
	}

	/**
	 * @private
	 */
	#onChangeCallbacks = {};

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
				let callbacks = this.#onChangeCallbacks[name];
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

	static #vcResult = { // @aos (for acceleration and optimization, but synchronously)
		value: null,
		previous: null,
		changed: false,
		isComplexType: false,
	};

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
					nextValue = SGModel.parsePgStrArray(nextValue);
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
					nextValue = SGModel.parsePgStrArray(nextValue);
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
					const arr = SGModel.parsePgStrArray(nextValue);
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
	set(name, valueOrCollection, options = SGModel.OBJECT_EMPTY, flags = 0, event = void 0, elem = void 0) { // eslint-disable-line no-unused-vars
		let previous = this.#data[name], value, changed;
		if (valueOrCollection === void 0) {
			delete this.#data[name];
		} else {
			({ value, previous, changed } = this.validateProperty(name, valueOrCollection, previous, options, flags));
		}
		if (changed) {
			this.#data[name] = value;
		}
		return this.#changedAndCallbacks(changed, name, value, previous, options, flags);
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
			case SGModel.TYPE_MAP: {
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
		let valueOrCollection = this.#data[name];
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
				if (value instanceof Object) {
					if (Object.keys(value).every(k => ['x', 'y'].includes(k)) && Object.keys(value).length === 2) {
						return SGModel.TYPE_XY;
					}
					return SGModel.TYPE_OBJECT;
				}
				return SGModel.TYPE_ANY;
			}
		}
		return SGModel.TYPE_ANY;
	}

	/** @private */
	#on(name, func, context = void 0, data = void 0, flags = 0) {
		let callbacks = this.#onChangeCallbacks[name];
		if (!callbacks) callbacks = this.#onChangeCallbacks[name] = [];
		callbacks.push({f: func, c: context, d: data});
		if (flags & SGModel.FLAG_IMMEDIATELY) {
			func.call(context ? context : this, data ? data : this.#data[name], this.#data[name], name);
		}
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

	/** @private */
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

	/** Check if there is a property in the model */
	has(name) {
		return Object.hasOwn(this.#data, name);
	}
	
	/**
	 * Execute callbacks that are executed when the property value changes
	 * @param {string} name
	 * @param {mixed} [value]
	 * @param {number} [flags=0] Valid flags:
	 *		**SGModel.FLAG_OFF_MAY_BE** - if set can be **.off()**, then you need to pass this flag
	 */
	trigger(name, value = void 0, flags = 0) {
		let callbacks = this.#onChangeCallbacks[name];
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

	/**
	 * Get all data
	 * @returns {object}
	 */
	getAllData() {
		return this.#data;
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
	 * Получить массив строк из текстового представления в формате PostgreSQL массива
	 * @param {string} line
	 * @returns {Array}
	 */
	static parsePgStrArray(line) {
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

	static #toJSONExclude = {
		thisProperties: 'data,initialization'.split(','),
		classProperties: 'data,__instance,__instances,__instancesByClass'.split(','),
	};
	
	/**
	 * Подготовить инстанс для преобразования в текстовое json-представление
	 * @returns {string}
	 */
	toJSON() {
		const cls = this.constructor;
		const result = {
			data: this.getAllData(),
			__class: {
				name: this.constructor.name,
				__hash: this.constructor.__hash,
				__prototype: {
					name: 'SGModel',
					version: SGModel.version,
					isNode: SGModel.isNode,
					isBrowser: SGModel.isBrowser,
				},
			},
		};
		for (let name in this) {
			if (typeof this[name] !== 'function' && !SGModel.#toJSONExclude.thisProperties.includes(name)) {
				result[name] = this[name];
			}
		}
		for (let name in cls) {
			if (typeof cls[name] !== 'function' && !SGModel.#toJSONExclude.classProperties.includes(name)) {
				if (Object.hasOwn(SGModel, name)) continue;
				result.__class[name] = cls[name];
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

	/**
	 * The flag passed in the **.on(...)** call to execute the callback
	 * @constant {boolean}
	 */
	static FLAG_IMMEDIATELY = 1;

	/** @protected */
	static OBJECT_EMPTY = Object.preventExtensions({}); // @aos

	static FLAG_OFF_MAY_BE = 0b00000001; // if set can be .off(), then you need to pass this flag
	static FLAG_PREV_VALUE_CLONE = 0b00000010; // Pass the previous value (heavy clone for objects / arrays)
	static FLAG_NO_CALLBACKS = 0b00000100; // if given, no callbacks are executed
	static FLAG_FORCE_CALLBACKS = 0b00001000; // execute callbacks even if there is no change

	static DELETE_EMPTIES = true;
	
	// Функция-заглушка
	static fStub = (v) => v;

	/**
	 * Сгенерировать uuid
	 * @returns {string}
	 */
	static uuidLite() {
		return crypto.randomUUID && crypto.randomUUID() // must be https protocol to support the function crypto.randomUUID()
		|| '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c => (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16));
	}

	/**
	 * If **dest** does not have a property from **sources**, then it is copied from **sources** to **dest** (composite objects are copied completely using recursion!)
	 * @param {object} dest
	 * @param {object} sources 
	 */
	static defaults = function(dest, ...sources) {
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
	static clone = function(source) {
		// Стандартную функцию structuredClone() не используем, т.к. она не поддерживает свойства-функции и не учитывает особенности объектов на основе пользовательских классов
		let dest;
		if (Array.isArray(source)) {
			dest = [];
			for (let i = 0; i < source.length; i++) {
				dest[i] = (
					typeof source[i] === 'object' ? SGModel.clone(source[i]) : source[i]
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
							typeof source[p] === 'object' ? SGModel.clone(source[p]) : source[p]
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
	static initObjectByObject = function(dest, source) {
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
				if (Object.hasOwn(source, propName)) {
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
	static upperFirstLetter = function(s) {
		return s.charAt(0).toUpperCase() + s.slice(1);
	};

	static toNumberOrNull = function(value, precision = void 0) {
		if (value === null || value === '') {
			return null;
		}
		return SGModel.toNumber(value, precision);
	};

	static toNumber = function(value, precision = void 0) {
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
	static toNumbers = function(collection, precision = void 0) {
		for (const p in collection) {
			let value = collection[p];
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
	static roundTo = function(value, precision = 0) {
		const m = 10 ** precision;
		return Math.round(Number(value) * m) / m;
	};

	/** @public */
	static toBooleanOrNull = function(value) {
		if (value === null) {
			return null;
		}
		if (typeof value === 'string') {
			return value === '1' || value.toUpperCase() === 'TRUE' ? true : false;
		}
		return Boolean(value);
	};

	/** @public */
	static toStringOrNull = function(value) {
		if (value === null) {
			return null;
		}
		return value ? String(value) : '';
	};

	/** @public */
	static isEmpty = function(value) {
		if (value) {
			return Object.keys(value).length === 0 && value.constructor === Object;
		}
		return true;
	};

	/**
	 * Enable multiple instances
	 */
	static multipleInstances = false;

	/**
	 * Automatic saving to storage when any property is changed
	 */
	static autoSave = false;

	// TODO: назначение статических методов get, set, addTo и т.д. написать в виде единственного блока кода? Учесть JSDoc!

	/**
	 * Method **get()** for single instance of a class
	 */
	static get = function(...args) {
		return this.__instance && this.__instance.get(...args);
	};

	/**
	 * Method **set()** for single instance of a class
	 */
	static set = function(...args) {
		return this.__instance && this.__instance.set(...args);
	};

	/**
	 * Method **addTo()** for single instance of a class
	 */
	static addTo = function(...args) {
		return this.__instance && this.__instance.addTo(...args);
	};

	/**
	 * Method **removeFrom()** for single instance of a class
	 */
	static removeFrom = function(...args) {
		return this.__instance && this.__instance.removeFrom(...args);
	};

	/**
	 * Method **clearProperty()** for single instance of a class
	 */
	static clearProperty = function(...args) {
		return this.__instance && this.__instance.clearProperty(...args);
	};

	/**
	 * Method **size()** for single instance of a class
	 */
	static size = function(...args) {
		return this.__instance && this.__instance.size(...args);
	};

	/**
	 * Method on() for single instance of a class
	 * @public
	 */
	static on = function(...args) {
		return this.__instance && this.__instance.on(...args);
	};

	/**
	 * Method *off()** for single instance of a class
	 */
	static off = function(...args) {
		return this.__instance && this.__instance.off(...args);
	};

	static #nextUID() {
		return ++SGModel.#uid;
	}

	static #ITEM_HASH_LEN = 16;

	/**
	 * SGModelView.sha256 - Хеширование данных
	 * [js-sha256]{@link https://github.com/emn178/js-sha256}
	 * @version 0.11.0
	 * @author Chen, Yi-Cyuan [emn178@gmail.com]
	 * @copyright Chen, Yi-Cyuan 2014-2024
	 * @license MIT
	 * @minify https://minify-js.com
	 * @notes Удалёны: код для sha224, определение root, экспорты, код использующий Node.js
	 *//* eslint-disable */
	 static #sha256 = function(){"use strict";var t="input is invalid type",h=("undefined"!=typeof ArrayBuffer),i="0123456789abcdef".split(""),
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
	static sha256 = this.#sha256.sha256;/* eslint-enable */

	/**
	 * Получить первые N шестнадцатеричных цифер хеша
	 * @param {string} line 
	 * @param {number} [len=SGModel.#ITEM_HASH_LEN]
	 * @returns {string}
	 */
	static sha256trimL = (line, len = SGModel.#ITEM_HASH_LEN) => {
		return this.sha256(line).substring(0, len);
	};
}

if (typeof globalThis === 'object') globalThis.SGModel = SGModel;

if (SGModel.isNode) {
	module.exports = SGModel;
} else if (SGModel.isBrowser) {
	window['SGModel'] = SGModel;
}

export default SGModel;
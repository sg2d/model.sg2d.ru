"use strict";

let __uid = 0;

/**
 * SGModel v1.0.8
 * Быстрая легковесная библиотека-класс для структурирования веб-приложений с помощью биндинг-моделей. Это более быстрый и упрощенный аналог Backbone.js! Библиотека хорошо адаптирована для наследования классов.
 * @english Fast lightweight library for structuring web applications using binding models and custom events. This is a faster and more simplified analogue of Backbone.js!
 * @version 1.0.8
 * @requires ES2024+ (ES15+)
 * @link https://github.com/sg2d/SGModel
 * @license SGModel may be freely distributed under the MIT license
 * @copyright 2019-2025 © Калашников Илья (https://model.sg2d.ru)
 */
class SGModel {

	/** @protected */
	static __instances = {};

	/** @protected */
	static __instancesByClass = {};

	/** Properties default values */
	static defaultProperties = {}; // override

	/** Property data types */
	static typeProperties = {}; // override

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
	 * Значение сквозного счётчка для текущего эземпляра на основе SGModel
	 * @protected
	 */
	__uid = 0;

	/**
	 * Главный объект экземпляров SGModel (свойства экземпляра).
	 * Для доступа используйте Proxy-объект this.data или методы get(), set(), addTo(), removeFrom(), clear()
	 */
	#data = null;

	/**
	 * Promise возвращаемый методом initialize()
	 * @public
	 */
	initialized = null;

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
	 * @private
	 */
	#onChangeCallbacks = {};
	
	/**
	 * Sets the default property values. Overriden
	 * @returns {object}
	 */
	defaults() {
		return SGModel.clone(this.constructor.defaultProperties);
	}
	
	/**
	 * SGModel constructor
	 * @param {object} [props={}] Properties
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
		if (!Object.hasOwn(this.constructor, 'ownSetters')) {
			this.constructor.ownSetters = {};
		}

		const defaults = this.defaults();

		this.uuid = this.uuid || defaults.uuid || properties.uuid || crypto.randomUUID && crypto.randomUUID() // must be https protocol to support the function crypto.randomUUID()
			|| '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c => (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16));
		delete defaults.uuid;
		delete properties.uuid;

		this.__uid = nextUID();

		SGModel.__instances[this.uuid] = this;
		(SGModel.__instancesByClass[this.constructor.name] = SGModel.__instancesByClass[this.constructor.name] || {})[this.uuid] = this;
		
		// Check static options
		if (typeof this.constructor.options === 'object' && this.constructor.options !== null) {
			this.options = SGModel.clone(this.constructor.options);
		} else {
			this.options = {};
		}
		
		if (typeof clonedOptions === 'object' && clonedOptions !== null) {
			if (typeof clonedOptions._this === 'object' && clonedOptions._this !== null) { // TODO: DEL DEPRECATED
				console.warn('"options._this" will be deprecated soon! The third parameter in the constructor is used, see "thisProperties".');
				Object.assign(this, clonedOptions._this); // add internal properties to the object, accessible through this.*
				delete clonedOptions._this;
			}
			Object.assign(this.options, SGModel.clone(clonedOptions));
		}
		
		// override defaults by localStorage data
		if (this.constructor.localStorageKey) {
			const data = JSON.parse(localStorage.getItem(this.constructor.localStorageKey + (!this.constructor.singleInstance ? ':' + this.uuid : '')));
			if (typeof data === 'object' && data !== null) {
				SGModel.initObjectByObject(defaults, data);
			}
		}
		
		if (Object.keys(properties).length) {
			properties = SGModel.clone(properties);
		}

		for (const propName in properties) {
			const valueOrCollection = properties[propName];
			if (valueOrCollection === void 0) {
				delete properties[propName];
			} else {
				properties[propName] = this.#verifyProperty(propName, valueOrCollection, defaults[propName]);
			}
		}

		this.#data = SGModel.defaults({}, defaults, properties);
		this.data = new Proxy(this.#data, {
			get(properties, prop) {
				if (Object.hasOwn(properties, prop)) {
					return properties[prop];
				}
				throw new Error(`Error! Properties "${prop}" doen't exists!`);
			},
			set(properties, prop, value, receiver) {
				if (Object.hasOwn(properties, prop)) {
					self.set(prop, value);
					return true;
				}
				throw new Error(`Error! Properties "${prop}" doen't exists!`);
			},
			deleteProperty(properties, prop) {
				self.#off(prop);
				delete properties[prop];
			},
		});
		
		// Костыль, так как в JS нет возможности выполнить код в дочернем классе (что-нибудь вроде специальной статической функции) в момент наследования от родительского класса
		// Crutch, since in JS there is no way to execute the code in the child class at the time of extends of the parent class
		if (!Object.hasOwn(this.constructor, '__ownSettersInitialized')) {
			for (const p in this.constructor.ownSetters) {
				if (this.constructor.ownSetters[p] === true) {
					this.constructor.ownSetters[p] = this[`set${SGModel.upperFirstLetter(p)}`];
				}
			}
			this.constructor.__ownSettersInitialized = true;
		}
		
		// Дёргаем initialize() экземпляра после выполнения конструктора, что бы инициализировались приватные свойства! См. также #deferredProperties в SGModelView.
		setTimeout(() => {
			this.initialized = this.initialize.apply(this, arguments);
		}, 0)
	} // /constructor().

	/**
	 * Принимает имя свойства и значение, проверяет/модифицирует значение и возвращает результат
	 * @private
	 * @param {string} name
	 * @param {mixed} value
	 * @param {mixed} [valueDefault]
	 * @returns {mixed}
	 */
	#verifyProperty(name, value, valueDefault = void 0) {
		const typeProperty = this.constructor.typeProperties[name];
		switch (typeProperty) {
			case SGModel.TYPE_ANY: return value;
			case SGModel.TYPE_NUMBER: return SGModel.toNumberOrNull(value);
			case SGModel.TYPE_STRING: return SGModel.toStringOrNull(value);
			case SGModel.TYPE_BOOLEAN: return SGModel.toBooleanOrNull(value);
			case SGModel.TYPE_NUMBER_OR_XY: {
				if (typeof value === 'object' && value !== null) {
					value.x = SGModel.toNumberOrNull(value.x);
					value.y = SGModel.toNumberOrNull(value.y);
				} else {
					return SGModel.toNumberOrNull(value);
				}
				return value;
			}
			case SGModel.TYPE_ARRAY: case SGModel.TYPE_ARRAY_NUMBERS: {
				if (typeof value === 'string') {
					value = value.replace(/^{|}$/g, '').split(',');
				}
				if (!Array.isArray(value)) {
					value = [value];
				}
				if (typeProperty !== SGModel.TYPE_ARRAY) {
					for (let i = 0; i < value.length; i++) {
						value[i] = SGModel.toNumber(value[i]);
					}
				}
				return value;
			}
			case SGModel.TYPE_OBJECT: {
				if (Array.isArray(value)) {
					if (typeof valueDefault !== 'object' || valueDefault === null) {
						throw new Error(`No default value was set for an object named "${name}" (${this.constructor.name})! An object structure is required to fill in the data!`);
					}
					let index = 0;
					for (let i in valueDefault) {
						valueDefault[i] = value[index];
						index++;
					}
					return valueDefault;
				} else if (typeof value === 'object') {
					return value;
				}
				throw new Error(`Error! Property "${name}" (${this.constructor.name}) must be an object or an array!`);
			}
			case SGModel.TYPE_OBJECT_NUMBERS: {
				if (Array.isArray(value)) {
					if (typeof valueDefault !== 'object' || valueDefault === null) {
						throw new Error(`No default value was set for an object named "${name}" (${this.constructor.name})! An object structure is required to fill in the data!`);
					}
					let index = 0;
					for (let i in valueDefault) {
						valueDefault[i] = SGModel.toNumber(value[index]);
						index++;
					}
					return valueDefault;
				} else if (typeof value === 'object') {
					for (let i in value) {
						value[i] = SGModel.toNumber(value[i]);
					}
					return value;
				}
				throw new Error(`Error! Property "${name}" (${this.constructor.name}) must be an object or an array!`);
			}
			case SGModel.TYPE_SET: {
				// TODO parse string: '{one,two,three,...}'
				if (value !== void 0 && (value instanceof Set)) {
					return value;
				}
				throw new Error(`Error! Property "${name}" (${this.constructor.name}) must be a Set class!`);
			}
			case SGModel.TYPE_MAP: {
				// TODO parse string: '{one,two,three,...}'
				if (value !== void 0 && (value instanceof Map)) {
					return value;
				}
				throw new Error(`Error! Property "${name}" (${this.constructor.name}) must be a Map class!`);
			}
		}
		throw new Error(`Error! Unknown type specified for property "${name}" (${this.constructor.name})!`);
	}
	
	/** Called when an instance is created. Override in your classes
	 * @return {Promise}
	 */
	async initialize() {
		return Promise.resolve(true); // stub (you can override this method)
	}
	
	/**
	* Set property value
	* @param {string}	name
	* @param {mixed}	valueOrCollection
	* @param {object}	[options]
	* @param {number}	[options.precision] - Rounding precision
	* @param {mixed}	[options.previous_value] - Use this value as the previous value
	* @param {number}	[flags=0] - Valid flags: **FLAG_OFF_MAY_BE** | **FLAG_PREV_VALUE_CLONE** | **FLAG_NO_CALLBACKS** | **FLAG_FORCE_CALLBACKS** | **FLAG_IGNORE_OWN_SETTER**
	* @param {Event}	[event] - event when using SGModelView
	* @param {DOMElement} [elem] - event source element when using SGModelView
	* @return {boolean|Promise} If the value was changed will return **true** or Promise for option autoSave=true
	*/
	set(name, valueOrCollection, options = void 0, flags = 0, event = void 0, elem = void 0) {
		
		if (typeof options !== 'object' && options !== void 0) {
			throw new Error(`Error 7610932! "options" type is not a object or undefined! Property: ${name}, constructor: ${this.constructor.name}`);
		}
		if (typeof flags !== 'number') {
			throw new Error('Error 7892354! "flags" type is not a number!');
		}
		
		options = options || SGModel.OBJECT_EMPTY;
		
		if (!(flags & SGModel.FLAG_IGNORE_OWN_SETTER) && this.constructor.ownSetters[name]) {
			return this.constructor.ownSetters[name].call(this, valueOrCollection, options, flags);
		}
		
		let previous = this.#data[name];
		if (valueOrCollection === void 0) {
			delete this.#data[name];
		} else {
			// TODO: valueOrCollection = this.#verifyProperty(name, valueOrCollection);
			const type = this.constructor.typeProperties[name];
			switch (type) {
				case SGModel.TYPE_ANY: break;
				case SGModel.TYPE_NUMBER: {
					valueOrCollection = SGModel.toNumberOrNull(valueOrCollection, options.precision);
					break;
				}
				case SGModel.TYPE_STRING: {
					valueOrCollection = SGModel.toStringOrNull(valueOrCollection);
					break;
				}
				case SGModel.TYPE_BOOLEAN: {
					valueOrCollection = SGModel.toBooleanOrNull(valueOrCollection);
					break;
				}
				case SGModel.TYPE_NUMBER_OR_XY: return this.#setNumberOrXY.apply(this, arguments);
				case SGModel.TYPE_ARRAY: case SGModel.TYPE_ARRAY_NUMBERS: return this.#setArray.apply(this, arguments);
				case SGModel.TYPE_OBJECT: case SGModel.TYPE_OBJECT_NUMBERS: return this.#setObject.apply(this, arguments);
				case SGModel.TYPE_SET: case SGModel.TYPE_MAP: /* TODO */ break;
			}
		}
		
		//if (typeof previous === 'object' && previous !== null) {
		//	throw new Error('Error 9834571! Type of "previous" should be simple (not an object), because prevValue will not be cloned!');
		//}

		const changed = previous !== valueOrCollection;
		if (changed) {
			this.#data[name] = valueOrCollection;
		}
		return this.#changedAndCallbacks(changed, name, valueOrCollection, previous, options, flags);
	}

	/**
	 * Добавить элемент/свойство в коллекцию - один из методов для работы с массивами, объектами и коллекциями Map/Set
	 * @param {string} name
	 * @param {mixed} value
	 * @param {mixed} [key]
	 * @param {object} [options]
	 * @param {number} [flags=0]
	 * @returns {boolean|Promise} true, если данные в свойстве изменились (например, для коллекции-Set добавление уже существующего значения в коллекции метод вернёт false). Вернёт Promise при autoSave=true
	 */
	addTo(name, value, key = void 0, options = void 0, flags = 0) {
		const collection = this.#data[name];
		let changed = false;
		switch (this.constructor.typeProperties[name]) {
			case SGModel.TYPE_ARRAY: {
				collection.push(value);
				changed = true;
				break;
			}
			case SGModel.TYPE_ARRAY_NUMBERS: {
				collection.push(Number(value));
				changed = true;
				break;
			}
			case SGModel.TYPE_OBJECT: {
				if (collection[key] !== value) {
					collection[key] = value;
					changed = true;
				}
				break;
			}
			case SGModel.TYPE_OBJECT_NUMBERS: {
				value = Number(value);
				if (collection[key] !== value) {
					collection[key] = value;
					changed = true;
				}
				break;
			}
			case SGModel.TYPE_SET: {
				if (!collection.has(value)) {
					collection.add(value);
					changed = true;
				}
				break;
			}
			case SGModel.TYPE_MAP: {
				if (!collection.has(key) || collection.get(key) !== value) {
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
	 * @param {string} keyOrvalue
	 * @returns {boolean|Promise} true, если данные в свойстве изменились. Вернёт Promise при autoSave=true
	 */
	removeFrom(name, keyOrValue, options = void 0, flags = 0) {
		const collection = this.#data[name];
		if (collection === void 0) {
			return false;
		}
		let changed = false;
		switch (this.constructor.typeProperties[name]) {
			case SGModel.TYPE_ARRAY: case SGModel.TYPE_ARRAY_NUMBERS: {
				let index;
				while (index = collection.indexOf(keyOrValue), index === -1) {
					/*const deletedElements = */collection.splice(index, 1); // collection как объект останется тем же!
					changed = true;
				}
				break;
			}
			case SGModel.TYPE_OBJECT: case SGModel.TYPE_OBJECT_NUMBERS: {
				if (Object.hasOwn(collection, keyOrValue)) {
					delete collection[keyOrValue];
					changed = true;
				}
				break;
			}
			case SGModel.TYPE_SET: case SGModel.TYPE_MAP: {
				if (collection.has(keyOrValue)) {
					collection.delete(keyOrValue);
					changed = true;
				}
				break;
			}
			default: {
				throw new Error(`Error in size() method! The property with name "${name}" (${this.constructor.name}) has a simple data type!`);
			}
		}
		return this.#changedAndCallbacks(changed, name, collection, null, options, flags);
	}

	/**
	 * Очистить коллекцию - один из методов для работы с массивами, объектами и коллекциями Map/Set
	 * @param {string} name
	 * @returns {boolean|Promise} true, если данные в свойстве изменились.
	 */
	clear(name, options = void 0, flags = 0) {
		const collection = this.#data[name];
		if (collection === void 0) {
			return false;
		}
		let changed = false;
		switch (this.constructor.typeProperties[name]) {
			case SGModel.TYPE_ARRAY: case SGModel.TYPE_ARRAY_NUMBERS: {
				if (collection.length !== 0) {
					collection.length = 0;
					changed = true;
				}
				break;
			}
			case SGModel.TYPE_OBJECT: case SGModel.TYPE_OBJECT_NUMBERS: {
				for (const p in collection) {
					delete collection[p];
					changed = true;
				}
				break;
			}
			case SGModel.TYPE_SET: case SGModel.TYPE_MAP: {
				if (collection.size) {
					collection.clear();
					changed = true;
				}
			}
		}
		return this.#changedAndCallbacks(changed, name, collection, null, options, flags);
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

	/** @private */
	#setArray(name, aValues, options = void 0, flags = 0) {
		
		options = options || SGModel.OBJECT_EMPTY;
		
		if (!(flags & SGModel.FLAG_IGNORE_OWN_SETTER) && this.constructor.ownSetters[name]) {
			return this.constructor.ownSetters[name].call(this, aValues, options, flags);
		}

		const type = this.constructor.typeProperties[name];
		const values = this.#data[name];
		const valuesPrev = options.previous_value === null ? null : (options.previous_value || void 0);
		let bChanged = false;
		if (Array.isArray(aValues)) {
			for (let i = 0; i < aValues.length; i++) {
				let v = aValues[i];
				if (type === SGModel.TYPE_ARRAY_NUMBERS) {
					v = (options.precision ? SGModel.roundTo(v, options.precision) : Number(v));
				}
				if (values[i] !== v) {
					bChanged = true;
					if ((flags & SGModel.FLAG_PREV_VALUE_CLONE) && !valuesPrev) valuesPrev = SGModel.clone(values);
					values[i] = v;
				}
			}
		} else if (aValues) {
			throw new Error(`aValues should be must Array or empty! (${this.constructor.name})`);
		} else { // ! aValues
			const v = (type === SGModel.TYPE_OBJECT_NUMBERS ? 0 : void 0);
			for (let i = 0; i < values.length; i++) {
				if (values[i] !== v) {
					bChanged = true;
					if ((flags & SGModel.FLAG_PREV_VALUE_CLONE) && !valuesPrev) valuesPrev = SGModel.clone(values);
					values[i] = v;
				}
			}
		}
		
		if (bChanged) this.changed = true;
		
		if (bChanged || (flags & SGModel.FLAG_FORCE_CALLBACKS)) {
			this.#runCallbacks(name, values, valuesPrev, flags);
			return true;
		}
		
		return false;
	}
	
	/** @private */
	#setObject(name, oValues, options = void 0, flags = 0) {
		
		options = options || SGModel.OBJECT_EMPTY;
		
		if (!(flags & SGModel.FLAG_IGNORE_OWN_SETTER) && this.constructor.ownSetters[name]) {
			return this.constructor.ownSetters[name].call(this, oValues, options, flags);
		}

		const type = this.constructor.typeProperties[name];
		const values = this.#data[name];
		const valuesPrev = options.previous_value === null ? null : (options.previous_value || void 0);
		let bChanged = false;
		if (Array.isArray(oValues)) {
			let index = 0;
			for (const p in values) {
				let v = oValues[index];
				if (type === SGModel.TYPE_OBJECT_NUMBERS) {
					v = (options.precision ? SGModel.roundTo(v, options.precision) : Number(v));
				}
				if (values[p] !== v) {
					bChanged = true;
					if ((flags & SGModel.FLAG_PREV_VALUE_CLONE) && !valuesPrev) valuesPrev = SGModel.clone(values);
					values[p] = v;
				}
				index++;
			}
		} else if (oValues) {
			for (const p in oValues) {
				let v = oValues[p];
				if (type === SGModel.TYPE_OBJECT_NUMBERS) {
					v = (options.precision ? SGModel.roundTo(v, options.precision) : Number(v));
				}
				if (values[p] !== v) {
					bChanged = true;
					if ((flags & SGModel.FLAG_PREV_VALUE_CLONE) && !valuesPrev) valuesPrev = SGModel.clone(values);
					values[p] = v; 
				}
			}
		} else { // ! oValues
			const v = (type === SGModel.TYPE_OBJECT_NUMBERS ? 0 : void 0);
			for (const p in values) {
				if (values[p] !== v) {
					bChanged = true;
					if ((flags & SGModel.FLAG_PREV_VALUE_CLONE) && !valuesPrev) valuesPrev = SGModel.clone(values);
					values[p] = v;
				}
			}
		}
		
		if (bChanged) this.changed = true;

		if (bChanged || (flags & SGModel.FLAG_FORCE_CALLBACKS)) {
			this.#runCallbacks(name, values, valuesPrev, flags);
			return true;
		}
		return false;
	}
	
	/** @private */
	#setNumberOrXY(name, value, options = void 0, flags = 0) {
		
		options = options || SGModel.OBJECT_EMPTY;
		
		if (!(flags & SGModel.FLAG_IGNORE_OWN_SETTER) && this.constructor.ownSetters[name]) {
			return this.constructor.ownSetters[name].call(this, value, options, flags);
		}
		
		const valueCurrent = this.#data[name];
		let valuePrev = (options.previous_value === null ? null : (options.previous_value || void 0));
		let bChanged = false;
		
		if (value !== void 0 && value !== null) {
			if (typeof value === 'object') {
				value.x = (options.precision ? SGModel.roundTo(value.x, options.precision) : Number(value.x));
				value.y = (options.precision ? SGModel.roundTo(value.y, options.precision) : Number(value.y));
				if (typeof valueCurrent !== 'object') {
					if (valueCurrent !== value.x || valueCurrent !== value.y) {
						bChanged = true;
						valuePrev = valueCurrent;
						this.#data[name] = value; // TODO clone object?
					}
				} else {
					if (valueCurrent.x !== value.x || valueCurrent.y !== value.y) {
						bChanged = true;
						if ((flags & SGModel.FLAG_PREV_VALUE_CLONE) && !valuePrev) valuePrev = SGModel.clone(valueCurrent);
						valueCurrent.x = value.x;
						valueCurrent.y = value.y;
					}
				}
			} else {
				value = (options.precision ? SGModel.roundTo(value, options.precision) : Number(value));
				if (typeof valueCurrent !== 'object') {
					if (valueCurrent !== value) {
						bChanged = true;
						valuePrev = valueCurrent;
						this.#data[name] = value;
					}
				} else {
					if (valueCurrent.x !== value || valueCurrent.y !== value) {
						bChanged = true;
						if ((flags & SGModel.FLAG_PREV_VALUE_CLONE) && !valuePrev) valuePrev = SGModel.clone(valueCurrent);
						this.#data[name] = value;
					}
				}
			}
		} else {
			if (valueCurrent !== value) {
				bChanged = true;
				if ((flags & SGModel.FLAG_PREV_VALUE_CLONE) && !valuePrev) valuePrev = SGModel.clone(valueCurrent);
				this.#data[name] = void 0;
			}
		}
		
		if (bChanged) {
			this.changed = true;
		} else {
			return false;
		}
		
		if (bChanged || (flags & SGModel.FLAG_FORCE_CALLBACKS)) {
			this.#runCallbacks(name, value, valuePrev, flags);
		}
		
		return true;
	}
	
	/** @private */
	#runCallbacks(name, values, prevValue, flags = 0) { // TODO: перейти на #changedAndCallbacks() ?
		if (!(flags & SGModel.FLAG_NO_CALLBACKS)) {
			const callbacks = this.#onChangeCallbacks[name];
			if (callbacks) {
				if (flags & SGModel.FLAG_OFF_MAY_BE) callbacks = SGModel.clone(callbacks);
				let _val = void 0;
				for (const i in callbacks) {
					const c = callbacks[i];
					_val = c.f.call(c.c ? c.c : this, c.d ? c.d : values, prevValue, name);
					if (_val !== void 0) values = _val;
				}
			}
		}
	}
	
	/** Get property value */
	get(name) {
		return this.#data[name];
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
	
	/** @private */
	#on(name, func, context = void 0, data = void 0, flags = 0) {
		let callbacks = this.#onChangeCallbacks[name];
		if (!callbacks) callbacks = this.#onChangeCallbacks[name] = [];
		callbacks.push({f: func, c: context, d: data});
		if (flags & SGModel.FLAG_IMMEDIATELY) {
			func.call(context ? context : this, data ? data : this.#data[name], this.#data[name], name);
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
	 * Save instance data to local storage.
	 * You can override this method and save, for example, to a remote database by making asynchronous requests to the server
	 * @return Promise
	 */
	save() {
		if (!this.constructor.localStorageKey) {
			throw new Error('Error 37722990! The static property "localStorageKey" is not set!');
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
		if (this.constructor.storageProperties) {
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

	static #xy = {x: 0, y: 0};
}

/**
 * SGModel types
 * @constant
 */
SGModel.TYPE_ANY = void 0;
SGModel.TYPE_NUMBER = 1;
SGModel.TYPE_STRING = 2;
SGModel.TYPE_BOOLEAN = 3;
SGModel.TYPE_OBJECT = 4;
SGModel.TYPE_ARRAY = 5;
SGModel.TYPE_ARRAY_NUMBERS = 6;
SGModel.TYPE_OBJECT_NUMBERS = 7;
SGModel.TYPE_NUMBER_OR_XY = 8; // координата
SGModel.TYPE_SET = 9; // коллекции new Set()
SGModel.TYPE_MAP = 10; // коллекции new Map()

/**
 * The flag passed in the **.on(...)** call to execute the callback
 * @constant {boolean}
 */
SGModel.FLAG_IMMEDIATELY = 1;

/** @private */
SGModel.OBJECT_EMPTY = Object.preventExtensions({});

SGModel.FLAG_OFF_MAY_BE = 0b00000001; // if set can be .off(), then you need to pass this flag
SGModel.FLAG_PREV_VALUE_CLONE = 0b00000010; // Pass the previous value (heavy clone for objects / arrays)
SGModel.FLAG_NO_CALLBACKS = 0b00000100; // if given, no callbacks are executed
SGModel.FLAG_FORCE_CALLBACKS = 0b00001000; // execute callbacks even if there is no change
SGModel.FLAG_IGNORE_OWN_SETTER = 0b00010000; // ignore own setters

SGModel.OPTIONS_PRECISION_1 = Object.preventExtensions({ precision: 1 });
SGModel.OPTIONS_PRECISION_2 = Object.preventExtensions({ precision: 2 });
SGModel.OPTIONS_PRECISION_3 = Object.preventExtensions({ precision: 3 });
SGModel.OPTIONS_PRECISION_4 = Object.preventExtensions({ precision: 4 });
SGModel.OPTIONS_PRECISION_5 = Object.preventExtensions({ precision: 5 });

SGModel.DELETE_EMPTIES = true;

/**
 * List of properties for which to use their own setters first
 * Better than **.on(...)** for speed of work with a large number of class instances.
 * Also used if there is a base class and a descendant class where specific behavior is needed when changing properties.
 * @example
 *...
 *static ownSetters = Object.assign({
 *	state: true
 *}, OurBaseModel.ownSetters);
 *...
 *setState(value, options = SGModel.OBJECT_EMPTY, flags = 0) {
 *	if (this.set('state', value, options, flags | SGModel.FLAG_IGNORE_OWN_SETTER)) {
 *		//some code...
 *	}
 *}
 */
SGModel.ownSetters = {}; // override

function nextUID() {
	return ++__uid;
}

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
	if (typeof structuredClone === 'function') {
		return structuredClone(source);
	}
	let dest;
	if (Array.isArray(source)) {
		dest = [];
		for (let i = 0; i < source.length; i++) {
			dest[i] = (typeof source[i] === 'object' ? SGModel.clone(source[i]) : source[i]);
		}
	} else if (typeof source === 'object') {
		if (source === null) {
			dest = null;
		} else {
			dest = {};
			for (const p in source) {
				dest[p] = (typeof source[p] === 'object' ? SGModel.clone(source[p]) : source[p]);
			}
		}
	} else {
		dest = source;
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
		for (let i = 0; i < dest.length; i++) {
			if (source.hasOwnProperty(i)) {
				if (typeof dest[i] === 'object') {
					this.initObjectByObject(dest[i], source[i]);
				} else {
					dest[i] = source[i];
				}
			}
		}
	} else if (typeof dest === 'object') {
		for (const p in dest) {
			if (source.hasOwnProperty(p)) {
				if (typeof dest[p] === 'object') {
					this.initObjectByObject(dest[p], source[p]);
				} else {
					dest[p] = source[p];
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

/** @protected */
SGModel.__instance = null;

/**
 * Enable singleton pattern for model
 */
SGModel.singleInstance = false;

/**
 * Enable multiple instances
 */
SGModel.multipleInstances = true;

/**
 * Automatic saving to storage when any property is changed
 */
SGModel.autoSave = false;

/** @public */
SGModel.getInstance = function(bIgnoreEmpty = false) {
	if (this.__instance) {
		return this.__instance;
	} else if (!bIgnoreEmpty) {
		throw new Error('Error! this.__instance is empty!');
	}
	return null;
};

/**
 * Method **save()** for single instance of a class
 */
SGModel.save = function() {
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

/**
 * Method **getProperties()** for single instance of a class
 */
SGModel.getProperties = function(...args) {
	return this.__instance && this.__instance.data;
};

/**
 * If a non-empty string value is specified, then the data is synchronized with the local storage.
 * Support for storing data as one instance of a class (single instance), and several instances: **localStorageKey + '_' + id**
 */
SGModel.localStorageKey = ''; // override

/** @protected */
SGModel.__ownSettersInitialized = false; // overrided

/**
 * Library version (fixed in minified version)
 * @readonly
 */
SGModel.version = typeof __SGMODEL_VERSION__ !== 'undefined' ? __SGMODEL_VERSION__ : '*';

if (typeof globalThis === 'object') globalThis.SGModel = SGModel;
else if (typeof exports === 'object' && typeof module === 'object') module.exports = SGModel;
else if (typeof define === 'function' && define.amd) define('SGModel', [], () => SGModel);
else if (typeof exports === 'object') exports['SGModel'] = SGModel;
else if (typeof window === 'object' && window.document) window['SGModel'] = SGModel;
else this['SGModel'] = SGModel;

export default SGModel;
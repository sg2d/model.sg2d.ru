/**
 * SGModel 1.0.0
 * A fast lightweight library (ES6) for structuring web applications using binding models and custom events. This is a faster and more simplified analogue of Backbone.js!
 * https://github.com/VediX/SGModel
 *
 * Copyright 2020 VediX Systems
 *
 * SGModel may be freely distributed under the MIT license.
 */

"use strict";

export default class SGModel {
	
	// Property data types
	static typeProperties = {};
	
	static TYPE_NUMBER = 1;
	static TYPE_STRING = 2;
	static TYPE_BOOL = 3;
	static TYPE_OBJECT = 4;
	static TYPE_ARRAY_NUMBERS = 5;
	static TYPE_OBJECT_NUMBERS = 6;
	
	// The flag passed in the .on(...) call so that the callback is executed once at once (Флаг, передаваемый в вызове .on(...), что бы колбэк выполнился один раз сразу)
	static RUNNOW = 1;
	
	static OBJECT_EMPTY = Object.freeze({});
	
	// List of properties for which to use their own setters first (Список свойств для которых вначале использовать собственные сеттеры)
	static ownSetters = {};
	
	// The flag passed in the .set(...) call so that the custom setter is not called (Флаг передаваемый в вызове .set(...), что бы не был вызван пользовательский сеттер)
	static IGNORE_OWN_SETTER = true;
	
	static _uid = 0;
	static uid() {
		return ++SGModel._uid;
	}
	
	static defaults(dest, ...sources) {
		for (var i = sources.length; i--; ) {
			var source = sources[i];
			for (var p in source) {
				if (dest[p] === void 0) {
					dest[p] = (typeof source[p] === "object" ? SGModel.clone(source[p]) : source[p]);
				}
			}
		}
		return dest;
	}
	
	static clone(source) {
		let dest;
		if (Array.isArray(source)) {
			dest = [];
			for (var i = 0; i < source.length; i++) {
				dest[i] = (typeof source[i] === "object" ? SGModel.clone(source[i]) : source[i]);
			}
		} else if (typeof source === "object") {
			dest = {};
			for (var p in source) {
				dest[p] = (typeof source[p] === "object" ? SGModel.clone(source[p]) : source[p]);
			}
		} else {
			dest = source;
		}
		return dest;
	}
	
	/**
	 * Заполнить значения объекта/массива dest значениями из объекта/массива source (с рекурсией)
	 */
	static revertDefaults(dest, source) {
		if (Array.isArray(dest)) {
			for (var i = 0; i < dest.length; i++) {
				if (source.hasOwnProperty(i)) {
					if (typeof dest[i] === "object") {
						this.revertDefaults(dest[i], source[i]);
					} else {
						dest[i] = source[i];
					}
				}
			}
		} else if (typeof dest === "object") {
			for (var p in dest) {
				if (source.hasOwnProperty(p)) {
					if (typeof dest[p] === "object") {
						this.revertDefaults(dest[p], source[p]);
					} else {
						dest[p] = source[p];
					}
				}
			}
		} else {
			dest = source;
		}
		return dest;
	}
	
	static upperFirstLetter(s) {
		return s.charAt(0).toUpperCase() + s.slice(1);
	}
	
	static singleInstance = false;
	static _instance = null;
	static getInstance(bIgnoreEmpty) {
		if (this._instance) {
			return this._instance;
		} else if (! bIgnoreEmpty) {
			debugger;
			throw "Error! this._instance is empty!";
		}
		return null;
	}
	
	// If a string value is given, then the data is synchronized with the local storage
	// There is support for storing data of a single instance of a class, and for multiple instances: localStorageKey + "_" + id
	static localStorageKey = "";
	
	// for single instance of a class
	static get(...args) {
		return this._instance && this._instance.get(...args);
	}
	// for single instance of a class
	static set(...args) {
		return this._instance && this._instance.set(...args);
	}
	
	static _bChanged = false;
	static _index = 0
	static _prevValue = void 0;
	
	/**
	 * SGModel constructor
	 * @param {object} props Свойства
	 * @param {object} thisProps Свойства и методы передающиеся в контекст this созданного экземпляра
	 * @param {object} options Пользовательские настройки
	 */
	constructor(props, thisProps, options) {
		
		if (this.constructor.singleInstance) {
			if (this.constructor._instance) throw "Error! this.constructor._instance not is empty!";
			this.constructor._instance = this;
		}
		
		var properties = props || {};
		
		var defaults = (typeof this.defaults === "function" ? this.defaults() : SGModel.clone(this.constructor.defaultProperties));
		
		// override defaults by localStorage data
		let lsData = void 0;
		if (this.constructor.localStorageKey) {
			let data = localStorage.getItem(this.constructor.localStorageKey + (! this.constructor.singleInstance ? "_" + props.id : ""));
			//try {
				if (data) lsData = JSON.parse(data);
			//} catch(e) {}
			if (lsData) SGModel.revertDefaults(defaults, lsData);
		}
		
		for (var p in properties) {
			var value = properties[p];
			switch (this.constructor.typeProperties[p]) {
				case SGModel.TYPE_NUMBER: properties[p] = (value === void 0 ? void 0 : +value); break;
				case SGModel.TYPE_ARRAY_NUMBERS: {
					for (var i = 0; i < value.length; i++) value[i] = +value[i];
					break;
				}
				case SGModel.TYPE_OBJECT_NUMBERS: {
					if (Array.isArray(value)) {
						var valueDefault = defaults[p];
						if (! valueDefault) { debugger; throw "No default value was set for an object named \""+p+"\" ("+this.constructor.name+")! An object structure is required to fill in the data!"; }
						var index = 0;
						for (var i in valueDefault) {
							valueDefault[i] = +value[index];
							index++;
						}
						properties[p] = valueDefault;
					} else if (typeof value === "object") {
						for (var i in value) {
							value[i] = +value[i];
						}
					} else { debugger; throw "Error! Property \""+p+"\" ("+this.constructor.name+") must be an object or an array!"; }
					break;
				}
				case SGModel.TYPE_STRING: properties[p] = ''+value; break;
				case SGModel.TYPE_BOOL: properties[p] = !! value; break;
				case SGModel.TYPE_OBJECT:
					if (Array.isArray(value)) {
						var valueDefault = defaults[p];
						if (! valueDefault) { debugger; throw "No default value was set for an object named \""+p+"\" ("+this.constructor.name+")! An object structure is required to fill in the data!"; }
						var index = 0;
						for (var i in valueDefault) {
							valueDefault[i] = value[index];
							index++;
						}
						properties[p] = valueDefault;
					} else if (typeof value === "object") {
						// no code
					} else { debugger; throw "Error! Property \""+p+"\" ("+this.constructor.name+") must be an object or an array!"; }
					break;
				default:
			}
		}

		this.properties = SGModel.defaults({}, defaults, properties);

		if (! this.properties.id) this.properties.id = SGModel.uid();

		if (thisProps) {
			Object.assign(this, thisProps); // add internal properties to the object, accessible through this.*
		} else {
			thisProps = SGModel.OBJECT_EMPTY;
		}
		
		this.destroyed = false;

		this.onChangeCallbacks = {};
		
		this.ownSetters = {};
		if (! this.constructor._ownSettersInitialized) {
			this.constructor._ownSettersInitialized = true;
			for (var p in this.constructor.ownSetters) {
				if (this.constructor.ownSetters[p] === true) {
					this.constructor.ownSetters[p] = this["set" + SGModel.upperFirstLetter(p)];
				}
			}
		}
		
		this.changed = false; // reset manually!
		
		this.initialize.call(this, props, thisProps, options);
	}
	
	// Called when an instance is created. Override in your classes.
	initialize() {}
	
	/**
	* Задать значение свойства
	* @param {string} name
	* @param {mixed} val
	* @param {object} options	Допустимые флаги:
	*					off_may_be - если при set могут быть off то нужно передать этот флаг
	*					prev_value_clone - передавать пред.значение (делается тяжёлый clone)
	*					prev_value - использовать это значение в качестве пред.значения
	*					no_triggers - если задано, то колбэки не выполняются
	* @param {boolean} ignoreOwnSetter=false
	* @return {boolean} true если значение было изменено
	*/
	set(name, val, options, ignoreOwnSetter = false) {
		
		if (ignoreOwnSetter === false && this.constructor.ownSetters[name]) {
			return this.constructor.ownSetters[name].call(this, val, options);
		}
		
		options = options || SGModel.OBJECT_EMPTY;
		
		var type = this.constructor.typeProperties[name];
		if (type) {
			switch (type) {
				case SGModel.TYPE_NUMBER: {
					if (val !== void 0) {
						val = (options.precision ? Math.roundTo(val, options.precision) : +val);
					}
					break;
				}
				case SGModel.TYPE_STRING: val = ''+val; break;
				case SGModel.TYPE_BOOL: val = !! val; break;
				case SGModel.TYPE_OBJECT: return this.setObject.apply(this, arguments);
				case SGModel.TYPE_ARRAY_NUMBERS: return this.setArray.apply(this, arguments);
				case SGModel.TYPE_OBJECT_NUMBERS: return this.setObject.apply(this, arguments);
			}
		}
		
		var value = this.properties[name];
		if (value === val) return false;
		
		SGModel._prevValue = (options.prev_value !== void 0 ? options.prev_value : (options.prev_value_clone ? SGModel.clone(value) : value));
		this.properties[name] = val;
		this.changed = true;
		
		if (! options.no_triggers) {
			var callbacks = this.onChangeCallbacks[name];
			if (callbacks) {
				if (options.off_may_be) callbacks = SGModel.clone(callbacks);
				var _val = void 0;
				for (var i in callbacks) {
					var c = callbacks[i];
					if (c.d) {
						_val = c.f.call(c.c ? c.c : this, c.d, val, SGModel._prevValue);
					} else {
						_val = c.f.call(c.c ? c.c : this, val, SGModel._prevValue);
					}
					if (_val !== void 0) val = _val;
				}
			}
		}
		return true;
	}
	
	/**
	 * Задать значение без использования own-setter'а, если он задан. При value === void 0 всегда возвращает true
	 * Используется в связке со статическим свойством ownSetters в котором перечисляются поля, для которых сначала выполняется пользовательский setter
	 */
	setWoOwnSetter(name, value, options) {
		return (value !== void 0 && this.set(name, value, options, SGModel.IGNORE_OWN_SETTER) || value === void 0);
	}

	/**
	* Задать значение свойства в виде массива (изменяются только элементы). Если хотя бы один элемент массива изменился, то массив считается измененным и выполняются колбэки.
	* @param {string} name
	* @param {array} aValues
	* @param {object} options	Допустимые флаги:
	*					off_may_be - если при set могут быть off то нужно передать этот флаг
	*					prev_value_clone - передавать пред.значение (делается тяжёлый clone)
	*					prev_value - использовать этот массив в качестве пред.значения
	*					no_triggers - если задано, то колбэки не выполняются
	* @param {boolean} ignoreOwnSetter=false
	* @return {boolean} true если значение было изменено
	*/
	setArray(name, aValues, options, ignoreOwnSetter = false) {
		
		if (ignoreOwnSetter === false && this.constructor.ownSetters[name]) {
			return this.constructor.ownSetters[name].call(this, aValues, options);
		}
		
		options = options || SGModel.OBJECT_EMPTY;

		var type = this.constructor.typeProperties[name];
		var values = this.properties[name];

		SGModel._prevValue = options.prev_value || void 0;
		SGModel._bChanged = false;
		if (Array.isArray(aValues)) {
			for (var i = 0; i < aValues.length; i++) {
				var v = aValues[i];
				if (type === SGModel.TYPE_ARRAY_NUMBERS) {
					v = (options.precision ? Math.roundTo(v, options.precision) : +v);
				}
				if (values[i] !== v) {
					SGModel._bChanged = true;
					if (options.prev_value_clone && ! SGModel._prevValue) SGModel._prevValue = SGModel.clone(values);
					values[i] = v;
				}
			}
		} else if (aValues) {
			debugger;
			throw "aValues should be must Array or empty! ("+this.constructor.name+")";
		} else { // ! aValues
			var v = (type === SGModel.TYPE_OBJECT_NUMBERS ? 0 : void 0);
			for (var i = 0; i < values.length; i++) {
				if (values[i] !== v) {
					SGModel._bChanged = true;
					if (options.prev_value_clone && ! SGModel._prevValue) SGModel._prevValue = SGModel.clone(values);
					values[i] = v;
				}
			}
		}
		
		if (SGModel._bChanged) {
			this.changed = true;
		
			if (! options.no_triggers) {
				var callbacks = this.onChangeCallbacks[name];
				if (callbacks) {
					if (options.off_may_be) callbacks = SGModel.clone(callbacks);
					var _val = void 0;
					for (var i in callbacks) {
						var c = callbacks[i];
						if (c.d) {
							_val = c.f.call(c.c ? c.c : this, c.d, values, SGModel._prevValue);
						} else {
							_val = c.f.call(c.c ? c.c : this, values, SGModel._prevValue);
						}
						if (_val !== void 0) values = _val;
					}
				}
			}
			
			return true;
		}
		
		return false;
	}
	
	/**
	* Задать значение свойств объекта (изменяются только свойства). Если хотя бы одно свойство объекта изменилось, то объект считается измененным и выполняются колбэки.
	* @param {string} name
	* @param {object} oValues Объект или массив. В случае массива свойства задаются в том порядке в каком они были объявлены ранее.
	* @param {object} options	Допустимые флаги:
	*					off_may_be - если при set могут быть off то нужно передать этот флаг
	*					prev_value_clone - передавать пред.значение (делается тяжёлый clone)
	*					prev_value - использовать этот объект в качестве пред.значения
	*					no_triggers - если задано, то колбэки не выполняются
	* @param {boolean} ignoreOwnSetter=false
	* @return {boolean} true если значение было изменено
	*/
	setObject(name, oValues, options, ignoreOwnSetter = false) {
		
		if (ignoreOwnSetter === false && this.constructor.ownSetters[name]) {
			return this.constructor.ownSetters[name].call(this, oValues, options);
		}
		
		options = options || SGModel.OBJECT_EMPTY;

		var type = this.constructor.typeProperties[name];
		var values = this.properties[name];

		SGModel._prevValue = options.prev_value || void 0;
		SGModel._bChanged = false;
		if (Array.isArray(oValues)) {
			SGModel._index = 0;
			for (var p in values) {
				var v = oValues[SGModel._index];
				if (type === SGModel.TYPE_OBJECT_NUMBERS) {
					v = (options.precision ? Math.roundTo(v, options.precision) : +v);
				}
				if (values[p] !== v) {
					SGModel._bChanged = true;
					if (options.prev_value_clone && ! SGModel._prevValue) SGModel._prevValue = SGModel.clone(values);
					values[p] = v;
				}
				SGModel._index++;
			}
		} else if (oValues) {
			for (var p in oValues) {
				var v = oValues[p];
				if (type === SGModel.TYPE_OBJECT_NUMBERS) {
					v = (options.precision ? Math.roundTo(v, options.precision) : +v);
				}
				if (values[p] !== v) {
					SGModel._bChanged = true;
					if (options.prev_value_clone && ! SGModel._prevValue) SGModel._prevValue = SGModel.clone(values);
					values[p] = v; 
				}
			}
		} else { // ! oValues
			var v = (type === SGModel.TYPE_OBJECT_NUMBERS ? 0 : void 0);
			for (var p in values) {
				if (values[p] !== v) {
					SGModel._bChanged = true;
					if (options.prev_value_clone && ! SGModel._prevValue) SGModel._prevValue = SGModel.clone(values);
					values[p] = v;
				}
			}
		}

		if (SGModel._bChanged) {
			this.changed = true;
		
			if (! options.no_triggers) {
				var callbacks = this.onChangeCallbacks[name];
				if (callbacks) {
					if (options.off_may_be) callbacks = SGModel.clone(callbacks);
					var _val = void 0;
					for (var i in callbacks) {
						var c = callbacks[i];
						if (c.d) {
							_val = c.f.call(c.c ? c.c : this, c.d, values, SGModel._prevValue);
						} else {
							_val = c.f.call(c.c ? c.c : this, values, SGModel._prevValue);
						}
						if (_val !== void 0) values = _val;
					}
				}
			}
			
			return true;
		}
		return false;
	}

	get(name) {
		return this.properties[name];
	}

	/**
	 * Задать триггер на изменение свойства
	 * @param {string} name
	 * @param {function} func
	 * @param {object} context Если не задано, то передаётся this текущего объекта
	 * @param {mixed} data	Если data задано, то в колбэке в первом arguments[] передаётся это значение (data)
	 * @param {boolean} bRunNow Если true, то func выполниться один раз сейчас
	 */
	on(name, func, context, data, bRunNow = false) {
		var callbacks = this.onChangeCallbacks[name];
		if (! callbacks) callbacks = this.onChangeCallbacks[name] = [];
		callbacks.push({f: func, c: context, d: data});
		if (bRunNow) {
			if (data) {
				func.call(context ? context : this, data, this.properties[name], this.properties[name]);
			} else {
				func.call(context ? context : this, this.properties[name], this.properties[name]);
			}
		}
	}

	off(name, func) {
		if (name) {
			var callbacks = this.onChangeCallbacks[name];
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
		} else {
			for (var f in this.onChangeCallbacks) this.onChangeCallbacks[f].length = 0;
		}
	}
	
	/**
	 * Выполнить колбэки, которые выполняются при изменении значения свойства
	 * @param {string} name
	 * @param {object} options	Допустимые флаги:
	 *					off_may_be - если при set могут быть off то нужно передать этот флаг
	 */
	trigger(name, options) {
		
		options = options || SGModel.OBJECT_EMPTY;
		
		var callbacks = this.onChangeCallbacks[name];
		if (callbacks) {
			if (options.off_may_be) callbacks = SGModel.clone(callbacks);
			for (var i in callbacks) {
				callbacks[i].f.call(callbacks[i].c ? callbacks[i].c : this, (callbacks[i].d ? callbacks[i].d : this.properties[name]));
			}
		}
	}
	
	/**
	 * Save data to localStorage
	 */
	save() {
		if (! this.constructor.localStorageKey) { debugger; throw "Error 37722990!"; }
		
		let id;
		if (this.constructor.singleInstance) {
			id = this.properties.id;
			delete this.properties.id;
		}
		
		localStorage.setItem(this.constructor.localStorageKey + (! this.constructor.singleInstance ? "_" + id : ""), JSON.stringify(this.properties));
		
		if (this.constructor.singleInstance) {
			this.properties.id = id;
		}
	}
	
	destroy() {
		this.destroyed = true;
		this.constructor._instance = null;
		this.off();
	}
}
"use strict";

export default class SG2DModel {
	
	static typeProperties = {};
	static TYPE_NUMBER = 1;
	static TYPE_STRING = 2;
	static TYPE_BOOL = 3;
	static TYPE_OBJECT = 4;
	static TYPE_ARRAY_NUMBERS = 5;
	static TYPE_OBJECT_NUMBERS = 6;
	
	static RUNNOW = 1;
	static OBJECT_EMPTY = Object.freeze({});
	static IGNORE_OWN_SETTER = true;
	static ownSetters = {};
	
	static _UID = 0;
	static uid() {
		return ++SG2DModel._UID;
	}
	
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
	 * SG2DModel constructor
	 * @param {object} props Свойства
	 * @param {object} thisProps Свойства и методы передающиеся в контекст this созданного экземпляра
	 * @param {object} options Пользовательские настройки
	 */
	constructor(props, thisProps, options) {
		
		var properties = props || {};
		
		var defaults = (typeof this.defaults === "function" ? this.defaults() : this.default);
		for (var p in properties) {
			var value = properties[p];
			switch (this.constructor.typeProperties[p]) {
				case SG2DModel.TYPE_NUMBER: properties[p] = (value === void 0 ? void 0 : +value); break;
				case SG2DModel.TYPE_ARRAY_NUMBERS: {
					for (var i = 0; i < value.length; i++) value[i] = +value[i];
					break;
				}
				case SG2DModel.TYPE_OBJECT_NUMBERS: {
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
				case SG2DModel.TYPE_STRING: properties[p] = ''+value; break;
				case SG2DModel.TYPE_BOOL: properties[p] = !! value; break;
				case SG2DModel.TYPE_OBJECT:
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

		this.properties = _.extend({}, defaults, properties);

		if (! this.properties.id) this.properties.id = SG2DModel.uid();

		if (thisProps) {
			Object.assign(this, thisProps); // добавляем к объекту внутренние свойства, доступные через this.%
		} else {
			thisProps = SG2DModel.OBJECT_EMPTY;
		}
		
		//if (! options) options = SG2DModel.OBJECT_EMPTY;

		this.onChangeCallbacks = {};
		
		this.ownSetters = {};
		if (! this.constructor._ownSettersInitialized) {
			this.constructor._ownSettersInitialized = true;
			for (var p in this.constructor.ownSetters) {
				if (this.constructor.ownSetters[p] === true) {
					this.constructor.ownSetters[p] = this["set" + p.charAt(0).toUpperCase() + p.slice(1)];
					//if (! this.constructor.ownSetters[p]) debugger; // TODO DEL
				}
			}
		}
		
		this.changed = false; // сбрасывайте вручную!
		
		this.initialize.call(this, props, thisProps, options);
	}
	
	/**
	 * Вызывается при создании экземпляра
	 */
	initialize() {} // override
	
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
		
		options = options || SG2DModel.OBJECT_EMPTY;
		
		var type = this.constructor.typeProperties[name];
		if (type) {
			switch (type) {
				case SG2DModel.TYPE_NUMBER: {
					if (val !== void 0) {
						val = (options.precision ? Math.roundTo(val, options.precision) : +val);
					}
					break;
				}
				case SG2DModel.TYPE_STRING: val = ''+val; break;
				case SG2DModel.TYPE_BOOL: val = !! val; break;
				case SG2DModel.TYPE_OBJECT: return this.setObject.apply(this, arguments);
				case SG2DModel.TYPE_ARRAY_NUMBERS: return this.setArray.apply(this, arguments);
				case SG2DModel.TYPE_OBJECT_NUMBERS: return this.setObject.apply(this, arguments);
			}
		}
		
		var value = this.properties[name];
		if (value === val) return false;
		
		SG2DModel._prevValue = (options.prev_value !== void 0 ? options.prev_value : (options.prev_value_clone ? _.clone(value) : value));
		this.properties[name] = val;
		this.changed = true;
		
		if (! options.no_triggers) {
			var callbacks = this.onChangeCallbacks[name];
			if (callbacks) {
				if (options.off_may_be) callbacks = _.clone(callbacks);
				for (var i in callbacks) {
					var c = callbacks[i];
					if (c.d) {
						c.f.call(c.c ? c.c : this, c.d, val, SG2DModel._prevValue);
					} else {
						c.f.call(c.c ? c.c : this, val, SG2DModel._prevValue);
					}
				}
			}
		}
		return true;
	}
	
	/**
	 * Задать значение без использования own-setter'а, если он задан
	 * Используется в связке со статическим свойством ownSetters в котором перечисляются поля, для которых сначала выполняется пользовательский setter
	 */
	setWoOwnSetter(name, value, options) {
		return (value !== void 0 && this.set(name, value, options, SG2DModel.IGNORE_OWN_SETTER) || value === void 0);
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
		
		options = options || SG2DModel.OBJECT_EMPTY;

		if (! Array.isArray(aValues)) { debugger; throw "aValues should be must Array! ("+this.constructor.name+")"; }

		var type = this.constructor.typeProperties[name];
		var values = this.properties[name];

		SG2DModel._prevValue = options.prev_value || void 0;
		SG2DModel._bChanged = false;
		for (var i = 0; i < aValues.length; i++) {
			var v = aValues[i];
			if (type === SG2DModel.TYPE_ARRAY_NUMBERS) {
				v = (options.precision ? Math.roundTo(v, options.precision) : +v);
			}
			if (values[i] !== v) {
				SG2DModel._bChanged = true;
				if (options.prev_value_clone && ! SG2DModel._prevValue) SG2DModel._prevValue = _.clone(values);
				values[i] = v;
			}
		}
		
		if (SG2DModel._bChanged) {
			this.changed = true;
		
			if (! options.no_triggers) {
				var callbacks = this.onChangeCallbacks[name];
				if (callbacks) {
					if (options.off_may_be) callbacks = _.clone(callbacks); // Если при set могут быть off то нужно передать этот флаг
					for (var i in callbacks) {
						var c = callbacks[i];
						if (c.d) {
							c.f.call(c.c ? c.c : this, c.d, values, SG2DModel._prevValue);
						} else {
							c.f.call(c.c ? c.c : this, values, SG2DModel._prevValue);
						}
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
		
		options = options || SG2DModel.OBJECT_EMPTY;

		var type = this.constructor.typeProperties[name];
		var values = this.properties[name];

		SG2DModel._prevValue = options.prev_value || void 0;
		SG2DModel._bChanged = false;
		if (Array.isArray(oValues)) {
			SG2DModel._index = 0;
			for (var p in values) {
				var v = oValues[SG2DModel._index];
				if (type === SG2DModel.TYPE_OBJECT_NUMBERS) {
					v = (options.precision ? Math.roundTo(v, options.precision) : +v);
				}
				if (values[p] !== v) {
					SG2DModel._bChanged = true;
					if (options.prev_value_clone && ! SG2DModel._prevValue) SG2DModel._prevValue = _.clone(values);
					values[p] = v;
				}
				SG2DModel._index++;
			}
		} else {
			for (var p in oValues) {
				var v = oValues[p];
				if (type === SG2DModel.TYPE_OBJECT_NUMBERS) {
					v = (options.precision ? Math.roundTo(v, options.precision) : +v);
				}
				if (values[p] !== v) {
					SG2DModel._bChanged = true;
					if (options.prev_value_clone && ! SG2DModel._prevValue) SG2DModel._prevValue = _.clone(values);
					values[p] = v; 
				}
			}
		}

		if (SG2DModel._bChanged) {
			this.changed = true;
		
			if (! options.no_triggers) {
				var callbacks = this.onChangeCallbacks[name];
				if (callbacks) {
					if (options.off_may_be) callbacks = _.clone(callbacks); // Если при set могут быть off то нужно передать этот флаг
					for (var i in callbacks) {
						var c = callbacks[i];
						if (c.d) {
							c.f.call(c.c ? c.c : this, c.d, values, SG2DModel._prevValue);
						} else {
							c.f.call(c.c ? c.c : this, values, SG2DModel._prevValue);
						}
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

	/*gets(name, index) {
		return this.properties[name][index];
	}*/

	/**
	 * Задать триггер на изменение свойства
	 * @param {string} name
	 * @param {function} func
	 * @param {object} context Если не задано, то передаётся this текущего объекта
	 * @param {mixed} data	Если data задано, то в колбэке в первом arguments[] передаётся это значение (data)
	 * @param {boolean} bRunNow Если true, то func выполниться один раз сейчас
	 */
	on(name, func, context, data, bRunNow = false) {
		var a = this.onChangeCallbacks[name];
		if (! a) a = this.onChangeCallbacks[name] = [];
		a.push({f: func, c: context, d: data});
		if (bRunNow) {
			if (data) {
				func.call(context ? context : this, data, this.properties[name], this.properties[name]);
			} else {
				func.call(context ? context : this, this.properties[name], this.properties[name]);
			}
		}
	}

	off(name, func) {
		if (arguments.length === 2 && ! arguments[1]) { debugger; throw "Error 1944222"; } // TODO DEL
		if (name) {
			if (this.onChangeCallbacks[name]) {
				if (func) {
					for (var i in this.onChangeCallbacks[name]) {
						if (this.onChangeCallbacks[name][i].f === func) {
							this.onChangeCallbacks[name].splice(i, 1);
						}
					}
				} else {
					this.onChangeCallbacks[name].length = 0;
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
		
		options = options || SG2DModel.OBJECT_EMPTY;
		
		var callbacks = this.onChangeCallbacks[name];
		if (callbacks) {
			if (options.off_may_be) callbacks = _.clone(callbacks);
			for (var i in callbacks) {
				callbacks[i].f.call(callbacks[i].c ? callbacks[i].c : this, (callbacks[i].d ? callbacks[i].d : this.properties[name]));
			}
		}
	}
	
	destroy() {
		this.off();
	}
}
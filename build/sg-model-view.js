/*!
 * SGModel 1.0.3 by @ Kalashnikov Ilya
 * https://model.sg2d.ru
 * License MIT
 * 
 * MIT License
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("SGModelView", [], factory);
	else if(typeof exports === 'object')
		exports["SGModelView"] = factory();
	else
		root["SGModelView"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 3);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = function(originalModule) {
	if (!originalModule.webpackPolyfill) {
		var module = Object.create(originalModule);
		// module.parent = undefined by default
		if (!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		Object.defineProperty(module, "exports", {
			enumerable: true
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ }),
/* 1 */
/***/ (function(module, exports) {

/* WEBPACK VAR INJECTION */(function(__webpack_amd_options__) {/* globals __webpack_amd_options__ */
module.exports = __webpack_amd_options__;

/* WEBPACK VAR INJECTION */}.call(this, {}))

/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(module) {/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return SGModel; });
/**
 * SGModel 1.0.2
 * A fast lightweight library (ES6) for structuring web applications using binding models and custom events. This is a faster and more simplified analogue of Backbone.js!
 * https://github.com/VediX/SGModel
 * (c) 2019-2021 Kalashnikov Ilya
 * SGModel may be freely distributed under the MIT license
 */



class SGModel {
	
	// overriden
	defaults() {
		return SGModel.clone(this.constructor.defaultProperties);
	}
	
	/**
	 * SGModel constructor
	 * @param {object} [props={}] Properties
	 * @param {object} [thisProps=void 0] Properties and methods passed to the "this" context of the created instance
	 * @param {object} [options=void 0] Custom settings
	 */
	constructor(properties = {}, thisProps = void 0, options = void 0) {
		
		if (this.constructor.singleInstance) {
			if (this.constructor._instance) throw "Error! this.constructor._instance not is empty!";
			this.constructor._instance = this;
		}
		
		let defaults = this.defaults();
		
		// override defaults by localStorage data
		if (this.constructor.localStorageKey) {
			let lsData = void 0;
			let data = localStorage.getItem(this.constructor.localStorageKey + (! this.constructor.singleInstance ? "_" + properties.id : ""));
			if (data) lsData = JSON.parse(data);
			if (lsData) SGModel.initObjectByObject(defaults, lsData);
		}
		
		if (typeof properties !== "object") properties = {};
		
		for (var p in properties) {
			var value = properties[p];
			switch (this.constructor.typeProperties[p]) {
				case SGModel.TYPE_ANY: case SGModel.TYPE_ARRAY: break;
				case SGModel.TYPE_NUMBER: properties[p] = (value === void 0 ? void 0 : +value); break;
				case SGModel.TYPE_NUMBER_OR_XY: {
					if (typeof value === "object") {
						value.x = (value.x === void 0 ? void 0 : +value.x);
						value.y = (value.y === void 0 ? void 0 : +value.y);
					} else {
						properties[p] = (value === void 0 ? void 0 : +value);
					}
					break;
				}
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
				case SGModel.TYPE_BOOLEAN: properties[p] = SGModel.toBoolean(value); break;
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
					debugger; throw "Error! Unknown type specified for property \""+p+"\" ("+this.constructor.name+")!";
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
		
		// Crutch, since in JS there is no way to execute the code in the child class at the time of extends of the parent class
		if (! this.constructor.hasOwnProperty("_ownSettersInitialized")) {
			this.constructor._ownSettersInitialized = true;
			for (var p in this.constructor.ownSetters) {
				if (this.constructor.ownSetters[p] === true) {
					this.constructor.ownSetters[p] = this["set" + SGModel.upperFirstLetter(p)];
				}
			}
		}
		
		this.changed = false; // reset manually!
		
		this.initialize.call(this, properties, thisProps, options);
	}
	
	// Called when an instance is created. Override in your classes.
	initialize() {}
	
	/**
	* Set property value
	* @param {string}	name
	* @param {mixed}	 val
	* @param {object}	[options=void 0]
	* @param {number}		[options.precision] - Rounding precision
	* @param {mixed}		[options.previous_value] - Use this value as the previous value
	* @param {number}	[flags=0] - Valid flags: FLAG_OFF_MAY_BE | FLAG_PREV_VALUE_CLONE | FLAG_NO_CALLBACKS | FLAG_FORCE_CALLBACKS | FLAG_IGNORE_OWN_SETTER
	* @return {boolean} If the value was changed will return true
	*/
	set(name, value, options = void 0, flags = 0) {
		
		if (typeof options !=="object" && options !== void 0) { debugger; throw "Error 7610932! \"options\" type is not a object or undefined! Property: " + name + ", constructor: " + this.constructor.name; }
		if (typeof flags !=="number") { debugger; throw "Error 7892354! \"flags\" type is not a number!" }
		
		options = options || SGModel.OBJECT_EMPTY;
		
		if (! (flags & SGModel.FLAG_IGNORE_OWN_SETTER) && this.constructor.ownSetters[name]) {
			return this.constructor.ownSetters[name].call(this, value, options, flags);
		}
		
		var type = this.constructor.typeProperties[name];
		if (type) {
			switch (type) {
				case SGModel.TYPE_ANY: break;
				case SGModel.TYPE_NUMBER: {
					if (value !== void 0) {
						value = (options.precision ? SGModel.roundTo(value, options.precision) : +value);
					}
					break;
				}
				case SGModel.TYPE_NUMBER_OR_XY: return this._setNumberOrXY.apply(this, arguments);
				case SGModel.TYPE_ARRAY: case SGModel.TYPE_ARRAY_NUMBERS: return this._setArray.apply(this, arguments);
				case SGModel.TYPE_OBJECT: case SGModel.TYPE_OBJECT_NUMBERS: return this._setObject.apply(this, arguments);
				case SGModel.TYPE_STRING: value = ''+value; break;
				case SGModel.TYPE_BOOLEAN: value = SGModel.toBoolean(value); break;
			}
		}
		
		var val = this.properties[name];
		
		if (val === value) {
			if (! (flags & SGModel.FLAG_FORCE_CALLBACKS)) return false;
		} else {
			this.properties[name] = value;
			this.changed = true;
		}
		
		if (! (flags & SGModel.FLAG_NO_CALLBACKS)) {
			
			SGModel._prevValue = (options.previous_value !== void 0 ? options.previous_value : ((flags & SGModel.FLAG_PREV_VALUE_CLONE) ? SGModel.clone(val) : val));
			
			var callbacks = this.onChangeCallbacks[name];
			
			if (callbacks) {
				if (flags & SGModel.FLAG_OFF_MAY_BE) callbacks = SGModel.clone(callbacks);
				var _val = void 0;
				for (var i in callbacks) {
					var c = callbacks[i];
					if (c.d) {
						_val = c.f.call(c.c ? c.c : this, c.d, value, SGModel._prevValue, name);
					} else {
						_val = c.f.call(c.c ? c.c : this, value, SGModel._prevValue, name);
					}
					if (_val !== void 0) val = _val;
				}
			}
			
			if (this.onAllCallback) this.onAllCallback();
		}
		
		return true;
	}

	/** @private */
	_setArray(name, aValues, options = void 0, flags = 0) {
		
		options = options || SGModel.OBJECT_EMPTY;
		
		if ( ! (flags & SGModel.FLAG_IGNORE_OWN_SETTER) && this.constructor.ownSetters[name]) {
			return this.constructor.ownSetters[name].call(this, aValues, options, flags);
		}

		var type = this.constructor.typeProperties[name];
		var values = this.properties[name];

		SGModel._prevValue = options.previous_value || void 0;
		SGModel._bChanged = false;
		if (Array.isArray(aValues)) {
			for (var i = 0; i < aValues.length; i++) {
				var v = aValues[i];
				if (type === SGModel.TYPE_ARRAY_NUMBERS) {
					v = (options.precision ? SGModel.roundTo(v, options.precision) : +v);
				}
				if (values[i] !== v) {
					SGModel._bChanged = true;
					if ((flags & SGModel.FLAG_PREV_VALUE_CLONE) && ! SGModel._prevValue) SGModel._prevValue = SGModel.clone(values);
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
					if ((flags & SGModel.FLAG_PREV_VALUE_CLONE) && ! SGModel._prevValue) SGModel._prevValue = SGModel.clone(values);
					values[i] = v;
				}
			}
		}
		
		if (SGModel._bChanged) this.changed = true;
		
		if (SGModel._bChanged || (flags & SGModel.FLAG_FORCE_CALLBACKS)) {
			this._runCallbacks(name, values, flags);
			return true;
		}
		
		return false;
	}
	
	/** @private */
	_setObject(name, oValues, options = void 0, flags = 0) {
		
		options = options || SGModel.OBJECT_EMPTY;
		
		if (! (flags & SGModel.FLAG_IGNORE_OWN_SETTER) && this.constructor.ownSetters[name]) {
			return this.constructor.ownSetters[name].call(this, oValues, options, flags);
		}

		var type = this.constructor.typeProperties[name];
		var values = this.properties[name];

		SGModel._prevValue = options.previous_value || void 0;
		SGModel._bChanged = false;
		if (Array.isArray(oValues)) {
			SGModel._index = 0;
			for (var p in values) {
				var v = oValues[SGModel._index];
				if (type === SGModel.TYPE_OBJECT_NUMBERS) {
					v = (options.precision ? SGModel.roundTo(v, options.precision) : +v);
				}
				if (values[p] !== v) {
					SGModel._bChanged = true;
					if ((flags & SGModel.FLAG_PREV_VALUE_CLONE) && ! SGModel._prevValue) SGModel._prevValue = SGModel.clone(values);
					values[p] = v;
				}
				SGModel._index++;
			}
		} else if (oValues) {
			for (var p in oValues) {
				var v = oValues[p];
				if (type === SGModel.TYPE_OBJECT_NUMBERS) {
					v = (options.precision ? SGModel.roundTo(v, options.precision) : +v);
				}
				if (values[p] !== v) {
					SGModel._bChanged = true;
					if ((flags & SGModel.FLAG_PREV_VALUE_CLONE) && ! SGModel._prevValue) SGModel._prevValue = SGModel.clone(values);
					values[p] = v; 
				}
			}
		} else { // ! oValues
			var v = (type === SGModel.TYPE_OBJECT_NUMBERS ? 0 : void 0);
			for (var p in values) {
				if (values[p] !== v) {
					SGModel._bChanged = true;
					if ((flags & SGModel.FLAG_PREV_VALUE_CLONE) && ! SGModel._prevValue) SGModel._prevValue = SGModel.clone(values);
					values[p] = v;
				}
			}
		}
		
		if (SGModel._bChanged) this.changed = true;

		if (SGModel._bChanged || (flags & SGModel.FLAG_FORCE_CALLBACKS)) {
			this._runCallbacks(name, values, flags);
			return true;
		}
		return false;
	}
	
	/** @private */
	_setNumberOrXY(name, value, options = void 0, flags = 0) {
		
		options = options || SGModel.OBJECT_EMPTY;
		
		if (! (flags & SGModel.FLAG_IGNORE_OWN_SETTER) && this.constructor.ownSetters[name]) {
			return this.constructor.ownSetters[name].call(this, value, options, flags);
		}
		
		let val = this.properties[name];
		SGModel._prevValue = options.previous_value || void 0;
		SGModel._bChanged = false;
		
		if (value !== void 0) {
			if (typeof value === "object") {
				value.x = (options.precision ? SGModel.roundTo(value.x, options.precision) : +value.x);
				value.y = (options.precision ? SGModel.roundTo(value.y, options.precision) : +value.y);
				if (typeof val === "object") {
					if (val.x !== value.x || val.y !== value.y) {
						SGModel._bChanged = true;
						if ((flags & SGModel.FLAG_PREV_VALUE_CLONE) && ! SGModel._prevValue) SGModel._prevValue = SGModel.clone(val);
						val.x = value.x;
						val.y = value.y;
					}
				} else {
					if (val !== value.x || val !== value.y) {
						SGModel._bChanged = true;
						SGModel._prevValue = val;
						this.properties[name] = value; // TODO clone object?
					}
				}
			} else {
				value = (options.precision ? SGModel.roundTo(value, options.precision) : +value);
				if (typeof val === "object") {
					if (val.x !== value || val.y !== value) {
						SGModel._bChanged = true;
						if ((flags & SGModel.FLAG_PREV_VALUE_CLONE) && ! SGModel._prevValue) SGModel._prevValue = SGModel.clone(val);
						this.properties[name] = value;
					}
				} else {
					if (val !== value) {
						SGModel._bChanged = true;
						SGModel._prevValue = val;
						this.properties[name] = value;
					}
				}
			}
		} else {
			if (val !== value) {
				SGModel._bChanged = true;
				if ((flags & SGModel.FLAG_PREV_VALUE_CLONE) && ! SGModel._prevValue) SGModel._prevValue = SGModel.clone(val);
				this.properties[name] = void 0;
			}
		}
		
		if (SGModel._bChanged) {
			this.changed = true;
		} else {
			return false;
		}
		
		if (SGModel._bChanged || (flags & SGModel.FLAG_FORCE_CALLBACKS)) {
			this._runCallbacks(name, value, flags);
		}
		
		return true;
	}
	
	_runCallbacks(name, values, flags = 0) {
		if (! (flags & SGModel.FLAG_NO_CALLBACKS)) {
			var callbacks = this.onChangeCallbacks[name];
			if (callbacks) {
				if (flags & SGModel.FLAG_OFF_MAY_BE) callbacks = SGModel.clone(callbacks);
				var _val = void 0;
				for (var i in callbacks) {
					var c = callbacks[i];
					if (c.d) {
						_val = c.f.call(c.c ? c.c : this, c.d, values, SGModel._prevValue, name);
					} else {
						_val = c.f.call(c.c ? c.c : this, values, SGModel._prevValue, name);
					}
					if (_val !== void 0) values = _val;
				}
			}
		}
	}

	get(name) {
		return this.properties[name];
	}

	/**
	 * Set trigger for property change
	 * @param {string|array} name
	 * @param {function} func
	 * @param {object} context If not specified, the "this" of the current object is passed
	 * @param {mixed} data	If "data" is set, then this value (data) is passed in the first arguments [] callback
	 * @param {number} flags Valid flags:
	 *		SGModel.FLAG_IMMEDIATELY - "func" will be executed once now
	 */
	on(name, func, context, data, flags = 0) {
		if (Array.isArray(name)) {
			for (var i = 0; i < name.length; i++) {
				this._on.call(this,
					name[i],
					func,
					Array.isArray(context) ? context[i] : context,
					Array.isArray(data) ? data[i] : data,
					flags
				);
			}
		} else {
			this._on.apply(this, arguments);
		}
	}
	
	/** @private */
	_on(name, func, context, data, flags = 0) {
		var callbacks = this.onChangeCallbacks[name];
		if (! callbacks) callbacks = this.onChangeCallbacks[name] = [];
		callbacks.push({f: func, c: context, d: data});
		if (flags === SGModel.FLAG_IMMEDIATELY) {
			if (data) {
				func.call(context ? context : this, data, this.properties[name], this.properties[name], name);
			} else {
				func.call(context ? context : this, this.properties[name], this.properties[name], name);
			}
		}
	}
	
	/**
	 * Check if there is a property in the model
	 */
	has(name) {
		return this.properties.hasOwnProperty(name);
	}
	
	/**
	 * Set trigger to change any property
	 * @param {function} func
	 * @param {number} flags Valid flags:
	 *		SGModel.FLAG_IMMEDIATELY - "func" will be executed once now
	 */
	setOnAllCallback(func, flags = 0) {
		this.onAllCallback = func;
		if (flags === SGModel.FLAG_IMMEDIATELY) {
			this.onAllCallback();
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
	 * Execute callbacks that are executed when the property value changes
	 * @param {string} name
	 * @param {number} flags Valid flags:
	 *		SGModel.FLAG_OFF_MAY_BE - if set can be .off(), then you need to pass this flag
	 */
	trigger(name, flags = 0) {
		
		var callbacks = this.onChangeCallbacks[name];
		if (callbacks) {
			if (flags & SGModel.FLAG_OFF_MAY_BE) callbacks = SGModel.clone(callbacks);
			for (var i in callbacks) {
				var cb = callbacks[i];
				if (cb.d) {
					cb.f.call( cb.c ? cb.c : this, cb.d, this.properties[name], this.properties[name], name );
				} else {
					cb.f.call( cb.c ? cb.c : this, this.properties[name], this.properties[name], name );
				}
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
		
		let dest = {};
		
		if (this.constructor.localStorageProperties) {
			debugger;
			for (var i = 0; i < this.constructor.localStorageProperties.length; i++) {
				let name = this.constructor.localStorageProperties[i];
				dest[name] = this.properties[name];
			}
		} else {
			// Discard properties starting with "_"
			for (var p in this.properties) {
				if (p[0] === "_") continue;
				dest[p] = this.properties[p];
			}
		}
		
		localStorage.setItem(this.constructor.localStorageKey + (! this.constructor.singleInstance ? "_" + id : ""), JSON.stringify(dest));
		
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

// Property data types
SGModel.typeProperties = {};
	
SGModel.defaultsProperties = {}; // override

SGModel.TYPE_ANY = void 0;
SGModel.TYPE_NUMBER = 1;
SGModel.TYPE_STRING = 2;
SGModel.TYPE_BOOLEAN = 3;
SGModel.TYPE_OBJECT = 4;
SGModel.TYPE_ARRAY = 5;
SGModel.TYPE_ARRAY_NUMBERS = 6;
SGModel.TYPE_OBJECT_NUMBERS = 7;
SGModel.TYPE_NUMBER_OR_XY = 8;

// The flag passed in the .on(...) call to execute the callback
SGModel.FLAG_IMMEDIATELY = true;

/** @private */
SGModel.OBJECT_EMPTY = Object.preventExtensions({});

SGModel.FLAG_OFF_MAY_BE = 0b00000001; // if set can be .off(), then you need to pass this flag
SGModel.FLAG_PREV_VALUE_CLONE = 0b00000010; // Pass the previous value (heavy clone for objects / arrays)
SGModel.FLAG_NO_CALLBACKS = 0b00000100; // if given, no callbacks are executed
SGModel.FLAG_FORCE_CALLBACKS = 0b00001000; // execute callbacks even if there is no change
SGModel.FLAG_IGNORE_OWN_SETTER = 0b00010000; // ignore own setters

SGModel.OPTIONS_PRECISION_2 = Object.preventExtensions({ precision: 2 });
SGModel.OPTIONS_PRECISION_3 = Object.preventExtensions({ precision: 3 });
SGModel.OPTIONS_PRECISION_4 = Object.preventExtensions({ precision: 4 });
SGModel.OPTIONS_PRECISION_5 = Object.preventExtensions({ precision: 5 });

/**
 * List of properties for which to use their own setters first
 * Better than .on(...) for speed of work with a large number of class instances.
 * Also used if there is a base class and a descendant class where specific behavior is needed when changing properties.
 * Example:
 *	...
 *	static ownSetters = Object.assign({
 *		state: true
 *	}, OurBaseModel.ownSetters);
 *	...
 *	setState(value, options = SGModel.OBJECT_EMPTY, flags = 0) {
 *		if (this.set("state", value, options, flags | SGModel.FLAG_IGNORE_OWN_SETTER)) {
 *			//some code...
 *		}
 *	}
 */
SGModel.ownSetters = {};

/** @private */
SGModel._uid = 0;

/** @private */
SGModel.uid = function() {
	return ++SGModel._uid;
};

/** @public */
SGModel.defaults = function(dest, ...sources) {
	for (var i = sources.length; i--; ) {
		var source = sources[i];
		for (var p in source) {
			if (dest[p] === void 0) {
				dest[p] = (typeof source[p] === "object" ? SGModel.clone(source[p]) : source[p]);
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
};

/**
 * Fill the values of the object / array dest with the values from the object / array source (with recursion)
 * @public
 */
SGModel.initObjectByObject = function(dest, source) {
	if (Array.isArray(dest)) {
		for (var i = 0; i < dest.length; i++) {
			if (source.hasOwnProperty(i)) {
				if (typeof dest[i] === "object") {
					this.initObjectByObject(dest[i], source[i]);
				} else {
					dest[i] = source[i];
				}
			}
		}
	} else if (typeof dest === "object") {
		for (var p in dest) {
			if (source.hasOwnProperty(p)) {
				if (typeof dest[p] === "object") {
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

/** @public */
SGModel.roundTo = function(value, precision = 0) {
	let m = 10 ** precision;
	return Math.round(value * m) / m;
};

/** @public */
SGModel.toBoolean = function(value) {
	return (typeof value === "string" ? (value === "1" || value.toUpperCase() === "TRUE" ? true : false) : !! value);
};

/** @private */
SGModel._instance = null;

/** @public */
SGModel.singleInstance = false;

/** @public */
SGModel.getInstance = function(bIgnoreEmpty = false) {
	if (this._instance) {
		return this._instance;
	} else if (! bIgnoreEmpty) {
		debugger;
		throw "Error! this._instance is empty!";
	}
	return null;
};

/** @public */
SGModel.save = function() {
	if (this._instance) {
		if (this.singleInstance) {
			return this._instance.save();
		} else {
			debugger; throw "Error! The class must be with singleInstance=true!";
		}
	} else {
		debugger; throw "Error! this._instance is empty!";
	}
	return null;
};

/**
 * Method get() for single instance of a class
 * @public
 */
SGModel.get = function(...args) {
	return this._instance && this._instance.get(...args);
};

/**
 * Method set() for single instance of a class
 * @public
 */
SGModel.set = function(...args) {
	return this._instance && this._instance.set(...args);
};

/**
 * Method on() for single instance of a class
 * @public
 */
SGModel.on = function(...args) {
	return this._instance && this._instance.on(...args);
};

/**
 * Method off() for single instance of a class
 * @public
 */
SGModel.off = function(...args) {
	return this._instance && this._instance.off(...args);
};

/**
 * Method getProperties() for single instance of a class
 * @public
 */
SGModel.getProperties = function(...args) {
	return this._instance && this._instance.properties;
};

/**
 * If a non-empty string value is specified, then the data is synchronized with the local storage.
 * Support for storing data as one instance of a class (single instance), and several instances: localStorageKey + "_" + id
 */
SGModel.localStorageKey = ""; // override

/** @private */
SGModel._bChanged = false;

/** @private */
SGModel._index = 0

/** @private */
SGModel._prevValue = void 0;

/** @private */
//static _ownSettersInitialized = false; // override

/** @private */
SGModel._xy = {x: 0, y: 0};

SGModel.version =  true ? "1.0.3" : undefined;

if (typeof exports === 'object' && typeof module === 'object') module.exports = SGModel;
else if (typeof define === 'function' && __webpack_require__(1)) define("SGModel", [], ()=>SGModel);
else if (typeof exports === 'object') exports["SGModel"] = SGModel;
else if (typeof window === 'object' && window.document) window["SGModel"] = SGModel;
else undefined["SGModel"] = SGModel;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(0)(module)))

/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* WEBPACK VAR INJECTION */(function(module) {/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return SGModelView; });
/* harmony import */ var _sg_model_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2);
/**
 * SGModelView 1.0.0
 * Binder for SGModelView (MVVM)
 * https://github.com/VediX/SGModel
 * (c) 2021 Kalashnikov Ilya
 * SGModelView may be freely distributed under the MIT license
 */





class SGModelView extends _sg_model_js__WEBPACK_IMPORTED_MODULE_0__[/* default */ "a"] {
	
	/**
	 * Overriding the set method
	 */
	set(name, ...args) {
		if (super.set.apply(this, arguments) && (this._binderInitialized)) {
			this._refreshElement(name);
		}
	}
	
	/**
	 * Perform Data and View Binding (MVVM)
	 * @param {string|HTMLElement} [root=void 0]
	 */
	bindHTML(root = void 0) {
		
		if (! this._binderInitialized) {
			if (typeof document === "undefined") throw "Error! document is undefined!";
			this._onChangeDOMElementValue = this._onChangeDOMElementValue.bind(this);
			this._elementsHTML = {};
			this._binderInitialized = true;
		}
		
		if (! root) root = document.body;
		if (typeof root === "string") root = document.querySelector(root);
		for (var name in this._elementsHTML) {
			this._elementsHTML[name].removeEventListener("change", this._onChangeDOMElementValue);
			this._elementsHTML[name].removeEventListener("input", this._onChangeDOMElementValue);
			delete this._elementsHTML[name];
		}
		this._bindElements([root]);
	}
	
	/** @private */
	_bindElements(elements) {
		for (var i = 0; i < elements.length; i++) {
			var element = elements[i];
			
			if (element.nodeType !== 1) continue;
			
			var sgProperty = element.getAttribute("sg-property");
			var sgType = element.getAttribute("sg-type");
			var sgFormat = element.getAttribute("sg-format");
			var sgAttributes = element.getAttribute("sg-attributes"); // TODO
			
			if (this.has(sgProperty)) {
				this._elementsHTML[sgProperty] = element;
				element._sg_property = sgProperty;
				element._sg_type = sgType;
				element._sg_format = this[sgFormat] || (v=>v);
				switch (sgType) {
					case "dropdown":
						var eItems = document.querySelectorAll("[sg-dropdown=" + sgProperty + "]");
						for (var i = 0; i < eItems.length; i++) {
							eItems[i].onclick = this._dropdownItemClick;
						}
						element.addEventListener("change", this._onChangeDOMElementValue);
						break;
					default: {
						if (element.type) {
							var sEvent = "";
							switch (element.type) {
								case "range": sEvent = "input"; break;
								case "radio": case "checkbox": case "text": case "button": case "select-one": case "select-multiple": sEvent = "change"; break;
							}
							if (sEvent) {
								element.addEventListener(sEvent, this._onChangeDOMElementValue);
							}
						}
					}
				}
				this._refreshElement(sgProperty);
			}
			this._bindElements(element.children);
		}
	}
	
	/** @private */
	_refreshElement(name) {
		
		var element = this._elementsHTML[name];
		if (! element) return;
		
		var value = this.properties[name];
		
		switch (element._sg_type) {
			case "dropdown":
				var eItems = document.querySelectorAll("[sg-dropdown=" + name + "]");
				for (var i = 0; i < eItems.length; i++) {
					var sgValue = eItems[i].getAttribute("sg-value");
					if (sgValue == value) {
						element.value = value;
						element.innerHTML = eItems[i].innerHTML;
						break;
					}
				}
				break;
			default: {
				if (element.type) {
					switch (element.type) {
						case "radio": case "checkbox": element.checked = value; break;
						case "range": case "text": case "button": case "select-one": element.value = value; break;
						case "select-multiple": {
							if (! Array.isArray(value)) { debugger; break; }
							for (var i = 0; i < element.options.length; i++) {
								let selected = false;
								for (var j = 0; j < value.length; j++) {
									if (element.options[i].value == value[j]) {
										selected = true;
										break;
									}
								}
								element.options[i].selected = selected;
							}
							break;
						}
					}
				} else {
					element.innerHTML = (element._sg_format ? element._sg_format(value) : value);
				}
			}
		}
	}
	
	/** @private */
	_onChangeDOMElementValue(event) {
		let elem = event.currentTarget;
		switch (elem.type) {
			case "checkbox": this.set(elem._sg_property, elem.checked); break;
			case "radio":
				let form = this._findParentForm(elem);
				let radioButtons = form.querySelectorAll("input[name=" + elem.name+"]");
				for (var i = 0; i < radioButtons.length; i++) {
					var _elem = radioButtons[i];
					if (_elem.getAttribute("sg-property") !== elem.getAttribute("sg-property") && _elem._sg_property) {
						this.set(_elem._sg_property, _elem.checked);
					}
				}
				this.set(elem._sg_property, elem.checked);
				break;
			case "range": case "text": case "button": case "select-one": this.set(elem._sg_property, elem.value); break;
			case "select-multiple":
				let result = [];
				for (var i = 0; i < elem.selectedOptions.length; i++) {
					result.push( elem.selectedOptions[i].value );
				}
				this.set(elem._sg_property, result);
				break;
		}
	}
	
	/** @private */
	_dropdownItemClick() {
		let button = this.parentNode.parentNode.querySelector("button");
		button.value = this.getAttribute("sg-value");
		button.innerHTML = this.innerHTML;
		button.dispatchEvent(new Event('change'));
	}
	
	/** @private */
	_findParentForm(elem) {
		let parent = elem.parentNode;
		if (parent) {
			if (parent.tagName === "FORM") {
				return parent;
			} else {
				return this._findParentForm(parent);
			}
		} else {
			return document.body;
		}
	}
}

if (typeof exports === 'object' && typeof module === 'object') module.exports = SGModelView;
else if (typeof define === 'function' && __webpack_require__(1)) define("SGModelView", [], ()=>SGModelView);
else if (typeof exports === 'object') exports["SGModelView"] = SGModelView;
else if (typeof window === 'object' && window.document) window["SGModelView"] = SGModelView;
else undefined["SGModelView"] = SGModelView;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(0)(module)))

/***/ })
/******/ ])["default"];
});
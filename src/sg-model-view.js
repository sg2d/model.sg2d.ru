"use strict";

import SGModel from "./sg-model.js";

/**
 * SGModelView 1.0.3
 * Add-on over SGModel that allows you to bind data in JavaScript with visual elements of HTML document using MVVM pattern.
 * @see https://github.com/VediX/SGModel
 * @copyright 2019-2021 Kalashnikov Ilya
 * @license SGModel may be freely distributed under the MIT license
 * @extends SGModel
 */
class SGModelView extends SGModel {
	
	/**
	 * Set property value. Overriding the **SGModel#set** method
	 * @param {string}	name
	 * @param {mixed}	 val
	 * @param {object}	[options=void 0]
	 * @param {number}		[options.precision] - Rounding precision
	 * @param {mixed}		[options.previous_value] - Use this value as the previous value
	 * @param {number}	[flags=0] - Valid flags: **FLAG_OFF_MAY_BE** | **FLAG_PREV_VALUE_CLONE** | **FLAG_NO_CALLBACKS** | **FLAG_FORCE_CALLBACKS** | **FLAG_IGNORE_OWN_SETTER**
	 * @return {boolean} If the value was changed will return **true**
	 * @override
	 */
	set(name, ...args) {
		if (super.set.apply(this, arguments) && (this._binderInitialized)) {
			this._refreshElement(name);
		}
	}
	
	/**
	 * Perform Data and View Binding (MVVM)
	 * @param {string|HTMLElement} [root=void 0] Example "#my_div_id" or HTMLElement object
	 */
	bindHTML(root = void 0) {
		
		if (! this._binderInitialized) {
			if (typeof document === "undefined") throw "Error! document is undefined!";
			this._onChangeDOMElementValue = this._onChangeDOMElementValue.bind(this);
			this._propertyElementLinks = {};
			this._eventsCounter = -1;
			this._elementsEvents = [];
			this._binderInitialized = true;
		}
		
		if (! root) root = document.body;
		if (typeof root === "string") root = document.querySelector(root);
		for (var name in this._propertyElementLinks) {
			var propertyElementLink = this._propertyElementLinks[name];
			if (propertyElementLink.type === SGModelView._LINKTYPE_VALUE) {
				propertyElementLink.element.removeEventListener("change", this._onChangeDOMElementValue);
				propertyElementLink.element.removeEventListener("input", this._onChangeDOMElementValue);
			}
			delete this._propertyElementLinks[name];
		}
		let item;
		while (item = this._elementsEvents.pop()) {
			item.element.removeEventListener(item.event, item.callback);
		}
		
		this._reProps = {};
		this._rePropsChecked = {};
		for (var name in this.properties) {
			this._reProps[name] = {
				re: new RegExp("[^\\w\\-]"+name+"[^\\w\\-]|^"+name+"[^\\w\\-]|[^\\w\\-]"+name+"$|^"+name+"$", "g"),
				to: "this.properties." + name
			};
			this._rePropsChecked[name] = new RegExp("[^\\w\\-]this\.properties\."+name+"[^\\w\\-]|^this\.properties\."+name+"[^\\w\\-]|[^\\w\\-]this\.properties\."+name+"$|^this\.properties\."+name+"$", "g");
		}
		this._sysThis = ["constructor", "initialize"];
		this._reThis = {};
		let thisNames = Object.getOwnPropertyNames(this.__proto__);
		for (var i = 0; i < thisNames.length; i++) {
			var name = thisNames[i];
			if (this._sysThis.indexOf(name) === -1 && ! /^_/.test(name)) {
				this._reThis[name] = {
					re: new RegExp("[^\\w\\-]"+name+"[^\\w\\-]|^"+name+"[^\\w\\-]|[^\\w\\-]"+name+"$|^"+name+"$", "g"),
					to: "this." + name
				};
			}
		}
		
		this._bindElements([root]);
		
		this._refreshAll();
	}
	
	/** @private */
	_bindElements(elements) {
		for (var e = 0; e < elements.length; e++) {
			var element = elements[e];
			
			if (element.nodeType !== 1) continue;
			
			var sgProperty = element.getAttribute("sg-property");
			//var sgValue = element.getAttribute("sg-value"); // TODO: value in innerHTML is formed by inline javascript code
			var sgType = element.getAttribute("sg-type");
			var sgFormat = element.getAttribute("sg-format");
			//var sgAttributes = element.getAttribute("sg-attributes"); // TODO
			var sgCSS = element.getAttribute("sg-css");
			//var sgStyle = element.getAttribute("sg-style"); // TODO
			var sgClick = element.getAttribute("sg-click");
			//var sgEvents = element.getAttribute("sg-events"); // TODO
			
			if (sgProperty && this.has(sgProperty)) {
				this._regPropertyElementLink(sgProperty, element, SGModelView._LINKTYPE_VALUE);
				element._sg_property = sgProperty;
				element._sg_type = sgType;
				element._sg_format = this[sgFormat];
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
			}
			
			if (sgCSS) {
				
				for (var name in this._reProps) {
					var l = sgCSS.length;
					sgCSS = sgCSS.replace(this._reProps[name].re, this._reProps[name].to);
					if (l !== sgCSS.length) {
						this._regPropertyElementLink(name, element, SGModelView._LINKTYPE_CSS);
					}
				}
				
				var bProperties = false;
				for (var name in this._rePropsChecked) {
					if (this._rePropsChecked[name].test(sgCSS)) {
						bProperties = true;
						break;
					}
				}
				
				var bFunctions = false;
				for (var name in this._reThis) {
					var l = sgCSS.length;
					sgCSS = sgCSS.replace(this._reThis[name].re, this._reThis[name].to);
					if (l !== sgCSS.length) {
						bFunctions = true;
					}
				}
				
				element._sg_css = (new Function("return " + sgCSS)).bind(this);
				element._sg_css_static_classes = [...element.classList];
				
				if (! bProperties && bFunctions) {
					this._regPropertyElementLink(sgProperty, element, SGModelView._LINKTYPE_CSS);
				}
			}
			
			if (sgClick) {
				let callback = this[sgClick];
				if (typeof callback === "function") {
					callback = callback.bind(this);
					element.addEventListener("click", callback);
					let index = this._eventsCounter++;
					this._elementsEvents[index] = {
						callback: callback,
						element: element,
						event: "click"
					}
				}
			}
			
			this._bindElements(element.children);
		}
	}
	
	_refreshAll() {
		for (var property in this._propertyElementLinks) {
			this._refreshElement(property);
		}
	}
	
	/** @private */
	_regPropertyElementLink(property, element, type) {
		var item = this._propertyElementLinks[property];
		if (! item) {
			item = this._propertyElementLinks[property] = [];
		}
		if (item.indexOf(element) === -1) {
			item.push({element: element, type: type});
		}
	}
	
	/** @private */
	_refreshElement(property) {
		
		if (! this._propertyElementLinks[property]) return false;
		
		for (var j = 0; j < this._propertyElementLinks[property].length; j++) {
			
			var propertyElementLink = this._propertyElementLinks[property][j];
			
			var element = propertyElementLink.element;
			if (! element) return false;
			
			switch (propertyElementLink.type) {
				case SGModelView._LINKTYPE_VALUE: {
				
					var value = this.properties[property];

					switch (element._sg_type) {
						case "dropdown":
							var eItems = document.querySelectorAll("[sg-dropdown=" + property + "]");
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
					break;
				}
				case SGModelView._LINKTYPE_CSS: {
					if (element._sg_css) {
						for (var i = 0; i < element.classList.length; i++) {
							if (element._sg_css_static_classes.indexOf(element.classList[i]) === -1) {
								element.classList.remove(element.classList[i]);
							}
						}
						let result = element._sg_css();
						if (typeof result === "function") {
							result = result.call(this, property);
						}
						if (! Array.isArray(result)) {
							if (result === "") {
								result = [];
							} else {
								result = result.split(" ");
							}
						}
						for (var i = 0; i < result.length; i++) {
							element.classList.add(result[i]);
						}
					}
					break;
				}
			}
		}
		return true;
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
			case "text": case "button": case "select-one": this.set(elem._sg_property, elem.value); break;
			case "range":
				this.set(elem._sg_property, elem.value); break;
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

SGModelView._LINKTYPE_VALUE = 1;
SGModelView._LINKTYPE_CSS = 2;

if (typeof exports === 'object' && typeof module === 'object') module.exports = SGModelView;
else if (typeof define === 'function' && define.amd) define("SGModelView", [], ()=>SGModelView);
else if (typeof exports === 'object') exports["SGModelView"] = SGModelView;
else if (typeof window === 'object' && window.document) window["SGModelView"] = SGModelView;
else this["SGModelView"] = SGModelView;

export default SGModelView;
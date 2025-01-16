"use strict";

import SGModel from "./sg-model.js";

/**
 * SGModelView 1.0.5
 * Add-on over SGModel that allows you to bind data in JavaScript with visual elements of HTML document using MVVM pattern.
 * @see https://github.com/VediX/SGModel or https://model.sg2d.ru
 * @copyright 2019-2025 Kalashnikov Ilya
 * @license SGModel may be freely distributed under the MIT license
 * @extends SGModel
 */
class SGModelView extends SGModel {
	
	/**
	 * Constructor
	 * @param {object} [properties=void 0]
	 * @param {object} [options=void 0]
	 * @param {object} [thisProperties=void 0] - Properties and methods passed to the this context of the created instance
	 */
	constructor(properties = {}, options = void 0, thisProperties = void 0) {
		super(properties, options, thisProperties);
		if (options) {
			this.htmlContainer = options.htmlContainer;
		}
	}
	
	/** Called when an instance is created
	 * @return {Promise}
	 */
	async initialize() {
		if (this.constructor.htmlFile) {
			if (!this.constructor.htmlFileContent) {
				await fetch(this.constructor.htmlFile)
					.catch((err) => Promise.reject(err))
					.then((result) => {
						if (result.ok === false) {
							return Promise.reject(new Error((result.statusText || 'Error') + (result.status ? ' (' + result.status + ')' : '') + (result.url ? ': ' + result.url : '')));
						}
						return result.text();
					})
					.then((html) => {
						this.constructor.htmlFileContent = html;
						return this._insertHTMLAndBind();
					});
			} else {
				await this._insertHTMLAndBind();
			}
		} else if (this.constructor.htmlViewId) {
			await this.bindHTML(this.constructor.htmlViewId);
		}
		return super.initialize.apply(this, arguments);
	}
	
	/** @private */
	_insertHTMLAndBind() {
		this.htmlContainer = this.htmlContainer || this.constructor.htmlContainer;
		if (this.htmlContainer) {
			this.eHtmlContainer = document.querySelector(this.htmlContainer);
			if (this.eHtmlContainer) {
				this.eHtmlContainer.insertAdjacentHTML('beforeend', this.constructor.htmlFileContent);
				if (this.constructor.htmlViewId) {
					return this.bindHTML(this.constructor.htmlViewId);
				} else {
					return this.bindHTML(this.eHtmlContainer);
				}
			} else {
				return Promise.reject(new Error(`document.querySelector for ${this.constructor.name}->htmlContainer="${this.htmlContainer}" is null!`));
			}
		} else if (this.constructor.htmlViewId) {
			return Promise.reject(new Error(`${this.constructor.name}->htmlContainer is empty!`));
		}
		return Promise.resolve();
	}
	
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
	 * Data and view binding (MVVM)
	 * @param {string|HTMLElement} [root=void 0] Example "#my_div_id" or HTMLElement object
	 */
	bindHTML(root = void 0) {
		if (! this._binderInitialized) {
			if (typeof document === "undefined") throw "Error! window.document is undefined!";
			this._onChangeDOMElementValue = this._onChangeDOMElementValue.bind(this);
			this._propertyElementLinks = {};
			this._eventsCounter = -1;
			this._elementsEvents = [];
			this._binderInitialized = true;
		}
		
		this.eHtmlContainer = (typeof root === 'string' ? document.querySelector(root) : (root ? root : document.body));
		if (!this.eHtmlContainer) throw `${this.constructor.name}->bindHTML() error! Container "${root}" does not exist!`;
		
		for (let name in this._propertyElementLinks) {
			const propertyElementLink = this._propertyElementLinks[name];
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
		for (let name in this.properties) {
			this._reProps[name] = {
				re: [
					new RegExp('([^\\w\\.\\-])'+name+'([^\\w\\.\\-])', 'g'),
					new RegExp('^()'+name+'([^\\w\\.\\-])', 'g'),
					new RegExp('([^\\w\\.\\-])'+name+'()$', 'g'),
					new RegExp('^()'+name+'()$', 'g')
				],
				to: '$1this.properties.' + name + '$2'
			};
			this._rePropsChecked[name] = [
				new RegExp('[^\\w\\.\\-]this\.properties\.'+name+'[^\\w\\.\\-]', 'g'),
				new RegExp('^this\.properties\.'+name+'[^\\w\\.\\-]', 'g'),
				new RegExp('[^\\w\\.\\-]this\.properties\.'+name+'$', 'g'),
				new RegExp('^this\.properties\.'+name+'$', 'g')
			];
		}
		this._sysThis = ["constructor", "initialize", "defaults"];
		this._reThis = {};
		let thisNames = Object.getOwnPropertyNames(this.__proto__);
		for (let i = 0; i < thisNames.length; i++) {
			const name = thisNames[i];
			if (this._sysThis.indexOf(name) === -1 && ! /^_/.test(name)) {
				this._reThis[name] = {
					re: [
						new RegExp('([^\\w\\.\\-])'+name+'([^\\w\\.\\-])', 'g'),
						new RegExp('^()'+name+'([^\\w\\.\\-])', 'g'),
						new RegExp('([^\\w\\.\\-])'+name+'()$', 'g'),
						new RegExp('^()'+name+'()$', 'g')
					],
					to: '$1this.' + name + '$2'
				};
			}
		}
		
		this._bindElements([this.eHtmlContainer]);
		this._refreshAll();
		
		return Promise.resolve();
	}
	
	/** @private */
	_bindElements(elements) {
		for (let e = 0; e < elements.length; e++) {
			const elementDOM = elements[e];
			
			if (elementDOM.nodeType !== 1) continue;
			
			const sgProperty = elementDOM.getAttribute("sg-property");
			const sgValue = elementDOM.getAttribute("sg-value"); // TODO: value in innerHTML is formed by inline javascript code
			const sgType = elementDOM.getAttribute("sg-type");
			const sgFormat = elementDOM.getAttribute("sg-format");
			let sgAttributes = elementDOM.getAttribute("sg-attributes");
			let sgCSS = elementDOM.getAttribute("sg-css");
			//const sgStyle = element.getAttribute("sg-style"); // TODO
			const sgClick = elementDOM.getAttribute("sg-click");
			//const sgEvents = element.getAttribute("sg-events"); // TODO
			const sgOptions = elementDOM.getAttribute("sg-options"); // For SELECT element
			
			if (sgProperty && this.has(sgProperty)) {
				this._regPropertyElementLink(sgProperty, elementDOM, SGModelView._LINKTYPE_VALUE);
				elementDOM._sg_property = sgProperty;
				elementDOM._sg_type = sgType;
				elementDOM._sg_format = this[sgFormat];
				switch (sgType) {
					case "dropdown":
						const eItems = document.querySelectorAll("[sg-dropdown=" + sgProperty + "]");
						for (let i = 0; i < eItems.length; i++) {
							eItems[i].onclick = this._dropdownItemClick;
						}
						elementDOM.addEventListener("change", this._onChangeDOMElementValue);
						break;
					default: {
						if (elementDOM.type) {
							let sEvent = "";
							switch (elementDOM.type) {
								case "range": sEvent = "input"; break;
								case "radio":
								case "checkbox":
								case "text":
								case "textarea":
								case "button":
								case "select-one":
								case "select-multiple":
								case "date":
								case "datetime-local":
									sEvent = "change"; break;
							}
							if (sEvent) {
								elementDOM.addEventListener(sEvent, this._onChangeDOMElementValue);
							}
						}
					}
				}
			}
			
			// Now attributes are implemented only for static output (only at initialization)
			if (sgAttributes) {
				try {
					sgAttributes = sgAttributes.replace(/(\w+):\s([\w]+)(\([^)]*\)){0,1}([,\s]{0,1})/g, '"$1": "$2$3"$4');;
					const attributes = JSON.parse(sgAttributes);
					for (let a in attributes) {
						const value = attributes[a];
						const method = value.replace(/(\w+)(.*)/, '$1');
						const args = Array.from(value.matchAll(/'(.*?)'/g));
						if (typeof this[method] === 'function') {
							elementDOM.setAttribute(a, this[method].apply(this, args.map((o)=>o[1])));
						}
					}
				} catch(err) {
					debugger;
					throw err;
				}
			}
			
			// Now attributes are implemented only for static output (only at initialization)
			if (sgValue) {
				try {
					const fFormat = this[sgFormat] || SGModel.fStub;
					const method = sgValue.replace(/(\w+)(.*)/, '$1');
					const args = Array.from(sgValue.matchAll(/'(.*?)'/g));
					if (typeof this[method] === 'function') {
						elementDOM.innerHTML = fFormat.call(this, this[method].apply(this, args.map((o)=>o[1])));
					} else {
						const props = sgValue.split('.');
						if (props.length === 2 && props[0] === this.constructor.name) {
							elementDOM.innerHTML = fFormat.call(this, this.constructor[props[1]]);
						}
					}
				} catch(err) {
					debugger;
					throw err;
				}
			}
			
			if (sgCSS) {
				for (let name in this._reProps) {
					const re = this._reProps[name].re;
					const l = sgCSS.length;
					for (let p = 0; p < re.length; p++) {
						sgCSS = sgCSS.replace(re[p], this._reProps[name].to);
					}
					if (l !== sgCSS.length) {
						this._regPropertyElementLink(name, elementDOM, SGModelView._LINKTYPE_CSS);
					}
				}
				
				let bProperties = false;
				for (let name in this._rePropsChecked) {
					const re = this._rePropsChecked[name];
					for (let p = 0; p < re.length; p++) {
						if (re[p].test(sgCSS)) {
							bProperties = true;
							break;
						}
					}
					if (bProperties) break;
				}
				
				let bFunctions = false;
				
				for (let name in this._reThis) {
					const re = this._reThis[name].re;
					const l = sgCSS.length;
					for (let p = 0; p < re.length; p++) {
						sgCSS = sgCSS.replace(re[p], this._reThis[name].to);
					}
					if (l !== sgCSS.length) {
						bFunctions = true;
					}
				}
				
				try {
					elementDOM._sg_css = (new Function("return " + sgCSS)).bind(this);
				} catch(err) {
					debugger;
					throw err;
				}
				
				elementDOM._sg_css_static_classes = [...elementDOM.classList];
				
				if (! bProperties && bFunctions) {
					this._regPropertyElementLink(sgProperty, elementDOM, SGModelView._LINKTYPE_CSS);
				}
			}
			
			if (sgClick) {
				let callback = this[sgClick];
				if (typeof callback === "function") {
					callback = callback.bind(this);
					elementDOM.addEventListener("click", callback);
					const index = this._eventsCounter++;
					this._elementsEvents[index] = {
						callback: callback,
						element: elementDOM,
						event: "click"
					}
				}
			}
			
			if (sgOptions && (elementDOM.type === 'select-one' || elementDOM.type === 'select-multiple')) {
				const options = this.get(sgOptions);
				if (Array.isArray(options)) {
					options.forEach((item) => {
						const eOption = document.createElement('option');
						eOption.value = item.value;
						eOption.innerHTML = item.title;
						eOption.hint = item.hint;
						elementDOM.appendChild(eOption);
					});
					elementDOM.selectedIndex = 0;
				} else {
					console.warn('Error 834514! options of SELECT element is not a array! Property: ' + sgOptions + ', constructor: ' + this.constructor.name);
				}
			}
			
			this._bindElements(elementDOM.children);
		}
	}
	
	_refreshAll() {
		for (let property in this._propertyElementLinks) {
			this._refreshElement(property);
		}
	}
	
	/** @private */
	_regPropertyElementLink(property, element, type) {
		let item = this._propertyElementLinks[property];
		if (! item) {
			item = this._propertyElementLinks[property] = [];
		}
		if (item.indexOf(element) === -1) {
			item.push({element: element, type: type});
		}
	}
	
	/** @private */
	_refreshElement(property) {
		
		if (! this._propertyElementLinks[property]) {
			return false;
		}
		
		for (let j = 0; j < this._propertyElementLinks[property].length; j++) {
			
			const propertyElementLink = this._propertyElementLinks[property][j];
			
			const elementDOM = propertyElementLink.element;
			if (! elementDOM) return false;
			
			switch (propertyElementLink.type) {
				case SGModelView._LINKTYPE_VALUE: {
				
					const value = this.properties[property];

					switch (elementDOM._sg_type) {
						case "dropdown":
							const eItems = document.querySelectorAll("[sg-dropdown=" + property + "]");
							for (let i = 0; i < eItems.length; i++) {
								const sgValue = eItems[i].getAttribute("sg-option");
								if (sgValue == value) {
									elementDOM.value = value;
									elementDOM.innerHTML = eItems[i].innerHTML;
									break;
								}
							}
							break;
						default: {
							if (elementDOM.type) {
								switch (elementDOM.type) {
									case "radio": case "checkbox": elementDOM.checked = value; break;
									case "range": case "select-one": elementDOM.value = value; break;
									case "date": elementDOM.value = String(value).replace(/\s.*/, ''); break; // YYYY-MM-DD
									case "datetime-local": elementDOM.value = String(value).replace(/[+-]\d+$/, ''); break; // YYYY-MM-DD HH:MM:SS
									case "text": case "textarea": case "button":
										const v = (elementDOM._sg_format ? elementDOM._sg_format.call(this, value) : value);
										elementDOM.value = v;
										if (elementDOM.type === "button") {
											elementDOM.innerText = v;
										}
										break;
									case "select-multiple": {
										if (! Array.isArray(value)) { debugger; break; }
										for (let i = 0; i < elementDOM.options.length; i++) {
											let selected = false;
											for (let j = 0; j < value.length; j++) {
												if (elementDOM.options[i].value == value[j]) {
													selected = true;
													break;
												}
											}
											elementDOM.options[i].selected = selected;
										}
										break;
									}
								}
							} else {
								elementDOM.innerHTML = (elementDOM._sg_format ? elementDOM._sg_format.call(this, value) : value);
							}
						}
					}
					break;
				}
				case SGModelView._LINKTYPE_CSS: {
					if (elementDOM._sg_css) {
						for (let i = elementDOM.classList.length - 1; i >= 0; i--) {
							if (elementDOM._sg_css_static_classes.indexOf(elementDOM.classList[i]) === -1) {
								elementDOM.classList.remove(elementDOM.classList[i]);
							}
						}
						let result = elementDOM._sg_css();
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
						for (let i = 0; i < result.length; i++) {
							elementDOM.classList.add(result[i]);
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
		const elem = event.currentTarget;
		switch (elem.type) {
			case "checkbox":
				this.set(elem._sg_property, elem.checked, void 0, void 0, event, elem);
				break;
			case "radio":
				const form = this._findParentForm(elem);
				const radioButtons = form.querySelectorAll("input[name=" + elem.name+"]");
				for (let i = 0; i < radioButtons.length; i++) {
					const _elem = radioButtons[i];
					if (_elem.getAttribute("sg-property") !== elem.getAttribute("sg-property") && _elem._sg_property) {
						this.set(_elem._sg_property, _elem.checked, void 0, void 0, event, _elem);
					}
				}
				this.set(elem._sg_property, elem.checked, void 0, void 0, event, elem);
				break;
			case "text": case "textarea": case "date": case "datetime-local": case "button": case "select-one":
				this.set(elem._sg_property, elem.value, void 0, void 0, event, elem);
				break;
			case "range":
				this.set(elem._sg_property, elem.value, void 0, void 0, event, elem); break;
			case "select-multiple":
				const result = [];
				for (let i = 0; i < elem.selectedOptions.length; i++) {
					result.push( elem.selectedOptions[i].value );
				}
				this.set(elem._sg_property, result, void 0, void 0, event, elem);
				break;
		}
	}
	
	/** @private */
	_dropdownItemClick() {
		const button = this.parentNode.parentNode.querySelector("button");
		button.value = this.getAttribute("sg-option");
		button.innerHTML = this.innerHTML;
		button.dispatchEvent(new Event('change'));
	}
	
	/** @private */
	_findParentForm(elem) {
		const parent = elem.parentNode;
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

if (typeof globalThis === 'object') globalThis.SGModelView = SGModelView;
else if (typeof exports === 'object' && typeof module === 'object') module.exports = SGModelView;
else if (typeof define === 'function' && define.amd) define('SGModelView', [], () => SGModelView);
else if (typeof exports === 'object') exports["SGModelView"] = SGModelView;
else if (typeof window === 'object' && window.document) window["SGModelView"] = SGModelView;
else this['SGModelView'] = SGModelView;

export default SGModelView;
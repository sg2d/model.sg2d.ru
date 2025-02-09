"use strict";

import SGModel from './sg-model.js';

/**
 * SGModelView - Надстройка над SGModel которая позволяет связать данные в инстансе с визуальными элементами HTML-документа (MVVM паттерн).
 * @english SGModelView - An add-on for SGModel that allows you to associate data in an instance with visual elements of an HTML document (MVVM pattern).
 * @version 1.0.8
 * @requires ES2024+ (ES15+)
 * @link https://github.com/sg2d/SGModel
 * @license SGModelView may be freely distributed under the MIT license
 * @copyright 2019-2025 © Калашников Илья (https://model.sg2d.ru)
 * @extends SGModel
 */
class SGModelView extends SGModel {

	/**
	 * Включить вывод UUID, имени класса и __uid в атрибуте sg-uuid корневого DOM-элемента представления
	 * @english Enable output of UUID, class name and __uid in the sg-uuid attribute of the root DOM element of view.
	 */
	static enablePrintingUUIDClass = true;

	/**
	 * Автоматические загрузка и парсинг шаблонов
	 * @english Loading and parsing templates.
	 * @returns {Promise}
	 */
	static async initialize(instance) {
		this.templates = this.templates || {};
		this.autoLoadBind = (
			typeof this.autoLoadBind === 'object' && this.autoLoadBind !== null
			? this.autoLoadBind
			: {}
		);
		const autoLoadBind = this.autoLoadBind;
		let eHtml;
		if (autoLoadBind.srcHTML) {
			const _uuid = String(instance.uuid).replaceAll('-', '_');
			// 1. Получение/загрузка шаблонов
			// @english: Receiving/downloading templates
			if (typeof autoLoadBind.srcHTML === 'object') {
				if (!(autoLoadBind.srcHTML instanceof HTMLElement)) {
					throw new Error('Error! autoLoadBind.srcHTML is not a HTMLElement instance!');
				}
				eHtml = autoLoadBind.srcHTML;
			} else {
				let html;
				if (/^[\s]*</.test(autoLoadBind.srcHTML)) { // В строке обнаружен HTML-контент. @english: HTML content detected in line
					html = autoLoadBind.srcHTML;
				} else { // Иначе значение считается URL'ом в т.ч. относительным. @english: Otherwise, the value is considered a URL, incl. relative
					html = await fetch(autoLoadBind.srcHTML)
						.then((result) => {
							if (result.ok === true) {
								return result.text();
							}
							throw new Error(
								this.name + ': ' + (result.statusText || 'Error')
									+ (result.status ? ' (' + result.status + ')' : '') + (result.url ? ': ' + result.url : '')
							);
						});
				}
				eHtml = document.createDocumentFragment(); // instanceof DocumentFragment
				const cntDiv = document.createElement('DIV');
				cntDiv.innerHTML = html;
				cntDiv.id = _uuid;
				eHtml.appendChild(cntDiv);
			}
			// 2. Парсинг шаблонов
			let defaultTemplateId = null;
			const tmps = eHtml.querySelectorAll('TEMPLATE'); // instanceof HTMLTemplateElement (.content instanceof DocumentFragment)
			for (let i = 0; i < tmps.length; i++) {
				const template = tmps[i];
				const id = template.id || i;
				defaultTemplateId = defaultTemplateId || id;
				this.templates[id] = template;
				template.parentElement.removeChild(template);
			}
			if (eHtml.firstChild && eHtml.firstChild.id === _uuid) {
				eHtml = eHtml.firstChild;
			}
			// 2.1. HTML-элементы вне TEMPLATE-тегов разместим в шаблоне по умолчанию с templateId равным UUID первого экземпляра.
			// @english: HTML elements outside TEMPLATE tags will be placed in the default template with templateId equal to UUID of first instance
			if (eHtml.childElementCount) {
				const template = document.createElement('TEMPLATE');
				for (const child of eHtml.children) {
					template.content.append(child);
				}
				this.templates[instance.uuid] = template;
				defaultTemplateId = defaultTemplateId || instance.uuid;
			}
			// 3. Определяем вложенные шаблоны для циклов (sg-for)
			// TODO: вытащить содержимое элементов с sg-for в templates с ключом равным значению в sg-template, если оно задано, либо сгенерировать uuid. В sg-template, если он не указан, прописать uuid шаблона.
			// 4. Определяем templateId
			autoLoadBind.templateId = autoLoadBind.templateId && String(autoLoadBind.templateId).replace(/^#/, '') || defaultTemplateId;
		}
		// Некоторые проверки. @english: Some checks.
		if (this.multipleInstance && autoLoadBind.viewId) {
			throw new Error(`Error! autoLoadBind.viewId is not allowed for multiple instances!`);
		}
		return true;
	}

	#binderInitialized = false;
	#elementsEvents = [];
	#eventsCounter = 0;
	#propertyElementLinks = {};
	#deferredProperties = new Set();
	//#deferredOnProperties = new Set();
	//#pwrSettled = false;
	//#pwrResolved = false;
	//#pwrRejected = false;
	
	/**
	 * Constructor
	 * @param {object} [properties={}]
	 * @param {object} [options]
	 * @param {object} [thisProperties] - Properties and methods passed to the this context of the created instance
	 */
	/*constructor(properties = {}, options = void 0, thisProperties = void 0) {
		super(properties, options, thisProperties);
	}*/
	
	/**
	 * Called when an instance is created
	 * @see {mixed} [static autoLoadBind.srcHTML] - can be a path to an html file (string), html content (string), a HTMLElement/HTMLTemplateElement (object)
	 * @see {string} [static autoLoadBind.templateId]
	 * @see {string} [static autoLoadBind.viewId] or [static autoLoadBind.containerId]
	 * @see {object} [static templates]
	 * @return {Promise}
	 */
	async initialize() {

		// Сюда приходим после полного выполнения конструктора в SGModel
		// @english: We come here after complete execution of the constructor in SGModel

		this.constructor._initialized = 0;
		if (!this.constructor._pInitialize) {
			this.constructor._pInitialize = this.constructor.initialize(this).then(() => {
				this.constructor._initialized = 1;
			}, () => {
				this.constructor._initialized = -1;
			});
		}

		this._pwr = Promise.withResolvers(); // @private
		const isFirstPWR = !SGModelView._prevPWR;
		if (!isFirstPWR) {
			SGModelView._prevPWR.promise.finally(() => {
				//console.debug('SGModelView->' + this.constructor.name + ' - prevPWR.promise is settled! properties: ' + JSON.stringify(this.data));
				this.constructor._pInitialize.finally(this._pwr.resolve);
			});
		}
		SGModelView._prevPWR = this._pwr;

		// Вывод контента по умолчанию (клонирование шаблона) и связывание с данными.
		// @english: Default content output (template cloning) and data binding.
		this._pwr.promise.then(() => {
			const autoLoadBind = this.constructor.autoLoadBind;
			const containerId = this.options.containerId || autoLoadBind.containerId;
			const viewId = this.options.viewId || autoLoadBind.viewId;
			if (containerId && viewId) {
				throw new Error(`Error in SGModelView->${this.constructor.name}: containerId and viewId are set at the same time. Only one thing is given!`);
			}
			const targetId = containerId || viewId;
			const template = this.constructor.templates[autoLoadBind.templateId];
			if (autoLoadBind.templateId && targetId) {
				const eTarget = document.querySelector(targetId);
				if (eTarget) {
					let eContent;
					if (template) {
						eContent = template.content.cloneNode(true);
					} else {
						eContent = document.createElement('DIV');
						if (this.constructor._initialized !== 1) {
							eContent.innerText = `Еrror occurred while initializing the view of ${this.constructor.name}!`;
						} else {
							eContent.innerText = `Template with autoLoadBind.templateId = "${autoLoadBind.templateId}" not found!`;
						}
					}
					if (viewId) {
						this.eView = eTarget;
						if (this.eView.__SGModelUUID) {
							throw new Error(`Error! The container with id="${viewId}" already binding with other SGModel instance with uuid: "${this.eView.__SGModelUUID}" and class: ${SGModel.__instances[this.eView.__SGModelUUID].constructor.name}!`);
						}
						this.eView.append(eContent);
					} else { // Сохраняем существующий контент для вывода нескольких экземпляров. @english: Preserve existing content to support multiple instances of printing.
						this.eView = document.createElement('SECTION');
						this.eView.append(eContent);
						eTarget.append(this.eView);
					}
					if (this.constructor._initialized === 1) {
						this.bindHTML(this.eView);
					}
				} else {
					throw new Error(`Error! The container with id="${eTarget}" does not exists!`);
				}
			}
			//this.#pwrSettled = true;
			//this.#pwrResolved = true;
			for (const name of this.#deferredProperties) {
				this.#refreshElement(name);	
			}
			return true;
		}, (err) => {
			//this.#pwrRejected = true;
			//this.#pwrSettled = true;
		});

		if (isFirstPWR) {
			this.constructor._pInitialize.then(this._pwr.resolve);
		}
		
		return this._pwr.promise;
	}
	
	/**
	 * Data and view binding (MVVM)
	 * @param {string|HTMLElement} [root] Example "#my_div_id" or HTMLElement object
	 */
	bindHTML(root = void 0) {
		if (document.readyState === 'loading') {
			throw new Error('Error! document.readyState = loading!');
		}
		this.#bindHTML(root);
	}
	
	/**
	 * @private
	 * @returns {Promise}
	 */
	#bindHTML(root = void 0, resolve, reject) {
		if (!this.#binderInitialized) {
			if (typeof document === 'undefined') {
				throw new Error('Error! window.document is undefined!');
			}
			this.onChangeDOMElementValue = this.#onChangeDOMElementValue.bind(this);
			this.#eventsCounter = -1;
			this.#binderInitialized = true;
		} else {
			let name, item;
			for (name in this.#propertyElementLinks) {
				const propertyElementLink = this.#propertyElementLinks[name];
				if (propertyElementLink.type === SGModelView._LINKTYPE_VALUE) {
					propertyElementLink.element.removeEventListener('change', this.onChangeDOMElementValue);
					propertyElementLink.element.removeEventListener('input', this.onChangeDOMElementValue);
				}
				delete this.#propertyElementLinks[name];
			}
			while (item = this.#elementsEvents.pop()) {
				item.element.removeEventListener(item.event, item.callback);
			}
		}
		
		this.eView = (typeof root === 'string' ? document.querySelector(root) : (root ? root : document.body));
		if (!this.eView) {
			throw new Error(`Error in ${this.constructor.name}->bindHTML()! Container "${root}" does not exist!`);
		}
		this.eView.__SGModelUUID = this.uuid;
		if (this.constructor.enablePrintingUUIDClass === true) {
			this.eView.setAttribute('sg-uuid', `${this.uuid}/${this.constructor.name}/${this.__uid}`);
		}
		
		this._reProps = {};
		this._rePropsChecked = {};
		for (let name in this.data) {
			this._reProps[name] = {
				re: [
					new RegExp(`([^\\w\\.\\-])${name}([^\\w\\.\\-])`, 'g'),
					new RegExp(`^()${name}([^\\w\\.\\-])`, 'g'),
					new RegExp(`([^\\w\\.\\-])${name}()$`, 'g'),
					new RegExp(`^()${name}()$`, 'g')
				],
				to: `$1this.data.${name}$2`
			};
			this._rePropsChecked[name] = [
				new RegExp(`[^\\w\\.\\-]this\\.data\\.${name}[^\\w\\.\\-]`, 'g'),
				new RegExp(`^this\\.data\\.${name}[^\\w\\.\\-]`, 'g'),
				new RegExp(`[^\\w\\.\\-]this\\.data\\.${name}$`, 'g'),
				new RegExp(`^this\\.data\\.${name}$`, 'g')
			];
		}
		this._sysThis = ['constructor', 'initialize', 'defaults'];
		this._reThis = {};
		let thisNames = Object.getOwnPropertyNames(this.__proto__);
		for (let i = 0; i < thisNames.length; i++) {
			const name = thisNames[i];
			if (this._sysThis.indexOf(name) === -1 && !/^_/.test(name)) {
				this._reThis[name] = {
					re: [
						new RegExp(`([^\\w\\.\\-])${name}([^\\w\\.\\-])`, 'g'),
						new RegExp(`^()${name}([^\\w\\.\\-])`, 'g'),
						new RegExp(`([^\\w\\.\\-])${name}()$`, 'g'),
						new RegExp(`^()${name}()$`, 'g')
					],
					to: `$1this.${name}$2`
				};
			}
		}
		
		this.#bindElements([this.eView], true);
		this.#refreshAll();
	}
	
	/** @private */
	#bindElements(elements, isRoot = false) {
		for (let e = 0; e < elements.length; e++) {
			const elementDOM = elements[e];
			if (elementDOM.__SGModelUUID && !isRoot || elementDOM.nodeType !== 1) { // Пропускаем вложенные инстансы SGModel-представлений и узлы других типов
				continue;
			}
			
			const sgProperty = elementDOM.getAttribute('sg-property');
			const sgValue = elementDOM.getAttribute('sg-value'); // Now attributes are implemented only for static output (only at initialization) // TODO: dynamic
			const sgType = elementDOM.getAttribute('sg-type');
			const sgFormat = elementDOM.getAttribute('sg-format'); // TODO: to add function parameters
			const sgAttributes = elementDOM.getAttribute('sg-attributes'); // Now attributes are implemented only for static output (only at initialization)
			const sgCSS = elementDOM.getAttribute('sg-css');
			//const sgStyle = element.getAttribute('sg-style'); // TODO
			const sgClick = elementDOM.getAttribute('sg-click');
			//const sgEvents = element.getAttribute('sg-events'); // TODO
			const sgOptions = elementDOM.getAttribute('sg-options'); // for SELECT element
			const sgFor = elementDOM.getAttribute('sg-for');
			const sgTemplate = elementDOM.getAttribute('sg-template');
			
			if (sgProperty && this.has(sgProperty)) {
				this.#regPropertyElementLink(sgProperty, elementDOM, SGModelView._LINKTYPE_VALUE);
				elementDOM._sg_property = sgProperty;
				elementDOM._sg_type = sgType;
				elementDOM._sg_format = this[sgFormat];
				if (sgType !== 'dropdown') {
					if (elementDOM.type) {
						let sEvent = '';
						switch (elementDOM.type) {
							case 'range': sEvent = 'input'; break;
							case 'radio':
							case 'checkbox':
							case 'text':
							case 'textarea':
							case 'button':
							case 'select-one':
							case 'select-multiple':
							case 'date':
							case 'time':
							case 'datetime-local':
								sEvent = 'change'; break;
						}
						if (sEvent) {
							elementDOM.addEventListener(sEvent, this.onChangeDOMElementValue);
						}
					}
				} else {
					const eItems = document.querySelectorAll(`[sg-dropdown=${sgProperty}]`);
					for (let i = 0; i < eItems.length; i++) {
						eItems[i].onclick = this._dropdownItemClick;
					}
					elementDOM.addEventListener('change', this.onChangeDOMElementValue);
				}
			}
			
			// Now attributes are implemented only for static output (only at initialization)
			if (sgAttributes) {
				try {
					const attributes = JSON.parse(sgAttributes.replace(/(\w+):\s([\w]+)(\([^)]*\)){0,1}([,\s]{0,1})/g, '"$1": "$2$3"$4'));
					for (let a in attributes) {
						const value = attributes[a];
						const method = value.replace(/(\w+)(.*)/, '$1');
						const args = Array.from(value.matchAll(/'(.*?)'/g));
						if (typeof this[method] === 'function') {
							elementDOM.setAttribute(a, this[method].apply(this, args.map((o)=>o[1])));
						}
					}
				} catch(err) {
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
					throw err;
				}
			}
			
			if (sgCSS) {
				let _sgCSS = sgCSS;
				for (let name in this._reProps) {
					const re = this._reProps[name].re;
					const len = _sgCSS.length;
					for (let p = 0; p < re.length; p++) {
						_sgCSS = _sgCSS.replace(re[p], this._reProps[name].to);
					}
					if (len !== _sgCSS.length) {
						this.#regPropertyElementLink(name, elementDOM, SGModelView._LINKTYPE_CSS);
					}
				}
				let bProperties = false;
				for (let name in this._rePropsChecked) {
					const re = this._rePropsChecked[name];
					for (let p = 0; p < re.length; p++) {
						if (re[p].test(_sgCSS)) {
							bProperties = true;
							break;
						}
					}
					if (bProperties) break;
				}
				let bFunctions = false;
				for (let name in this._reThis) {
					const re = this._reThis[name].re;
					const len = _sgCSS.length;
					for (let p = 0; p < re.length; p++) {
						_sgCSS = _sgCSS.replace(re[p], this._reThis[name].to);
					}
					if (len !== _sgCSS.length) {
						bFunctions = true;
					}
				}
				try {
					elementDOM._sg_css = (new Function(`return ${_sgCSS}`)).bind(this);
				} catch(err) {
					throw err;
				}
				elementDOM._sg_css_static_classes = [...elementDOM.classList];
				if (!bProperties && bFunctions) {
					this.#regPropertyElementLink(sgProperty, elementDOM, SGModelView._LINKTYPE_CSS);
				}
			}
			
			if (sgClick) {
				let callback = this[sgClick];
				if (typeof callback === 'function') {
					callback = callback.bind(this);
					elementDOM.addEventListener('click', callback);
					const index = this.#eventsCounter++;
					this.#elementsEvents[index] = {
						callback: callback,
						element: elementDOM,
						event: 'click',
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
					console.warn(`Error 834514! options of SELECT element is not a array! Property: ${sgOptions}, constructor: ${this.constructor.name}`);
				}
			}

			if (sgFor && sgTemplate) {
				const template = this.constructor.templates[sgTemplate];
				if (template) {
					this.#regPropertyElementLink(sgFor, elementDOM, SGModelView._LINKTYPE_FORTEMPLATE);
					elementDOM._sg_template = template;
				} else {
					console.warn(`Error 3400193! Template "${sgTemplate}" not found! Property: ${sgOptions}, constructor: ${this.constructor.name}`);
				}
			}
			
			this.#bindElements(elementDOM.childNodes);
		}
	}
	
	#refreshAll() {
		for (let property in this.#propertyElementLinks) {
			this.#refreshElement(property);
		}
	}
	
	/** @private */
	#regPropertyElementLink(property, element, type) {
		let item = this.#propertyElementLinks[property];
		if (!item) {
			item = this.#propertyElementLinks[property] = [];
		}
		if (item.indexOf(element) === -1) {
			item.push({element: element, type: type});
		}
	}
	
	/** @private */
	#refreshElement(property) {
		
		if (!this.#propertyElementLinks[property]) {
			return false;
		}
		
		for (let j = 0; j < this.#propertyElementLinks[property].length; j++) {
			
			const propertyElementLink = this.#propertyElementLinks[property][j];
			
			const elementDOM = propertyElementLink.element;
			if (!elementDOM) return false;
			
			switch (propertyElementLink.type) {
				case SGModelView._LINKTYPE_VALUE: {
				
					const value = this.data[property];

					switch (elementDOM._sg_type) {
						case 'dropdown':
							const eItems = document.querySelectorAll(`[sg-dropdown=${property}]`);
							for (let i = 0; i < eItems.length; i++) {
								const sgValue = eItems[i].getAttribute('sg-option');
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
									case 'radio': case 'checkbox': elementDOM.checked = value; break;
									case 'range': case 'select-one': elementDOM.value = value; break;
									case 'date': elementDOM.value = String(value).replace(/\s.*/, ''); break; // YYYY-MM-DD
									case 'datetime-local': elementDOM.value = String(value).replace(/[+-]\d+$/, ''); break; // YYYY-MM-DD HH:MM:SS
									case 'time': elementDOM.value = value.match(/\d\d:\d\d:\d\d/)?.[0]; break; // YYYY-MM-DD HH:MM:SS+PP
									case 'text': case 'textarea': case 'button':
										const v = (elementDOM._sg_format ? elementDOM._sg_format.call(this, value) : value);
										elementDOM.value = v;
										if (elementDOM.type === 'button') {
											elementDOM.innerText = v;
										}
										break;
									case 'select-multiple': {
										if (!Array.isArray(value)) break;
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
						if (typeof result === 'function') {
							result = result.call(this, property);
						}
						if (!Array.isArray(result)) {
							if (result === '') {
								result = [];
							} else {
								result = result.split(' ');
							}
						}
						for (let i = 0; i < result.length; i++) {
							elementDOM.classList.add(result[i]);
						}
					}
					break;
				}
				case SGModelView._LINKTYPE_FORTEMPLATE: {
					const elementDOM = propertyElementLink.element;
					elementDOM.innerHTML = '';
					for (const value of this.data[property]) {
						const eContent = elementDOM._sg_template.content.cloneNode(true);
						this.#scanTemplateContentAndSetValues(eContent, value);
						elementDOM.append(eContent);
					}
					break;
				}
			}
		}
		return true;
	}

  /** @private */
	#scanTemplateContentAndSetValues(root, value) {
		if (root instanceof HTMLElement) {
			const sgValue = root.getAttribute('sg-value');
			if (sgValue === '$value') {
				root.innerHTML = value;
			}
		}
		for (const element of root.childNodes) {
			if (element.nodeType === 1) {
				this.#scanTemplateContentAndSetValues(element, value);
			}
		}		
	}
	
	/** @private */
	#onChangeDOMElementValue(event) {
		const elem = event.currentTarget;
		switch (elem.type) {
			case 'checkbox':
				this.set(elem._sg_property, elem.checked, void 0, void 0, event, elem);
				break;
			case 'radio':
				const form = this._findParentForm(elem);
				const radioButtons = form.querySelectorAll(`input[name=${elem.name}]`);
				for (let i = 0; i < radioButtons.length; i++) {
					const _elem = radioButtons[i];
					if (_elem.getAttribute('sg-property') !== elem.getAttribute('sg-property') && _elem._sg_property) {
						this.set(_elem._sg_property, _elem.checked, void 0, void 0, event, _elem);
					}
				}
				this.set(elem._sg_property, elem.checked, void 0, void 0, event, elem);
				break;
			case 'text': case 'textarea': case 'date': case 'datetime-local': case 'button': case 'select-one':
				this.set(elem._sg_property, elem.value, void 0, void 0, event, elem);
				break;
			case 'range':
				this.set(elem._sg_property, elem.value, void 0, void 0, event, elem); break;
			case 'select-multiple':
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
		const button = this.parentNode.parentNode.querySelector('button');
		button.value = this.getAttribute('sg-option');
		button.innerHTML = this.innerHTML;
		button.dispatchEvent(new Event('change'));
	}
	
	/** @private */
	_findParentForm(elem) {
		const parent = elem.parentNode;
		if (parent) {
			if (parent.tagName === 'FORM') {
				return parent;
			} else {
				return this._findParentForm(parent);
			}
		} else {
			return document.body;
		}
	}

	/**
	 * Overriding the **SGModel->set** method
	 * @override
	 */
	set(name) {
		return this.#sarc(name, super.set.apply(this, arguments));
	}

	/**
	 * Overriding the **SGModel->addTo** method
	 * @override
	 */
	addTo(name) {
		return this.#sarc(name, super.addTo.apply(this, arguments));
	}

	/**
	 * Overriding the **SGModel->removeFrom** method
	 * @override
	 */
	removeFrom(name) {
		return this.#sarc(name, super.removeFrom.apply(this, arguments));
	}

	/**
	 * Overriding the **SGModel->clear** method
	 * @override
	 */
	clear(name) {
		return this.#sarc(name, super.clear.apply(this, arguments));
	}

	/**
	 * @private
	 * @param {string} name 
	 * @param {boolean|Promise} changed 
	 * @returns {boolean}
	 */
	#sarc(name, changed) {
		if (changed) { // TODO: Promise for autoSave=true !!!
			if (this.#binderInitialized) {
				this.#refreshElement(name);
			} else {
				this.#deferredProperties.add(name);
			}
		}
		return changed;
	}

	/**
	 * Overriding the **SGModel->on** method
	 */
	on(name, func, context = void 0, data = void 0, flags = 0) {
		if (this.#deferredProperties.has(name)) {
			flags = flags | SGModel.FLAG_IMMEDIATELY;
		}
		return super.on.call(this, name, func, context, data, flags);
	}
}

SGModelView._LINKTYPE_VALUE = 1;
SGModelView._LINKTYPE_CSS = 2;
SGModelView._LINKTYPE_FORTEMPLATE = 3;

/**
 * Для вывода экземпляров представлений всех классов, унаследованных от SGModelView, в том порядке, в котором вызывались конструкторы. To add content and resolve the result initialize() in the order in which the instance constructors of all classes inherited from SGModel were called
 * @private
 */
SGModelView._prevPWR = null;

if (typeof globalThis === 'object') globalThis.SGModelView = SGModelView;
else if (typeof exports === 'object' && typeof module === 'object') module.exports = SGModelView;
else if (typeof define === 'function' && define.amd) define('SGModelView', [], () => SGModelView);
else if (typeof exports === 'object') exports['SGModelView'] = SGModelView;
else if (typeof window === 'object' && window.document) window['SGModelView'] = SGModelView;
else this['SGModelView'] = SGModelView;

export default SGModelView;
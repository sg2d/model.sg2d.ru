"use strict";

import SGModel from './sg-model.js';

/**
 * SGModelView - Микрофреймворк для создания MVVM-приложений. Надстройка над SGModel которая позволяет связать данные в инстансе с визуальными элементами HTML-документа (MVVM паттерн).
 * @english Microframework for creating MVVM applications. An add-on for SGModel that allows you to associate data in an instance with visual elements of an HTML document (MVVM pattern).
 * @version 1.0.10
 * @requires ES2024+ (ES15+)
 * @link https://github.com/sg2d/model.sg2d.ru
 * @license SGModelView may be freely distributed under the MIT license
 * @copyright 2019-2025 © Калашников Илья (https://model.sg2d.ru)
 * @extends SGModel
 */
class SGModelView extends SGModel {

	/*static version = SGModel.version; // @see SGModel.version*/

	// @private
	static #ATTRIBUTES = {};

	/**
	 * Переопределить префикс атрибутов для SGModelView.
	 * Можно переопределить в основном модуле вашего приложения (например, в точке входа, таком как main.js или app.js), после этого все остальные модули, которые импортируют SGModelView, будут видеть и использовать ваш префикс
	 * @param {string} newPrefix 
	 */
	static setAttributesPrefix(newPrefix) {
		if (!newPrefix) newPrefix = 'sg-';
		if (newPrefix !== 'sg-') {
			console.debug(`SGModelView.#ATTRIBUTES overrided with prefix "${newPrefix}"!`);
		}
		Object.keys(SGModelView.#ATTRIBUTES).forEach(propName => delete SGModelView.#ATTRIBUTES[propName]);
		String('model,uuid,property,value,type,format,attributes,css,style,click,events,dropdown,options,option,for,item-variables,template,item')
			.split(',')
			.forEach((name) => {
				const ucName = `SG_${name.replaceAll('-', '_').toUpperCase()}`;
				SGModelView.#ATTRIBUTES[ucName] = `${newPrefix}${name}`;
				SGModelView.#ATTRIBUTES[`${newPrefix}${name}`] = ucName; // use in this.#scanTemplateContentAndSetValues()
			});
	}

	/**
	 * Включить вывод UUID, имени класса и __uid в атрибуте sg-uuid корневого DOM-элемента представления
	 * @english Enable output of UUID, class name and __uid in the sg-uuid attribute of the root DOM element of view.
	 */
	static enablePrintingUUIDClass = true;

	/**
	 * #prevPWR - для вывода экземпляров представлений всех классов, унаследованных от SGModelView, в том порядке, в котором вызывались конструкторы. To add content and resolve the result initialize() in the order in which the instance constructors of all classes inherited from SGModel were called
	 * @private
	 */
	static #prevPWR = null;

	/**
	 * @private
	 * @param {string} property 
	 * @param {string} keyOrIndex 
	 * @param {mixed} valueOrItem 
	 * @param {number} type 
	 * @returns {string}
	 */
	#getItemHash(property, keyOrIndex, valueOrItem, type = void 0) {
		type = type || this.constructor.typeProperties[property];
		if (type === SGModel.TYPE_ARRAY || type === SGModel.TYPE_OBJECT || type === SGModel.TYPE_SET || type === SGModel.TYPE_MAP) {
			const key = (valueOrItem?.id || valueOrItem?.uuid || valueOrItem?.code) || keyOrIndex;
			const hash = SGModelView.sha256trimL(`${this.uuid}:${property}:${key}:${JSON.stringify(valueOrItem)}`);
			return `${hash}:${key}`;
		} else if (type === SGModel.TYPE_ARRAY_NUMBERS || type === SGModel.TYPE_OBJECT_NUMBERS) {
			const hash = SGModelView.sha256trimL(`${this.uuid}:${property}:${keyOrIndex}`);
			return `${hash}:${keyOrIndex}`;
		}
		throw new Error(`Error in this.#getItemHash()! The property "${property}" does not support data type "${SGModel.TYPES[type]}"!`);
	}

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
			// 1. Получение/загрузка шаблонов. @english: Receiving/downloading templates
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
			// 2.1. HTML-элементы (кроме стилей и скриптов) вне TEMPLATE-тегов разместим в шаблоне по умолчанию с templateId равным UUID первого экземпляра.
			// @english: HTML elements (except styles and scripts) outside TEMPLATE tags will be placed in the default template with templateId equal to UUID of first instance
			if (eHtml.childElementCount) {
				const template = document.createElement('TEMPLATE');
				for (const child of eHtml.children) {
					if (child.tagName === 'STYLE' || child.tagName === 'SCRIPT') {
						document.body.append(child);
					} else {
						template.content.append(child);
					}
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
			this.constructor._pInitialize = this.constructor.initialize(this).then((result) => { // eslint-disable-line no-unused-vars
				this.constructor._initialized = 1;
				return result;
			}, (err) => { // eslint-disable-line no-unused-vars
				this.constructor._initialized = -1;
				return err;
			});
		}

		this._pwr = Promise.withResolvers(); // @private
		const isFirstPWR = !SGModelView.#prevPWR;
		if (!isFirstPWR) {
			SGModelView.#prevPWR.promise.finally(() => {
				this.constructor._pInitialize.finally(this._pwr.resolve);
			});
		}
		SGModelView.#prevPWR = this._pwr;

		// Вывод контента по умолчанию (клонирование шаблона) и связывание с данными.
		// @english: Default content output (template cloning) and data binding.
		this._pwr.promise.then((result) => { // eslint-disable-line no-unused-vars
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
					let requiredSection = false;
					if (template) {
						eContent = template.content.cloneNode(true);
						if (!(requiredSection = this.#requiredSection(eContent))) {
							this.eView = eContent.firstElementChild;
						}
					} else {
						eContent = document.createElement('DIV');
						if (this.constructor._initialized === 1) {
							eContent.innerText = `Error! Template with autoLoadBind.templateId = "${autoLoadBind.templateId}" not found!`;
						} else {
							eContent.innerText = `Еrror occurred while initializing the view of ${this.constructor.name}!`;
						}
					}
					if (viewId) {
						this.eView = eTarget;
						if (this.eView.__SGModelUUID) {
							throw new Error(`Error! The container with id="${viewId}" already binding with other SGModel instance with uuid: "${this.eView.__SGModelUUID}" and class: ${SGModel.__instances[this.eView.__SGModelUUID].constructor.name}!`);
						}
						this.eView.append(eContent);
					} else { // Сохраняем существующий контент для вывода нескольких экземпляров. @english: Preserve existing content to support multiple instances of printing.
						if (requiredSection) {
							this.eView = document.createElement('SECTION');
							this.eView.append(eContent);
							eTarget.append(this.eView);
						} else {
							eTarget.append(eContent);
						}
					}
					if (this.constructor._initialized === 1) {
						this.bindHTML(this.eView);
					} else {
						console.error(`Binding was not completed because initialization failed!`);
					}
				} else {
					throw new Error(`Error! The container with id="${eTarget}" does not exists!`);
				}
			}
			// Для варианта, когда используется атрибут sg-model без template-шаблонов
			if (!autoLoadBind.viewId && this.constructor.singleInstance) {
				const eView = this.#findElementBySGClass(this.constructor.name);
				if (eView) {
					this.eView = eView;
					if (this.constructor._initialized === 1) {
						this.bindHTML(this.eView);
					} else {
						console.error(`Binding was not completed because initialization failed!`);
					}
				}
			}
			for (const name of this.#deferredProperties) {
				if (this.#propertyElementLinks[name]) {
					this.#refreshElement(name);
				}
			}
			return true;
		});

		if (isFirstPWR) {
			this.constructor._pInitialize.then(this._pwr.resolve);
		}
		
		return this._pwr.promise;
	}

	/**
	 * Найти элемент с определенным значением атрибута sg-model. Элементы (и вложенные также) с установленным __SGModelUUID пропускаются!
	 * @private
	 * @param {string} className 
	 * @param {mixed} [root]
	 */
	#findElementBySGClass(className, root = void 0) {
		if (!root) {
			if (typeof root === 'string') {
				root = document.querySelector(root);
				if (!root) return null;
			} else {
				root = document.body;
			}
			if (!root.__SGModelUUID && root.getAttribute(SGModelView.#ATTRIBUTES.SG_MODEL) === className) { // @aos
				return root;
			}
		} else if (!(root instanceof HTMLElement)) {
			throw new Error(`Error in #findElementBySGClass()! Incorrect type of parameter "root"!`);
		}
		for (let node of root.childNodes) {
			if (node.nodeType !== Node.ELEMENT_NODE || node.__SGModelUUID) continue;
			if (node.getAttribute(SGModelView.#ATTRIBUTES.SG_MODEL) === className) {
				return node;
			}
			if (node = this.#findElementBySGClass(className, node)) {
				return node;
			}
		}
		return null;
	}

	/**
	 * Проверить - требуется ли тег SECTION для вставляемого содержимого.
	 * @private
	 * @param {HTMLElement} eRoot 
	 * @returns {boolean}
	 */
	#requiredSection(eRoot) {
		let q = 0;
		for (const node of eRoot.childNodes) {
			if (
				(node.nodeType === Node.TEXT_NODE && node.data.replace(/\s*/g, '')) ||
				(node.nodeType === Node.ELEMENT_NODE) ||
				(node.nodeType === Node.COMMENT_NODE)
			) {
				q++;
			}
			if (q > 1) break;
		}
		return (q > 1);
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
	 */
	#bindHTML(root = void 0) {
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
			this.eView.setAttribute(SGModelView.#ATTRIBUTES.SG_UUID, `${this.uuid}:${this.constructor.name}:${this.__uid}`);
		}
		
		this._reProps = {};
		this._rePropsChecked = {};
		for (let name in this.data) {
			this._reProps[name] = {
				re: [
					new RegExp(`([^\\w\\.\\-])${name}([^\\w\\.\\-])`, 'g'),
					new RegExp(`^()${name}([^\\w\\-])`, 'g'), //new RegExp(`^()${name}([^\\w\\.\\-])`, 'g'),
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
						new RegExp(`^()${name}([^\\w\\-])`, 'g'), //new RegExp(`^()${name}([^\\w\\.\\-])`, 'g'),
						new RegExp(`([^\\w\\.\\-])${name}()$`, 'g'),
						new RegExp(`^()${name}()$`, 'g')
					],
					to: `$1this.${name}$2`
				};
			}
		}
		
		this.#bindElements([this.eView], true);

		for (const name in this.#propertyElementLinks) {
			if (!this.#deferredProperties.has(name) && this.#propertyElementLinks[name]) { // отложенные отрисовываются отдельно, поэтому не имеет смысла их отрисовывать ещё раз
				this.#refreshElement(name);
			}
		}
	}
	
	/** @private */
	#bindElements(elements, isRoot = false) {
		for (let e = 0; e < elements.length; e++) {
			const elementDOM = elements[e];
			if (elementDOM.__SGModelUUID && !isRoot || elementDOM.nodeType !== Node.ELEMENT_NODE) { // Пропускаем вложенные инстансы SGModel-представлений и узлы других типов
				continue;
			}
			
			const sgProperty = elementDOM.getAttribute(SGModelView.#ATTRIBUTES.SG_PROPERTY);
			const sgValue = elementDOM.getAttribute(SGModelView.#ATTRIBUTES.SG_VALUE); // Now attributes are implemented only for static output (only at initialization)
			const sgType = elementDOM.getAttribute(SGModelView.#ATTRIBUTES.SG_TYPE);
			const sgFormat = elementDOM.getAttribute(SGModelView.#ATTRIBUTES.SG_FORMAT); // TODO: to add function parameters
			const sgAttributes = elementDOM.getAttribute(SGModelView.#ATTRIBUTES.SG_ATTRIBUTES); // Now attributes are implemented only for static output (only at initialization)
			const sgCSS = elementDOM.getAttribute(SGModelView.#ATTRIBUTES.SG_CSS);
			const sgModel = elementDOM.getAttribute(SGModelView.#ATTRIBUTES.SG_MODEL); // Автоматическое связывание контента с данными (альтернативный способ - использовать static autoLoadBind.viewId)
			const sgClick = elementDOM.getAttribute(SGModelView.#ATTRIBUTES.SG_CLICK);
			const sgOptions = elementDOM.getAttribute(SGModelView.#ATTRIBUTES.SG_OPTIONS); // for SELECT element
			const sgFor = elementDOM.getAttribute(SGModelView.#ATTRIBUTES.SG_FOR);
			const sgItemVariables = elementDOM.getAttribute(SGModelView.#ATTRIBUTES.SG_ITEM_VARIABLES);
			const sgTemplate = elementDOM.getAttribute(SGModelView.#ATTRIBUTES.SG_TEMPLATE);
			
			if (!isRoot && sgModel) {
				throw new Error(`Error in this.#bindElements()! An attribute "sg-model" was found inside the view, which is not allowed here!`);
			}
			
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
					const eItems = document.querySelectorAll(`[${SGModelView.#ATTRIBUTES.SG_DROPDOWN}=${sgProperty}]`);
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
						const valueOrProperty = attributes[a];
						const method = valueOrProperty.replace(/(\w+)(.*)/, '$1');
						if (typeof this[method] === 'function') {
							const args = Array.from(valueOrProperty.matchAll(/'(.*?)'/g));
							elementDOM.setAttribute(a, this[method].apply(this, args.map((o)=>o[1])));
						} else if (Object.hasOwn(this.data, valueOrProperty)) {
							elementDOM.setAttribute(a, this.data[valueOrProperty]);
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
					const reProps = this._reProps[name];
					const aRE = reProps.re;
					const len = _sgCSS.length;
					for (const re of aRE) {
						_sgCSS = _sgCSS.replace(re, reProps.to);
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
					console.warn(`Error in this.#bindElements()! options of SELECT element is not a array! Property: ${sgOptions}, constructor: ${this.constructor.name}`);
				}
			}

			if (sgFor && sgTemplate) {
				const template = this.constructor.templates[sgTemplate];
				if (template) {
					this.#regPropertyElementLink(sgFor, elementDOM, SGModelView._LINKTYPE_FORTEMPLATE);
					elementDOM._sg_template = template;
					if (sgItemVariables) {
						elementDOM._sg_item_variables = SGModelView.parseItemVariablesLine(sgItemVariables);
					}
				} else {
					console.warn(`Error in this.#bindElements()! Template "${sgTemplate}" not found! Property: ${sgOptions}, constructor: ${this.constructor.name}`);
				}
			}
			
			this.#bindElements(elementDOM.childNodes);
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
	#printItem(property, elementDOM, collection, keyOrIndex, valueOrItem, requiredSection) {
		const eContent = elementDOM._sg_template.content.cloneNode(true);
		let eItem;
		if (requiredSection) {
			eItem = document.createElement('SECTION');
			eItem.append(eContent);
			elementDOM.append(eItem);
		} else {
			eItem = eContent.firstElementChild;
			elementDOM.append(eContent);
		}
		const sgItemValue = this.#getItemHash(property, keyOrIndex, valueOrItem);
		eItem.setAttribute(SGModelView.#ATTRIBUTES.SG_ITEM, sgItemValue);
		this.#scanTemplateContentAndSetValues(eItem, valueOrItem, elementDOM._sg_item_variables);
	}
	
	/** @private */
	#refreshElement(property) {
		for (let j = 0; j < this.#propertyElementLinks[property].length; j++) {
			const propertyElementLink = this.#propertyElementLinks[property][j];
			const elementDOM = propertyElementLink.element;
			if (!elementDOM) return false;
			switch (propertyElementLink.type) {
				case SGModelView._LINKTYPE_VALUE: {
				
					const value = this.data[property];

					switch (elementDOM._sg_type) {
						case 'dropdown':
							const eItems = document.querySelectorAll(`[${SGModelView.#ATTRIBUTES.SG_DROPDOWN}=${property}]`);
							for (let i = 0; i < eItems.length; i++) {
								const sgValue = eItems[i].getAttribute(SGModelView.#ATTRIBUTES.SG_OPTION);
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
					const requiredSection = this.#requiredSection(elementDOM._sg_template.content);
					elementDOM.innerHTML = '';
					const collection = this.data[property];
					const type = this.constructor.typeProperties[property];
					let keyOrIndex = 0;
					if (type === SGModel.TYPE_SET) {
						for (const valueOrItem of collection) {
							this.#printItem(property, elementDOM, collection, keyOrIndex++, valueOrItem, requiredSection);
						}
					} else if (type === SGModel.TYPE_ARRAY || type === SGModel.TYPE_ARRAY_NUMBERS) {
						for (keyOrIndex = 0; keyOrIndex < collection.length; keyOrIndex++) {
							this.#printItem(property, elementDOM, collection, keyOrIndex, collection[keyOrIndex], requiredSection);
						}
					} else if (type === SGModel.TYPE_OBJECT || type === SGModel.TYPE_OBJECT_NUMBERS) {
						for (keyOrIndex in collection) {
							this.#printItem(property, elementDOM, collection, keyOrIndex, collection[keyOrIndex], requiredSection);
						}
					} else if (type === SGModel.TYPE_MAP) {
						for (const item of collection) {
							this.#printItem(property, elementDOM, collection, item[0], item[1], requiredSection);
						}
					} else {
						throw new Error(`Error in this.#refreshElement()! Invalid property type!`);
					}
					break;
				}
			}
		}
		return true;
	}

	// @aos
	static #objWithValue = {
		value: null
	};

	/**
	 * @private
	 * @param {DOMElement} element
	 * @param {mixed} valueOrItem
	 */
	#scanTemplateContentAndSetValues(element, valueOrItem, sgItemVariables) {

		// @aos
		if (!(valueOrItem instanceof Object)) {
			SGModelView.#objWithValue.value = valueOrItem;
			valueOrItem = SGModelView.#objWithValue;
		}
		
		if (element instanceof HTMLElement) {
			
			// Собираем все атрибуты, разделяя их на обычные и sg-атрибуты (в обычных атрибутах для доступа к субсвойству необходимо добавлять префикс "$")
			const sgAttrs = {};
			for (let i = 0; i < element.attributes.length; i++) {
				const attr = element.attributes[i];
				if (SGModelView.#ATTRIBUTES[attr.name]) { // Example: SGModelView.#ATTRIBUTES["sg-value"]="SG_VALUE"
					sgAttrs[attr.name] = String(attr.value).trim();
				} else {
					for (let subProperty in valueOrItem) {
						attr.value = attr.value.replaceAll(`$${subProperty}`, valueOrItem[subProperty]);
					}
				}
				if (sgItemVariables) {
					for (let subProperty in sgItemVariables) {
						attr.value = attr.value.replaceAll(`$${subProperty}`, sgItemVariables[subProperty]);
					}
				}
			}

			let attrValue, value;

			attrValue = String(sgAttrs[SGModelView.#ATTRIBUTES.SG_PROPERTY] || '');
			if (attrValue) {
				value = valueOrItem[attrValue];
				switch (element.tagName) {
					case 'INPUT':
						if (element.type === 'checkbox' || element.type === 'radio') {
							element.checked = value;
						} else {
							element.value = value; // TODO: sg-format
						}
						break;
					case 'SELECT': case 'TEXTAREA': case 'BUTTON':
						element.value = value; // TODO: sg-format
						break;
					default:
						element.innerHTML = value; // TODO: sg-format
				}
			}

			attrValue = String(sgAttrs[SGModelView.#ATTRIBUTES.SG_VALUE] || '');
			if (attrValue) {
				element.innerHTML = valueOrItem[attrValue]; // TODO: sg-format
			}

			//TODO: attrValue = String(sgAttrs[SGModelView.#ATTRIBUTES.SG_CSS] || '').slice(1);
		}
		for (const childNode of element.childNodes) {
			if (childNode.nodeType === Node.ELEMENT_NODE) {
				this.#scanTemplateContentAndSetValues(childNode, valueOrItem, sgItemVariables);
			} else if (childNode.nodeType === Node.TEXT_NODE) {
				if (childNode.nodeValue.includes('$value')) {
					childNode.textContent = childNode.textContent.replaceAll('$value', valueOrItem.value);
				}
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
			case 'text': case 'textarea': case 'date': case 'time': case 'datetime-local': case 'button': case 'select-one':
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
	 * Преобразует текстовое представление объекта из атрибита в Javascript-объект.
	 * Пример sg-атрибута со значениями: sg-item-variables="{ tagClass: 'text-bg-primary', tagStyle: 'background-color: green', x: -123.45, y: 400, description: 'Some text3...' }"
	 * @ai ChatGPT
	 * @param {string} line 
	 * @returns {object}
	 */
	static parseItemVariablesLine(line) {
		const result = {};
		const content = line.trim().slice(1, -1); // Убираем { и }
		let pairs = content.split(/,(?![^\[]*\]|[^\{]*\})/); // Разбиваем по запятым, игнорируя вложенные структуры
		pairs.forEach(pair => {
			let [key, value] = pair.split(/:(.+)/).map(s => s.trim()); // Разделяем по первому двоеточию
			key = key.replace(/^"|"$/g, '').replace(/^'|'$/g, ''); // Убираем кавычки у ключа
			if (value.startsWith("'") && value.endsWith("'")) {
				value = value.slice(1, -1); // Убираем одинарные кавычки у строк
			} else if (!isNaN(value)) {
				value = Number(value); // Преобразуем числа
			} else if (value === 'true' || value === 'false') {
				value = value === 'true'; // Преобразуем boolean
			}
			result[key] = value;
		});
		return result;
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

	/** @private */
	#getForItemCalc(result, sgItemValue, keyOrIndex, valueOrItem) {
		const hash = this.#getItemHash(result.property, keyOrIndex, valueOrItem);
		if (sgItemValue === hash) {
			if (valueOrItem instanceof Object) {
				result.item = valueOrItem;
			} else {
				result.value = valueOrItem;
			}
			return true;
		}
		return false;
	}

	/**
	 * Получить данные элемента/записи коллекции
	 * @param {Event|HTMLElement} eventOrElement
	 * @returns {object} Вернёт объект: { key {string}, value {mixed}, item {mixed}, collection, property {string}, type {SGModel.TYPE_%}, $item {HTMLElement}, $control {HTMLElement}, hash {string} }, где:
	 *	key - либо индекс элемента для массивов/Set-коллекции, либо имя свойства объекта или ключа элемента Map-коллекции
	 *	value - значение элемента коллекции
	 *	item - запись коллекции (для массивов или Set-коллекции равно **value**)
	 *	collection - сама коллекция
	 *	property - имя свойства в атрибуте sg-for
	 *	type - тип данных (SGModel.TYPE_ARRAY|SGModel.TYPE_ARRAY_NUMBERS|SGModel.TYPE_OBJECT|SGModel.TYPE_OBJECT_NUMBERS|SGModel.TYPE_SET|SGModel.TYPE_MAP)	
	 *	$item - корневой DOM-элемент записи
	 *	$control - DOM-элемент, на который нажал пользователь, например, BUTTON
	 *	hash - хэш записи (ключа)
	 */
	getForItem(eventOrElement) {
		const $control = (eventOrElement instanceof Event ? eventOrElement.target : eventOrElement);
		eventOrElement = $control;
		if ($control instanceof HTMLElement) {
			while (eventOrElement) {
				if (eventOrElement.__SGModelUUID) {
					return {};
				}
				const sgItemValue = eventOrElement.getAttribute(SGModelView.#ATTRIBUTES.SG_ITEM);
				if (sgItemValue) {
					const [hash, key] = String(sgItemValue).split(':');
					// Формируем объект. По стандарту порядок выдачи свойств в цикле for..in не определён, но некоторое соглашение об этом, всё же, есть. Соглашение говорит, что если имя свойства – нечисловая строка, то такие ключи всегда перебираются в том же порядке, в каком присваивались. Так получилось по историческим причинам и изменить это сложно: поломается много готового кода.
					const result = {
						key,
						value: null,
						item: null,
						collection: null,
						property: null,
						type: null,
						$item: eventOrElement,
						$control,
						hash,
					};
					result.property = eventOrElement.parentElement.getAttribute(SGModelView.#ATTRIBUTES.SG_FOR);
					result.collection = this.data[result.property];
					result.type = this.constructor.typeProperties[result.property];
					let keyOrIndex = 0;
					if (result.type === SGModel.TYPE_SET) {
						for (const valueOrItem of result.collection) {
							if (this.#getForItemCalc(
								result,
								sgItemValue,
								keyOrIndex++,
								valueOrItem,
							)) {
								break;
							}
						}
					} else if (result.type === SGModel.TYPE_ARRAY || result.type === SGModel.TYPE_ARRAY_NUMBERS) {
						for (keyOrIndex = 0; keyOrIndex < result.collection.length; keyOrIndex++) {
							if (this.#getForItemCalc(
								result,
								sgItemValue,
								keyOrIndex,
								result.collection[keyOrIndex],
							)) {
								if (result.type === SGModel.TYPE_ARRAY_NUMBERS || result.item?.id) {
									result.key = Number(result.key);
								}
								break;
							}
						}
					} else if (result.type === SGModel.TYPE_OBJECT || result.type === SGModel.TYPE_OBJECT_NUMBERS) {
						for (keyOrIndex in result.collection) {
							if (this.#getForItemCalc(
								result,
								sgItemValue,
								keyOrIndex,
								result.collection[keyOrIndex],
							)) {
								break;
							}
						}
					} else if (result.type === SGModel.TYPE_MAP) {
						for (const [keyOrIndex, valueOrItem] of result.collection) {
							if (this.#getForItemCalc(
								result,
								sgItemValue,
								keyOrIndex,
								valueOrItem,
							)) {
								break;
							}
						}
					} else {
						throw new Error(`Error in this.getForItem()! Invalid property type!`);
					}
					return result;
				}
				eventOrElement = eventOrElement.parentElement;
			}
		}
		throw new Error(`Error in this.getForItem()! Invalid parameter "eventOrElement"!`);
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
				if (this.#propertyElementLinks[name]) {
					this.#refreshElement(name);
				}
			} else {
				this.#deferredProperties.add(name);
			}
		}
		return changed;
	}

	/**
	 * Overriding the **SGModel->on()** method
	 */
	on(name, func, context = void 0, data = void 0, flags = 0) {
		if (this.#deferredProperties.has(name)) {
			flags = flags | SGModel.FLAG_IMMEDIATELY;
		}
		return super.on.call(this, name, func, context, data, flags);
	}

	/**
	 * Overriding the **SGModel->trigger()** method
	 */
	 trigger(name, value = void 0, flags = 0) {
		super.trigger.call(this, name, value, flags);
		this.#sarc(name, true);
	}

	/**
	 * Overriding the **SGModel->clearProperty()** method
	 */
	clearProperty(name, value = void 0, flags = 0) {
		super.clearProperty.call(this, name, value, flags);
		this.#sarc(name, true);
	}
}

SGModelView._LINKTYPE_VALUE = 1;
SGModelView._LINKTYPE_CSS = 2;
SGModelView._LINKTYPE_FORTEMPLATE = 3;

/**
 * SGModelView.sha256 - Хеширование данных
 * [js-sha256]{@link https://github.com/emn178/js-sha256}
 * @version 0.11.0
 * @author Chen, Yi-Cyuan [emn178@gmail.com]
 * @copyright Chen, Yi-Cyuan 2014-2024
 * @license MIT
 * @minify https://minify-js.com
 * @notes Удалёны: код для sha224, определение root, экспорты, код использующий Node.js
 */
SGModelView._sha256 = function(){"use strict";var t="input is invalid type",h=("undefined"!=typeof ArrayBuffer),i="0123456789abcdef".split(""),
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
SGModelView.sha256 = SGModelView._sha256.sha256;

console.assert(SGModelView.sha256('test') === '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', 'Test with SGModelView.sha256("test") failed!');

SGModelView._HASHLEN = 16;

/**
 * Получить первые N шестнадцатеричных цифер хеша
 * @param {string} line 
 * @param {number} [len=SGModelView._HASHLEN]
 * @returns {string}
 */
SGModelView.sha256trimL = (line, len = SGModelView._HASHLEN) => {
	return SGModelView.sha256(line).substring(0, len);
};

SGModelView.setAttributesPrefix();

if (SGModel.isNode) {
	module.exports = SGModelView;
} else if (SGModel.isBrowser) {
	window['SGModel'] = SGModelView;
}

export default SGModelView;
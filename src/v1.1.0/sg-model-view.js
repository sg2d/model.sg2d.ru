"use strict";

import SGModel from './sg-model.js';

/**
 * SGModelView - Микрофреймворк для создания MVVM-приложений. Надстройка над SGModel которая позволяет связать данные в инстансе с визуальными элементами HTML-документа (MVVM паттерн).
 * @english Microframework for creating MVVM applications. An add-on for SGModel that allows you to associate data in an instance with visual elements of an HTML document (MVVM pattern).
 * @version 1.1.0
 * @requires ES2024+ (ES15+)
 * @link https://github.com/sg2d/model.sg2d.ru
 * @license SGModelView may be freely distributed under the MIT license
 * @copyright 2019-2025 © Калашников Илья (https://model.sg2d.ru)
 * @extends SGModel
 */
class SGModelView extends SGModel {

	/*static version = SGModel.version; // @see SGModel.version*/

	static #ATTRIBUTES = {};

	/**
	 * Имя ключа объекта в каждом DOM-элементе для служебного использования объекта фреймворком
	 */
	static #sgPrefixInNode = '__sg';

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
				SGModelView.#ATTRIBUTES[`${newPrefix}${name}`] = ucName; // use in this.#scanItemContentAndSetValues()
			});
	}

	/**
	 * Включить вывод UUID, имени класса и __uid в атрибуте sg-uuid корневого DOM-элемента представления
	 * @english Enable output of UUID, class name and __uid in the sg-uuid attribute of the root DOM element of view.
	 */
	static enablePrintingUUIDClass = true;

	/**
	 * Переменная создаётся для каждого класа-потомка (this.constructor.initialized)
	 * @type {boolean}
	 * @readonly
	 */
	/*static initialized = false;*/

	/**
	 * Данные singleton-экземляра (по умолчанию не задано)
	 * @public
	 * @overridden
	 * @type {Proxy}
	 */
	/*static data;*/

	/**
	 * Для вывода экземпляров представлений всех классов, унаследованных от SGModelView, в том порядке, в котором вызывались конструкторы.
	 * @english To add content and resolve the result initialize() in the order in which the instance constructors of all classes inherited from SGModel were called
	 */
	static #prevPWR = null;

	static #LINKTYPE_VALUE = 1;
	static #LINKTYPE_CSS = 2;
	static #LINKTYPE_FORTEMPLATE = 3;

	#binderInitialized = false;
	#elementsEvents = [];
	#eventsCounter = 0;
	#propertyElementLinks = {};
	#prrSeqConstructor = Promise.withResolvers(); // Промис, обеспечивающий нужную последовательность отрисовки вьюхи согласно порядку вызова конструктора этой вьюхи относительно всех вызовов конструкторов SGModelView
	#deferredProperties = new Set();
	#reProps = {};
	#rePropsChecked = {};
	#sysThis = {};
	#reThis = {};
	
	/**
	 * Автоматические загрузка и парсинг шаблонов
	 * @english Loading and parsing templates.
	 * @returns {Promise}
	 */
	static async initialize(instance) {
		this.templates = this.templates || {};
		this.autoLoadBind = (
			typeof this.autoLoadBind === 'object' && this.autoLoadBind !== null ? this.autoLoadBind : {}
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
			// 2.1. Собираем все TEMPLATE, даже те, которые не на первом уровне вложенности
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
			// 2.2. HTML-элементы (кроме стилей и скриптов) вне TEMPLATE-тегов разместим в шаблоне по умолчанию с templateId равным UUID первого экземпляра.
			// @english: HTML elements (except styles and scripts) outside TEMPLATE tags will be placed in the default template with templateId equal to UUID of first instance
			if (eHtml.childElementCount) {
				const template = document.createElement('TEMPLATE');
				while (eHtml.children.length) {
					const child = eHtml.children[0];
					if (child.tagName === 'STYLE' || child.tagName === 'SCRIPT') {
						document.body.append(child);
					} else {
						template.content.append(child);
					}
				}
				this.templates[instance.uuid] = template;
				defaultTemplateId = defaultTemplateId || instance.uuid;
			}
			// 2.3. Формируем шаблоны из содержимого элементов с атрибутом sg-for
			for (const template of Object.values(this.templates)) {
				const eFors = template.content.querySelectorAll('[sg-for]');
				for (const eFor of eFors) {
					const templateId = eFor.getAttribute('sg-template') || SGModel.uuidLite();
					eFor.setAttribute('sg-template', templateId);
					if (!this.templates[templateId]) {
						const template = document.createElement('TEMPLATE');
						while (eFor.childNodes.length) {
							const child = eFor.childNodes[0];
							if (child.tagName === 'STYLE' || child.tagName === 'SCRIPT') {
								console.warn('Error in sg-for inline-template! The inline-template cannot contain script and style tags!');
								child.remove();
							} else {
								template.content.append(child);
							}
						}
						this.templates[templateId] = template;
					}
				}
			}
			// 3. Определяем templateId
			autoLoadBind.templateId = autoLoadBind.templateId && String(autoLoadBind.templateId).replace(/^#/, '') || defaultTemplateId;
		}
		if (this.multipleInstance && autoLoadBind.viewId) {
			throw new Error(`Error! autoLoadBind.viewId is not allowed for multiple instances!`);
		}
		return true;
	}
	
	/**
	 * Constructor
	 * @param {object} [properties={}]
	 * @param {object} [options]
	 * @param {object} [thisProperties] - Properties and methods passed to the this context of the created instance
	 */
	//constructor(properties = {}, options = void 0, thisProperties = void 0) {
	//	super(properties, options, thisProperties);
	//}
	
	/**
	 * Called when an instance is created
	 * @protected
	 * @see {mixed} [static autoLoadBind.srcHTML] - can be a path to an html file (string), html content (string), a HTMLElement/HTMLTemplateElement (object)
	 * @see {string} [static autoLoadBind.templateId] - ИД шаблона, содержимое которого будет выведено во вьюху
	 * @see {string} [static autoLoadBind.viewId] or [static autoLoadBind.containerId] or [static autoLoadBind.$container] - Куда выводить содержимое шаблона
	 * @see {object} [static templates]
	 * @param {function} callback
	 * @return {Promise}
	 */
	async __initialize(callback) {

		// Сюда приходим после полного выполнения конструктора в SGModel
		// @english: We come here after complete execution of the constructor in SGModel

		// Свойства в #propertyElementLinks должны быть добавлены в той же последовательности, в какой они объявлены! Т.о. при первоначальном рефреше контролов можно, например, решить проблему dropdown-списков, в которой при задании текущего select-значения в момент инициализации (например, из localStorage) innerHTML контрола (<button>) должен обновиться innerHTML'ом пункта (<li>).
		for (let propName in this.data) {
			this.#propertyElementLinks[propName] = [];
		}

		if (!this.constructor.__pInitialize) {
			this.constructor.__pInitialize = this.constructor.initialize(this).then((result) => {
				this.constructor.initialized = true;
				return result;
			}, (err) => {
				this.constructor.initialized = false;
				return err;
			});
		}

		this.#prrSeqConstructor = Promise.withResolvers(); 
		const isFirstPWR = !SGModelView.#prevPWR;
		if (!isFirstPWR) {
			SGModelView.#prevPWR.promise.finally(() => {
				this.constructor.__pInitialize.finally(this.#prrSeqConstructor.resolve);
			});
		}
		SGModelView.#prevPWR = this.#prrSeqConstructor;

		// Вывод контента по умолчанию (клонирование шаблона) и связывание с данными.
		// @english: Default content output (template cloning) and data binding.
		this.#prrSeqConstructor.promise.then((result) => { // eslint-disable-line no-unused-vars
			const autoLoadBind = this.constructor.autoLoadBind;
			const containerId = this.options.containerId || autoLoadBind.containerId;
			const viewId = this.options.viewId || autoLoadBind.viewId;
			if (containerId && viewId) {
				throw new Error(`Error in SGModelView->${this.constructor.name}: containerId and viewId are set at the same time. Only one thing is given!`);
			}
			const targetId = containerId || viewId;
			const template = this.constructor.templates[autoLoadBind.templateId] || document.querySelector(`template[id=${autoLoadBind.templateId}]`);
			if (autoLoadBind.templateId && (targetId || (autoLoadBind.$container instanceof HTMLElement))) {
				const eTarget = targetId && document.querySelector(targetId) || autoLoadBind.$container;
				if (eTarget) {
					let eContent;
					let requiredSection = false;
					if (template) {
						eContent = template.content.cloneNode(true);
						if (!(requiredSection = this.#requiredSection(eContent))) {
							this.$view = eContent.firstElementChild;
						}
					} else {
						eContent = document.createElement('DIV');
						if (this.constructor.initialized === true) {
							eContent.innerText = `Error! Template with autoLoadBind.templateId = "${autoLoadBind.templateId}" not found! View class: ${this.constructor.name}`;
						} else {
							eContent.innerText = `Еrror occurred while initializing the view of ${this.constructor.name}!`;
						}
					}
					if (viewId) {
						this.$view = eTarget;
						if (this.$view.__sgModelUUID) {
							throw new Error(`Error! The container with id="${viewId}" (view class: ${this.constructor.name}) already binding with other SGModel instance with uuid: "${this.$view.__sgModelUUID}" and class: ${SGModel.__instances[this.$view.__sgModelUUID].constructor.name}!`);
						}
						this.$view.append(eContent);
					} else { // Сохраняем существующий контент для вывода нескольких экземпляров. @english: Preserve existing content to support multiple instances of printing.
						if (requiredSection) {
							this.$view = document.createElement('SECTION');
							this.$view.append(eContent);
							eTarget.append(this.$view);
						} else {
							eTarget.append(eContent);
						}
					}
					if (this.constructor.initialized === true) {
						this.bindHTML(this.$view);
					} else {
						console.error(`Binding was not completed because initialization failed! View class: ${this.constructor.name}`);
					}
				} else {
					throw new Error(`Error! The container with id="${targetId}" does not exists! View class: ${this.constructor.name}`);
				}
			}
			// Для варианта, когда используется атрибут sg-model без template-шаблонов
			if (!autoLoadBind.viewId && this.constructor.singleInstance) {
				const eView = this.#findElementBySGClass(this.constructor.name);
				if (eView) {
					this.$view = eView;
					if (this.constructor.initialized === true) {
						if (autoLoadBind.templateId) {
							if (this.$view.childElementCount === 0) {
								this.$view.append(this.constructor.templates[autoLoadBind.templateId].content.cloneNode(true));
							} else {
								console.error(`Error when inserting template content at templateId="${autoLoadBind.templateId}"! There are already elements in the view! View class: ${this.constructor.name}`);
							}
						}
						this.bindHTML(this.$view);
					} else {
						console.error(`Binding was not completed because initialization failed! View class: ${this.constructor.name}`);
					}
				}
			}
			for (const name of this.#deferredProperties) {
				if (this.#propertyElementLinks[name]) {
					this.#refreshElement(name);
				}
			}
			return true;
		}).then(() => {
			callback();
			this.initialization.resolve();
		});

		if (isFirstPWR) {
			this.constructor.__pInitialize.then(this.#prrSeqConstructor.resolve);
		}
		
		return this.initialization.promise;
	}

	/**
	 * Найти элемент с определенным значением атрибута sg-model. Элементы (и вложенные также) с установленным __sgModelUUID пропускаются!
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
			if (!root.__sgModelUUID && root.getAttribute(SGModelView.#ATTRIBUTES.SG_MODEL) === className) { // @aos
				return root;
			}
		} else if (!(root instanceof HTMLElement)) {
			throw new Error(`Error in #findElementBySGClass()! Incorrect type of parameter "root"!`);
		}
		for (let node of root.childNodes) {
			if (node.nodeType !== Node.ELEMENT_NODE || node.__sgModelUUID) continue;
			if (node.getAttribute(SGModelView.#ATTRIBUTES.SG_MODEL) === className) {
				return node;
			}
			if (node = this.#findElementBySGClass(className, node)) { // eslint-disable-line no-cond-assign
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
				(node.nodeType === Node.TEXT_NODE && node.textContent.replace(/\s*/g, '')) ||
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
	 * @param {boolean|string} [mTemplate] Предварительно вывести контент из шаблона (если true - то берётся шаблон по умолчанию)
	 */
	bindHTML(root = void 0, mTemplate = false) {
		if (document.readyState === 'loading') {
			throw new Error('Error in this.bindHTML()! document.readyState = loading!');
		}
		if (!this.constructor.initialized) {
			throw new Error('Error in this.bindHTML()! Manual binding must be done inside the initialize() method');
		}
		this.#bindHTML(root, mTemplate);
	}
	
	/**
	 * @private
	 */
	#bindHTML(root = void 0, mTemplate = false) {
		this.$view = (typeof root === 'string' ? document.querySelector(root) : (root ? root : document.body));
		if (!this.$view) {
			throw new Error(`Error in ${this.constructor.name}->bindHTML()! Container "${root}" does not exist!`);
		}
		if (!this.#binderInitialized) {
			if (typeof document === 'undefined') {
				throw new Error('Error! window.document is undefined!');
			}
			this.onChangeDOMElementValue = this.#onChangeDOMElementValue.bind(this);
			this.#eventsCounter = -1;
			this.#binderInitialized = true;
		} else {
			this.#clearSGinDOM(this.$view);
		}
		
		this.$view.__sgModelUUID = this.uuid;
		if (this.constructor.enablePrintingUUIDClass === true) {
			this.$view.setAttribute(SGModelView.#ATTRIBUTES.SG_UUID, `${this.constructor.name}:${this.__uid}:${this.uuid}`);
		}

		if (mTemplate && this.constructor.autoLoadBind.templateId) {
			const templateId = (mTemplate === true ? this.constructor.autoLoadBind.templateId : mTemplate);
			const template = this.constructor.templates[templateId] || document.querySelector(`template[id=${templateId}]`);
			if (!template) {
				throw new Error(`Error in ${this.constructor.name}->bindHTML()! Template with ID="${mTemplate}" not found!`);
			}
			const eContent = template.content.cloneNode(true);
			this.$view.append(eContent);
		}
		
		this.#reProps = {};
		this.#rePropsChecked = {};
		for (let name in this.data) {
			this.#reProps[name] = {
				re: [
					new RegExp(`([^\\w\\.\\-])${name}([^\\w\\.\\-])`, 'g'),
					new RegExp(`^()${name}([^\\w\\-])`, 'g'), //new RegExp(`^()${name}([^\\w\\.\\-])`, 'g'),
					new RegExp(`([^\\w\\.\\-])${name}()$`, 'g'),
					new RegExp(`^()${name}()$`, 'g')
				],
				to: `$1this.data.${name}$2`
			};
			this.#rePropsChecked[name] = [
				new RegExp(`[^\\w\\.\\-]this\\.data\\.${name}[^\\w\\.\\-]`, 'g'),
				new RegExp(`^this\\.data\\.${name}[^\\w\\.\\-]`, 'g'),
				new RegExp(`[^\\w\\.\\-]this\\.data\\.${name}$`, 'g'),
				new RegExp(`^this\\.data\\.${name}$`, 'g')
			];
		}
		this.#sysThis = ['constructor', 'initialize', 'defaults'];
		this.#reThis = {};
		let thisNames = Object.getOwnPropertyNames(this.__proto__);
		for (let i = 0; i < thisNames.length; i++) {
			const name = thisNames[i];
			if (this.#sysThis.indexOf(name) === -1 && !/^_/.test(name)) {
				this.#reThis[name] = {
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
		
		this.#bindElements([this.$view], true);

		for (const name in this.#propertyElementLinks) {
			if (this.#propertyElementLinks[name].length) {
				this.#refreshElement(name);
			}
		}
	}
	
	/** @private */
	#bindElements(elements, isRoot = false) {
		for (let e = 0; e < elements.length; e++) {
			const elementDOM = elements[e];
			if (elementDOM.__sgModelUUID && !isRoot || elementDOM.nodeType !== Node.ELEMENT_NODE) { // Пропускаем вложенные инстансы SGModel-представлений и узлы других типов
				continue;
			}
			
			const sgInNode = elementDOM[SGModelView.#sgPrefixInNode] || (elementDOM[SGModelView.#sgPrefixInNode] = {});
			
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
				this.#regPropertyElementLink(sgProperty, elementDOM, SGModelView.#LINKTYPE_VALUE);
				sgInNode.property = sgProperty;
				sgInNode.type = sgType;
				sgInNode.format = this[sgFormat];
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
					const eList = document.querySelector(`[aria-labelledby=${elementDOM.id}]`);
					if (!eList) {
						throw new Error(`Error in this.#bindElements()! Dropdown lists must have an id attribute (for example in a button) and an aria-labelledby attribute of the list container (for example in a <UL> tag).`);
					}
					const sgInList = eList[SGModelView.#sgPrefixInNode] || (eList[SGModelView.#sgPrefixInNode] = {});
					sgInList.control = elementDOM;
					eList.addEventListener('click', this._dropdownItemsClick);
					elementDOM.addEventListener('change', this.onChangeDOMElementValue);
				}
			}
			
			// Now attributes are implemented only for static output (only at initialization)
			if (sgAttributes) {
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
			}
			
			// Now attributes are implemented only for static output (only at initialization)
			if (sgValue) {
				const fFormat = this[sgFormat] || SGModel.fStub;
				const method = sgValue.replace(/(\w+)(.*)/, '$1');
				if (this[method] instanceof Function) {
					const args = Array.from(sgValue.matchAll(/'(.*?)'/g));
					elementDOM.innerHTML = fFormat.call(this, this[method].apply(this, args.map((o)=>o[1])));
				} else {
					const props = sgValue.split('.');
					if (props.length === 2) {
						const pClass = SGModelView.__classes[props[0]];
						if (pClass) {
							elementDOM.innerHTML = fFormat.call(this, pClass[props[1]]);
						}
					} else if (props.length === 1) {
						if (this.has(props[0])) {
							elementDOM.innerHTML = fFormat.call(this, this.data[props[0]]);
						}
					}
				}
			}
			
			if (sgCSS) {
				let _sgCSS = sgCSS;
				for (let name in this.#reProps) {
					const reProps = this.#reProps[name];
					const aRE = reProps.re;
					const len = _sgCSS.length;
					for (const re of aRE) {
						_sgCSS = _sgCSS.replace(re, reProps.to);
					}
					if (len !== _sgCSS.length) {
						this.#regPropertyElementLink(name, elementDOM, SGModelView.#LINKTYPE_CSS);
					}
				}
				let bProperties = false;
				for (let name in this.#rePropsChecked) {
					const re = this.#rePropsChecked[name];
					for (let p = 0; p < re.length; p++) {
						if (re[p].test(_sgCSS)) {
							bProperties = true;
							break;
						}
					}
					if (bProperties) break;
				}
				let bFunctions = false;
				for (let name in this.#reThis) {
					const re = this.#reThis[name].re;
					const len = _sgCSS.length;
					for (let p = 0; p < re.length; p++) {
						_sgCSS = _sgCSS.replace(re[p], this.#reThis[name].to);
					}
					if (len !== _sgCSS.length) {
						bFunctions = true;
					}
				}
				sgInNode.css = (new Function(`return ${_sgCSS}`)).bind(this);
				sgInNode.css_static_classes = [...elementDOM.classList];
				if (!bProperties && bFunctions) {
					this.#regPropertyElementLink(sgProperty, elementDOM, SGModelView.#LINKTYPE_CSS);
				}
			}
			
			if (sgClick) {
				let callback = this[sgClick];
				if (typeof callback === 'function') {
					callback = callback.bind(this);
					elementDOM.addEventListener('click', callback);
					const index = ++this.#eventsCounter;
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
						if (item.hint) {
							eOption.title = item.hint;
						}
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
					const link = this.#regPropertyElementLink(sgFor, elementDOM, SGModelView.#LINKTYPE_FORTEMPLATE); // eslint-disable-line no-unused-vars
					sgInNode.template = template;
					if (sgItemVariables) {
						sgInNode.item_variables = SGModelView.parseItemVariablesLine(sgItemVariables);
						// Поиск динамических переменных, значения которых могу меняться в процессе работы приложения
						for (const varName in sgInNode.item_variables) {
							const value = sgInNode.item_variables[varName];
							const nameInValue = (String(value)[0] === '$' ? value.substring(1) : void 0);
							if (this.has(nameInValue)) {
								sgInNode.item_variables[varName] = {
									propertyName: nameInValue,
								};
							}
						}
					}
				} else {
					console.warn(`Error in this.#bindElements()! Template "${sgTemplate}" not found! Property: ${sgOptions}, constructor: ${this.constructor.name}`);
				}
			}
			
			this.#bindElements(elementDOM.childNodes);
		}
	}
	
	/** @private */
	#regPropertyElementLink(property, elementDOM, linkType) {
		const links = (this.#propertyElementLinks[property] || (this.#propertyElementLinks[property] = []));
		let link = links.find(link => (link.element === elementDOM && link.linkType === linkType));
		if (!link) {
			link = {
				element: elementDOM,
				linkType,
			};
			links.push(link);
		}
		return link;
	}

	/** @private */
	#printItem(property, elementDOM, collection, keyOrIndex, valueOrItem, requiredSection) {
		const sgInNode = elementDOM[SGModelView.#sgPrefixInNode];
		const eContent = sgInNode.template.content.cloneNode(true);
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
		this.#scanItemContentAndSetValues(property, eItem, keyOrIndex, valueOrItem, sgInNode.item_variables);
	}
	
	/** @private */
	#refreshElement(property) {
		for (let j = 0; j < this.#propertyElementLinks[property].length; j++) {
			const link = this.#propertyElementLinks[property][j];
			const elementDOM = link.element;
			if (!elementDOM) return false;
			const sgInNode = elementDOM[SGModelView.#sgPrefixInNode];
			switch (link.linkType) {
				case SGModelView.#LINKTYPE_VALUE: {
				
					const value = this.data[property];

					switch (sgInNode.type) {
						case 'dropdown': {
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
						}
						default: {
							if (elementDOM.type) {
								switch (elementDOM.type) {
									case 'radio': case 'checkbox': elementDOM.checked = value; break;
									case 'range': case 'select-one': elementDOM.value = value; break;
									case 'date': elementDOM.value = String(value).replace(/\s.*/, ''); break; // YYYY-MM-DD
									case 'datetime-local': elementDOM.value = String(value).replace(/[+-]\d+$/, ''); break; // YYYY-MM-DD HH:MM:SS
									case 'time': elementDOM.value = value.match(/\d\d:\d\d:\d\d/)?.[0]; break; // YYYY-MM-DD HH:MM:SS+PP
									case 'text': case 'textarea': case 'button': {
										const v = (sgInNode.format ? sgInNode.format.call(this, value) : value);
										elementDOM.value = v;
										if (elementDOM.type === 'button') {
											elementDOM.innerText = v;
										}
										break;
									}
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
								elementDOM.innerHTML = (sgInNode.format ? sgInNode.format.call(this, value) : value);
							}
						}
					}
					break;
				}
				case SGModelView.#LINKTYPE_CSS: {
					if (sgInNode.css) {
						for (let i = elementDOM.classList.length - 1; i >= 0; i--) {
							if (sgInNode.css_static_classes.indexOf(elementDOM.classList[i]) === -1) {
								elementDOM.classList.remove(elementDOM.classList[i]);
							}
						}
						let result = sgInNode.css();
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
				case SGModelView.#LINKTYPE_FORTEMPLATE: {
					const requiredSection = this.#requiredSection(sgInNode.template.content);
					link.element.innerHTML = '';
					const collection = this.data[property];
					const type = this.constructor.typeProperties[property];
					let keyOrIndex = 0;
					if (type === SGModel.TYPE_SET) {
						for (const valueOrItem of collection) {
							this.#printItem(property, link.element, collection, keyOrIndex++, valueOrItem, requiredSection);
						}
					} else if (type === SGModel.TYPE_ARRAY || type === SGModel.TYPE_ARRAY_NUMBERS) {
						for (keyOrIndex = 0; keyOrIndex < collection.length; keyOrIndex++) {
							this.#printItem(property, link.element, collection, keyOrIndex, collection[keyOrIndex], requiredSection);
						}
					} else if (type === SGModel.TYPE_OBJECT || type === SGModel.TYPE_OBJECT_NUMBERS) {
						for (keyOrIndex in collection) {
							this.#printItem(property, link.element, collection, keyOrIndex, collection[keyOrIndex], requiredSection);
						}
					} else if (type === SGModel.TYPE_MAP) {
						for (const item of collection) {
							this.#printItem(property, link.element, collection, item[0], item[1], requiredSection);
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
	#scanItemContentAndSetValues(property, element, keyOrIndex, valueOrItem, sgItemVariables) {

		// @aos
		if (!(valueOrItem instanceof Object)) {
			SGModelView.#objWithValue.value = valueOrItem;
			valueOrItem = SGModelView.#objWithValue;
		}
		
		if (element instanceof HTMLElement) {

			const sgInNode = (element[SGModelView.#sgPrefixInNode] || (element[SGModelView.#sgPrefixInNode] = {}));
			
			// Собираем все атрибуты, разделяя их на обычные и sg-атрибуты (в обычных атрибутах для доступа к субсвойству необходимо добавлять префикс "$")
			const sgAttrs = {};
			for (let i = 0; i < element.attributes.length; i++) {
				const attr = element.attributes[i];
				if (SGModelView.#ATTRIBUTES[attr.name]) { // Example: SGModelView.#ATTRIBUTES['sg-value'] = 'SG_VALUE'
					sgAttrs[attr.name] = String(attr.value).trim();
				} else {
					for (const subProperty in valueOrItem) {
						attr.value = attr.value.replaceAll(`$${subProperty}`, valueOrItem[subProperty]);
					}
				}
				if (sgItemVariables) {
					for (const subProperty in sgItemVariables) {
						const itemVar = sgItemVariables[subProperty];
						if (itemVar instanceof Object) {
							if (attr.value === subProperty) {
								sgInNode.item_variables_attributes = sgInNode.item_variables_attributes || {};
								sgInNode.item_variables_attributes[attr.name] = itemVar;
								attr.value = this.data[itemVar.propertyName];
							}
						} else {
							attr.value = attr.value.replaceAll(subProperty, itemVar);
						}
					}
				}
			}

			let attrValue;

			attrValue = String(sgAttrs[SGModelView.#ATTRIBUTES.SG_PROPERTY] || '');
			if (attrValue) {
				let value = this.#extractAttrValue(attrValue, keyOrIndex, valueOrItem);
				const sgFormat = sgAttrs[SGModelView.#ATTRIBUTES.SG_FORMAT];
				if (sgFormat) {
					value = (this[sgFormat] instanceof Function ? this[sgFormat].call(this, value) : value);
				}
				switch (element.tagName) {
					case 'INPUT':
						if (element.type === 'checkbox' || element.type === 'radio') {
							element.checked = value;
						} else {
							element.value = value;
						}
						break;
					case 'SELECT': case 'TEXTAREA': case 'BUTTON':
						element.value = value;
						break;
					default:
						element.innerHTML = value;
				}
			}

			attrValue = String(sgAttrs[SGModelView.#ATTRIBUTES.SG_VALUE] || '');
			if (attrValue) {
				let value = this.#extractAttrValue(attrValue, keyOrIndex, valueOrItem);
				const sgFormat = sgAttrs[SGModelView.#ATTRIBUTES.SG_FORMAT];
				if (sgFormat) {
					value = (this[sgFormat] instanceof Function ? this[sgFormat].call(this, value) : value);
				}
				element.innerHTML = value;
			}

			attrValue = String(sgAttrs[SGModelView.#ATTRIBUTES.SG_OPTION] || '');
			if (attrValue) {
				element.setAttribute(SGModelView.#ATTRIBUTES.SG_OPTION, this.#extractAttrValue(attrValue, keyOrIndex, valueOrItem));
			}

			attrValue = String(sgAttrs[SGModelView.#ATTRIBUTES.SG_CSS] || '');
			if (attrValue) {
				const propName = sgAttrs[SGModelView.#ATTRIBUTES.SG_PROPERTY] || sgAttrs[SGModelView.#ATTRIBUTES.SG_VALUE];
				if (this[attrValue] instanceof Function && propName) {
					const result = this[attrValue].call(this, valueOrItem[propName]);
					if (result) {
						element.classList.add(result);
					}
				}
			}
		}

		for (const childNode of element.childNodes) {
			if (childNode.nodeType === Node.ELEMENT_NODE) {
				this.#scanItemContentAndSetValues(property, childNode, keyOrIndex, valueOrItem, sgItemVariables);
			} else if (childNode.nodeType === Node.TEXT_NODE) {
				if (childNode.textContent.trim() === '') continue; // @aos
				for (const subProperty in valueOrItem) {
					const _subProperty = `$${subProperty}`;
					if (childNode.textContent.includes(_subProperty)) {
						childNode.textContent = childNode.textContent.replaceAll(_subProperty, valueOrItem[subProperty]);
					}
				}
			}
		}		
	}

	#extractAttrValue(attrValue, keyOrIndex, valueOrItem) {
		if (attrValue === '$index') {
			return Number(keyOrIndex) + 1;
		} else if (attrValue === '$key') {
			return keyOrIndex;
		} else if (Object.hasOwn(valueOrItem, attrValue)) {
			return valueOrItem[attrValue];
		}
		return void 0;
	}
	
	/** @private */
	#onChangeDOMElementValue(event) {
		const elem = event.currentTarget;
		const sgInNode = elem[SGModelView.#sgPrefixInNode];
		switch (elem.type) {
			case 'checkbox': {
				this.set(sgInNode.property, elem.checked, void 0, void 0, event, elem);
				break;
			}
			case 'radio': {
				const form = this._findParentForm(elem);
				const radioButtons = form.querySelectorAll(`input[name=${elem.name}]`);
				for (let i = 0; i < radioButtons.length; i++) {
					const _elem = radioButtons[i];
					const _sgInNode = _elem[SGModelView.#sgPrefixInNode];
					if (_elem.getAttribute('sg-property') !== elem.getAttribute('sg-property') && _sgInNode.property) {
						this.set(_sgInNode.property, _elem.checked, void 0, void 0, event, _elem);
					}
				}
				this.set(sgInNode.property, elem.checked, void 0, void 0, event, elem);
				break;
			}
			case 'text': case 'textarea': case 'date': case 'time': case 'datetime-local': case 'button': case 'select-one': {
				this.set(sgInNode.property, elem.value, void 0, void 0, event, elem);
				break;
			}
			case 'range': {
				this.set(sgInNode.property, elem.value, void 0, void 0, event, elem); break;
			}
			case 'select-multiple': {
				const result = [];
				for (let i = 0; i < elem.selectedOptions.length; i++) {
					result.push( elem.selectedOptions[i].value );
				}
				this.set(sgInNode.property, result, void 0, void 0, event, elem);
				break;
			}
		}
	}

	/** @private */
	_dropdownItemsClick(evt) {
		const eTarget = evt.target;
		let eItem = eTarget;
		while (eItem.parentNode) {
			const sgInParentNode = eItem.parentNode[SGModelView.#sgPrefixInNode];
			if (sgInParentNode && sgInParentNode.control && eItem.parentNode.getAttribute('aria-labelledby')) {
				const eControl = sgInParentNode.control;
				eControl.value = eItem.getAttribute('sg-option');
				eControl.innerHTML = eItem.innerHTML;
				eControl.dispatchEvent(new Event('change'));
				break;
			}
			eItem = eItem.parentNode;
		}
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
	 * Пример sg-атрибута со значениями: sg-item-variables="{ $tagClass: 'text-bg-primary', $tagStyle: 'background-color: $green', $x: -123.45, $y: 400, $description: 'Some text3...' }"
	 * @ai ChatGPT
	 * @param {string} line 
	 * @returns {object}
	 */
	static parseItemVariablesLine(line) {
		const result = {};
		const content = line.trim().slice(1, -1); // Убираем { и }
		let pairs = content.split(/,(?![^[]*\]|[^{]*\})/); // Разбиваем по запятым, игнорируя вложенные структуры
		pairs.forEach(pair => {
			let [key, value] = pair.split(/:(.+)/).map(s => s.trim()); // Разделяем по первому двоеточию
			key = key.replace(/^"|"$/g, '').replace(/^'|'$/g, ''); // Убираем кавычки у ключа
			if (value.startsWith("'") && value.endsWith("'")) {
				value = value.slice(1, -1); // Убираем одинарные кавычки у строк
			} else if (!isNaN(value)) {
				value = Number(value); // Преобразуем числа
			} else if (value === 'true' || value === 'false') {
				value = value === 'true'; // Преобразуем boolean
			} else {
				value = `$${value}`; // Если значение - это не число и без одинарных кавычек, значит это имя свойства!
			}
			result[key] = value;
		});
		return result;
	}

	/**
	 * Overrides the **SGModel->set** method
	 * @override
	 */
	set(name, valueOrCollection, options = SGModel.OBJECT_EMPTY, flags = 0, event = void 0, elem = void 0) { // eslint-disable-line no-unused-vars
		return this.#sarc(name, super.set.apply(this, arguments));
	}

	/**
	 * Overrides the **SGModel->addTo** method
	 * @override
	 */
	addTo(name, value, key = void 0, options = void 0, flags = 0) { // eslint-disable-line no-unused-vars
		return this.#sarc(name, super.addTo.apply(this, arguments));
	}

	/**
	 * Overrides the **SGModel->removeFrom** method
	 * @override
	 */
	removeFrom(name, indexOrKeyOrValue, options = void 0, flags = 0) { // eslint-disable-line no-unused-vars
		return this.#sarc(name, super.removeFrom.apply(this, arguments));
	}

	/**
	 * Overrides the **SGModel->clearProperty()** method
	 */
	clearProperty(name, value = void 0, flags = 0) {
		super.clearProperty.call(this, name, value, flags);
		this.#sarc(name, true);
	}

	/**
	 * Overrides the **SGModel->clear** method
	 * @override
	 */
	clear(options = void 0, flags = 0) { // eslint-disable-line no-unused-vars
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
			let keyName = 'index';
			let keyValue = keyOrIndex;
			if (valueOrItem instanceof Object) {
				if (valueOrItem.id) {
					keyName = 'id';
					keyValue = valueOrItem.id;
				} else if (valueOrItem.uuid) {
					keyName = 'uuid';
					keyValue = valueOrItem.uuid;
				} else if (valueOrItem.code) {
					keyName = 'code';
					keyValue = valueOrItem.code;
				} else if (valueOrItem.hash) {
					return `hash:${valueOrItem.hash}`;
				}
			}
			const hash = SGModelView.sha256trimL(`${this.uuid}:${property}:${keyName}:${keyValue}`);
			return `${keyName}:${keyValue}:${hash}`;
		} else if (type === SGModel.TYPE_ARRAY_NUMBERS || type === SGModel.TYPE_OBJECT_NUMBERS) {
			const hash = SGModelView.sha256trimL(`${this.uuid}:${property}:index:${keyOrIndex}`);
			return `index:${keyOrIndex}:${hash}`;
		}
		throw new Error(`Error in this.#getItemHash()! The property "${property}" does not support data type "${SGModel.TYPES[type]}"!`);
	}

	/**
	 * Получить данные элемента/записи коллекции
	 * @param {Event|HTMLElement} eventOrElement
	 * @returns {object} Вернёт объект: { key {string}, value {mixed}, item {mixed}, collection, property {string}, type {SGModel.TYPE_%}, $item {HTMLElement}, $control {HTMLElement}, hash {string} }, где:
	 *	key - либо индекс элемента для массивов/Set-коллекции, либо имя свойства объекта или ключа элемента Map-коллекции
	 *	value - значение элемента коллекции. Для keyName='index' преобразуется к Number, для keyName='id' преобразуется к BigInt
	 *	item - запись коллекции (для массивов или Set-коллекции равно **value**)
	 *	collection - сама коллекция
	 *	property - имя свойства в атрибуте sg-for
	 *	type - тип данных (SGModel.TYPE_ARRAY|SGModel.TYPE_ARRAY_NUMBERS|SGModel.TYPE_OBJECT|SGModel.TYPE_OBJECT_NUMBERS|SGModel.TYPE_SET|SGModel.TYPE_MAP)	
	 *	keyName - имя ключа (м.б. id, uuid, code, hash или index)
	 *	$item - корневой DOM-элемент записи
	 *	$control - DOM-элемент, на который нажал пользователь, например, BUTTON
	 *	hash - хэш записи (ключа)
	 */
	getForItem(eventOrElement) {
		const $control = (eventOrElement instanceof Event ? eventOrElement.target : eventOrElement);
		eventOrElement = $control;
		if ($control instanceof HTMLElement) {
			while (eventOrElement) {
				if (eventOrElement.__sgModelUUID) {
					return {};
				}
				const sgItemValue = eventOrElement.getAttribute(SGModelView.#ATTRIBUTES.SG_ITEM);
				if (sgItemValue) {
					const [keyName, keyValue, hash] = String(sgItemValue).split(':');
					// Формируем объект. По стандарту порядок выдачи свойств в цикле for..in не определён, но некоторое соглашение об этом, всё же, есть. Соглашение говорит, что если имя свойства – нечисловая строка, то такие ключи всегда перебираются в том же порядке, в каком присваивались. Так получилось по историческим причинам и изменить это сложно: поломается много готового кода.
					const result = {
						key: (keyName === 'index' ? Number(keyValue) : (keyName === 'id' ? BigInt(keyValue) : keyValue)),
						value: null,
						item: null,
						collection: null,
						property: null,
						type: null,
						keyName,
						$item: eventOrElement,
						$control,
						hash: hash || keyValue,
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
				if (this.#propertyElementLinks[name]?.length) {
					this.#refreshElement(name);
				}
			} else {
				this.#deferredProperties.add(name);
			}
		}
		return changed;
	}

	/**
	 * Overrides the **SGModel->on()** method
	 */
	on(name, func, context = void 0, data = void 0, flags = 0) {
		if (Array.isArray(name)) {
			for (let index = 0; index < name.length; index++) {
				if (this.#deferredProperties.has(name[index])) {
					flags = flags | SGModel.FLAG_IMMEDIATELY;
					break;
				}
			}
		} else {
			if (this.#deferredProperties.has(name)) {
				flags = flags | SGModel.FLAG_IMMEDIATELY;
			}
		}
		return super.on.call(this, name, func, context, data, flags);
	}

	/**
	 * Overrides the **SGModel->trigger()** method
	 */
	 trigger(name, value = void 0, flags = 0) {
		super.trigger.call(this, name, value, flags);
		this.#sarc(name, true);
	}

	/**
	 * @private
	 */
	static #toJSONExclude = {
		thisProperties: 'data,$view,initialization'.split(','),
		classProperties: 'data,templates,__instance,__instances,__instancesByClass,__pInitialize'.split(','),
	};

	/**
	 * Подготовить инстанс для преобразования в текстовое json-представление
	 * @returns {string}
	 */
	toJSON() {
		const cls = this.constructor;
		const result = {
			data: this.getAllData(),
			$view: this.$view && this.$view.toString() || null,
			viewId: this.$view && this.$view.id || void 0,
			__class: {
				name: this.constructor.name,
				templates: Object.fromEntries(Object.entries(cls.templates).map(([key, value]) => [key, value.toString()])),
				__prototype: {
					name: 'SGModelView',
					version: SGModelView.version,
					isNode: SGModelView.isNode,
					isBrowser: SGModelView.isBrowser,
				},
			},
		};
		for (let name in this) {
			if (typeof this[name] !== 'function' && !SGModelView.#toJSONExclude.thisProperties.includes(name)) {
				result[name] = this[name];
			}
		}
		for (let name in cls) {
			if (typeof cls[name] !== 'function' && !SGModelView.#toJSONExclude.classProperties.includes(name)) {
				if (Object.hasOwn(SGModel, name) || Object.hasOwn(SGModelView, name)) continue;
				result.__class[name] = cls[name];
			}
		}
		return result;
	}

	/**
	 * Очистить DOM-элементы представления от __sg, sg-uuid и sg-item. Удалить подписчики на события.
	 * @private
	 */
	#clearSGinDOM(root) {
		let name, item;
		for (name in this.#propertyElementLinks) {
			const link = this.#propertyElementLinks[name];
			if (link.linkType === SGModelView.#LINKTYPE_VALUE) {
				link.element.removeEventListener('change', this.onChangeDOMElementValue);
				link.element.removeEventListener('input', this.onChangeDOMElementValue);
			}
			delete this.#propertyElementLinks[name];
		}
		while (item = this.#elementsEvents.pop()) { // eslint-disable-line no-cond-assign
			item.element.removeEventListener(item.event, item.callback);
		}
		if (root instanceof HTMLElement) {
			delete root[SGModelView.#sgPrefixInNode];
			delete root.__sgModelUUID;
			root.removeAttribute('sg-uuid');
			root.removeAttribute('sg-item');
		}
		for (const childNode of root.childNodes) {
			if (childNode.nodeType === Node.ELEMENT_NODE) {
				this.#clearSGinDOM(childNode);
			}
		}		
	}

	/**
	 * Destroy the view and instance
	 * @param {boolean} [noRemoveDOM=false]
	 */
	destroy(noRemoveDOM = false) {
		super.destroy();
		if (this.$view) {
			if (noRemoveDOM) {
				// TODO: очистить DOM-элементы от __sg, и от sg-uuid, sg-item
				this.#clearSGinDOM(this.$view);
			} else {
				this.$view.remove();
			}
		}
	}
}

//console.assert(SGModelView.sha256('test') === '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', 'Test with SGModelView.sha256("test") failed!');

SGModelView.setAttributesPrefix();

if (SGModelView.isNode) {
	module.exports = SGModelView;
} else if (SGModelView.isBrowser) {
	window['SGModelView'] = SGModelView;
}

export default SGModelView;
"use strict";

import Utils from './sg-utils.js';
import SGModel from './sg-model.js';
import SGDevTools from './sg-devtools.js';

/*!
 * SGModelView - Микрофреймворк для реализации паттерна MVVM, расширяющий SGModel и обеспечивающий автоматическую привязку данных из инстанса к HTML-элементам.
 * @english Microframework for implementing the MVVM pattern, extending SGModel and providing automatic binding of data from the instance to HTML elements.
 * @version 1.1.2
 * @requires ES2025+ (ES16+)
 * @link https://github.com/sg2d/model.sg2d.ru
 * @license SGModelView may be freely distributed under the MIT license
 * @copyright 2019-2025 © Калашников Илья (https://model.sg2d.ru, sg2d@yandex.ru)
 * @extends SGModel
 */
class SGModelView extends SGModel {

	/*static version = SGModel.version; // @see SGModel.version*/

	static dev = SGDevTools; // Используйте Alt+'`' + клик на любом элементе HTML => в SGModelView.dev.temp будет ссылка на найденный экземпляр SGModelView

	/**
	 * Карта sg-атрибутов
	 */
	static #ATTRIBUTES = {};

	/**
	 * Список sg-атрибутов с учётом префикса (используется в SGDevTools)
	 * @public
	 */
	static ATTRIBUTES = {};

	/**
	 * Имя ключа объекта в каждом DOM-элементе для служебного использования объекта фреймворком
	 */
	static #sgNameInNode = Symbol('__sg');
	static #sgModelUUID = Symbol('__sgModelUUID');
	
	/**
	 * Получить UUID SGModelView-инстанса для HTML-элемента
	 * @param {Element} element 
	 * @returns {string|null} UUID инстанса или null
	 */
	static getElementUUID(element) {
		return element[SGModelView.#sgModelUUID] || null;
	}

	/**
	 * Переопределить префикс атрибутов для SGModelView.
	 * Можно переопределить в основном модуле вашего приложения (например, в точке входа, таком как main.js или app.js), после этого все остальные модули, которые импортируют SGModelView, будут видеть и использовать ваш префикс
	 * @announcement ES2025 Атрибуты импорта (TODO)
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
				SGModelView.ATTRIBUTES[`${newPrefix}${name}`] = ucName;
			});
	}

	/**
	 * Включить вывод UUID, имени класса и __uid в атрибуте sg-uuid корневого DOM-элемента представления
	 */
	static enablePrintingUUIDClass = true;

	/**
	 * Переменная создаётся для каждого класса-потомка (this.constructor.initialized)
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
	 * Для вывода экземпляров представлений всех классов, унаследованных от SGModelView, в том порядке, в котором вызывались конструкторы
	 */
	static #prevPWR = null;

	static #LINKTYPE_VALUE = 1;
	static #LINKTYPE_CSS = 2;
	static #LINKTYPE_FORTEMPLATE = 3;

	static FLAGS = Object.freeze(Object.assign({}, {
		IMMEDIATELY_RENDER_DEFAULT_TEMPLATE:	0b0000_0001_0000_0000,
		DESTROY_AND_SAVE_DOM:									0b0000_0010_0000_0000,
	}, SGModel.FLAGS));

	#binderInitialized = false;
	#elementsEvents = [];
	#eventsCounter = 0;
	#propertyElementLinks = {}; // TODO: new Map() вместо объекта
	#prrSeqConstructor = Promise.withResolvers(); // Промис, обеспечивающий нужную последовательность отрисовки вьюхи согласно порядку вызова конструктора этой вьюхи относительно всех вызовов конструкторов SGModelView
	#reProps = {};
	#rePropsChecked = {};
	#sysThis = {};
	#reThis = {};
	
	/**
	 * Автоматические загрузка и парсинг шаблонов
	 * @returns {Promise}
	 */
	static async initialize(instance) {
		this.templates ||= {};
		this.autoLoadBind = (
			Utils.isObject(this.autoLoadBind) ? this.autoLoadBind : {}
		);
		const autoLoadBind = this.autoLoadBind;
		let eHtml;
		if (autoLoadBind.srcHTML) {
			const __uuid = String(instance.uuid).replaceAll('-', '_');
			// 1. Получение/загрузка шаблонов
			if (Utils.isObject(autoLoadBind.srcHTML)) {
				if (autoLoadBind.srcHTML instanceof Element === false) {
					throw new Error(`autoLoadBind.srcHTML is not a Element instance! See ${this.name}`);
				}
				eHtml = autoLoadBind.srcHTML;
			} else {
				let html;
				if (/^[\s]*</.test(autoLoadBind.srcHTML)) { // В строке обнаружен HTML-контент
					html = autoLoadBind.srcHTML;
				} else { // Иначе значение считается URL'ом в т.ч. относительным
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
				cntDiv.id = __uuid;
				eHtml.appendChild(cntDiv);
			}
			// 2. Парсинг шаблонов
			// 2.1. Собираем все TEMPLATE, даже те, которые не на первом уровне вложенности
			let defaultTemplateId = null;
			const tmps = eHtml.querySelectorAll('TEMPLATE'); // instanceof HTMLTemplateElement (.content instanceof DocumentFragment)
			for (let i = 0; i < tmps.length; i++) {
				const template = tmps[i];
				const id = template.id || i;
				defaultTemplateId ||= id;
				this.templates[id] = template;
				template.parentElement.removeChild(template);
			}
			if (eHtml.firstChild && eHtml.firstChild.id === __uuid) {
				eHtml = eHtml.firstChild;
			}
			// 2.2. HTML-элементы (кроме стилей и скриптов) вне TEMPLATE-тегов разместим в шаблоне по умолчанию с templateId равным UUID первого экземпляра
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
				if (template.content.childElementCount > 0) {
					this.templates[instance.uuid] = template;
					defaultTemplateId = defaultTemplateId || instance.uuid;
				}
			}
			// 2.3. Формируем шаблоны из содержимого элементов с атрибутом sg-for
			for (const template of Object.values(this.templates)) {
				const eFors = template.content.querySelectorAll('[sg-for]');
				for (const eFor of eFors) {
					const templateId = eFor.getAttribute('sg-template') || Utils.uuidLite();
					eFor.setAttribute('sg-template', templateId);
					if (!this.templates[templateId]) {
						const template = document.createElement('TEMPLATE');
						while (eFor.childNodes.length) {
							const child = eFor.childNodes[0];
							if (child.tagName === 'STYLE' || child.tagName === 'SCRIPT') {
								console.warn(`Error in sg-for inline-template! The inline-template cannot contain script and style tags! See ${this.name}`);
								child.remove();
							} else {
								template.content.append(child);
							}
						}
						this.templates[templateId] = template;
					}
				}
			}
			// 3. Определяем templateId (шаблон по умолчанию)
			autoLoadBind.templateId = autoLoadBind.templateId && String(autoLoadBind.templateId).replace(/^#/, '') || defaultTemplateId;
		}
		if (this.multipleInstance && autoLoadBind.viewId) {
			throw new Error(`autoLoadBind.viewId is not allowed for multiple instances! See ${this.name}`);
		}
		return true;
	}

	static {
		console.debug('SGModelView version:', this.version);
		Object.defineProperties(this, // TODO: ES2026 использовать декоратор @enumerableFalse?
			'FLAGS,enablePrintingUUIDClass'
				.split(',').reduce((result, name) => (result[name.trim()] = Utils.__enumerableFalse, result), {})
		);
		this.setAttributesPrefix();
		SGDevTools._init(this);
	}
	
	/**
	 * SGModelView конструктор
	 * @param {object} [properties] - Свойства (атрибуты)
	 * @param {object} [options] - Опции
	 * @param {object} [thisProperties] - Свойства и методы, передаваемые в контекст **this** создаваемого инстанса
	 */
	constructor(properties = {}, options = void 0, thisProperties = void 0) {
		super(properties, options, thisProperties);
		if (this.constructor.singleInstance === true) {
			this.constructor.data = this.data; // @aos
		}
	}
	
	/**
	 * Вызывается при создании экземпляра
	 * @protected
	 * @see {string|Element|HTMLTemplateElement} [static autoLoadBind.srcHTML] - может быть путем к HTML-файлу (string), HTML-содержимое (string), Element/HTMLTemplateElement (object)
	 * @see {string} [static autoLoadBind.templateId] - ИД шаблона, содержимое которого будет выведено во вьюху
	 * @see {string} [static autoLoadBind.viewId] or [static autoLoadBind.containerId] or [static autoLoadBind.$container] - Куда выводить содержимое шаблона
	 * @see {object} [static templates]
	 * @param {function} callback
	 * @return {Promise}
	 */
	async __initialize(callback) {

		// Сюда приходим после выполнения конструкторов SGModelView и SGModel

		// Свойства в #propertyElementLinks должны быть добавлены в той же последовательности, в какой они объявлены! Т.о. при первоначальном рефреше контролов можно, например, решить проблему dropdown-списков, в которой при задании текущего select-значения в момент инициализации (например, из localStorage) innerHTML контрола (<button>) должен обновиться innerHTML'ом пункта (<li>).
		for (const name in this.data) {
			this.#propertyElementLinks[name] = [];
		}

		if (!this.constructor.__pInitialize) {
			this.constructor.__pInitialize = this.constructor.initialize(this).then((result) => {
				this.constructor.initialized = true;
				return result;
			}, (err) => {
				this.constructor.initialized = false;
				return err;
			});
			Object.defineProperty(this.constructor, '__pInitialize', Utils.__enumerableFalse);
		}

		this.#prrSeqConstructor = Promise.withResolvers();
		const isFirstPWR = !SGModelView.#prevPWR;
		if (!isFirstPWR) {
			SGModelView.#prevPWR.promise.finally(() => {
				this.constructor.__pInitialize.finally(this.#prrSeqConstructor.resolve);
			});
		}
		SGModelView.#prevPWR = this.#prrSeqConstructor;

		// Вывод контента по умолчанию (клонирование шаблона) и связывание с данными
		this.#prrSeqConstructor.promise.then((result) => { // eslint-disable-line no-unused-vars
			const autoLoadBind = this.constructor.autoLoadBind;
			if (autoLoadBind) {
				const containerId = this.options.containerId || autoLoadBind.containerId;
				const viewId = this.options.viewId || autoLoadBind.viewId;
				if (containerId && viewId) {
					throw new Error(`containerId and viewId are set at the same time. Only one thing is given! ${this.getDebugInfo()}`);
				}
				const targetId = containerId || viewId;
				const template = this.constructor.templates[autoLoadBind.templateId] || document.querySelector(`template[id=${autoLoadBind.templateId}]`);
				if (autoLoadBind.templateId && (targetId || (autoLoadBind.$container instanceof Element))) {
					const eTarget = targetId && document.querySelector(targetId) || autoLoadBind.$container;
					if (eTarget) {
						let eContent;
						let requiredSection = false;
						if (template) {
							eContent = template.content.cloneNode(true);
							if (!(requiredSection = SGModelView.#requiredSection(eContent))) {
								this.$view = eContent.firstElementChild;
							}
						} else {
							eContent = document.createElement('DIV');
							if (this.constructor.initialized === true) {
								eContent.innerText = `Template with autoLoadBind.templateId = "${autoLoadBind.templateId}" not found! ${this.getDebugInfo()}`;
							} else {
								eContent.innerText = `Еrror occurred while initializing the view! ${this.getDebugInfo()}`;
							}
						}
						if (viewId) {
							this.$view = eTarget;
							if (this.$view[SGModelView.#sgModelUUID]) {
								throw new Error(`The container with id="${viewId}" already binding with other SGModel instance with uuid: "${this.$view[SGModelView.#sgModelUUID]}" and class: ${SGModel.__instances[this.$view[SGModelView.#sgModelUUID]].constructor.name}! ${this.getDebugInfo()}`);
							}
							this.$view.append(eContent);
						} else { // Сохраняем существующий контент для вывода нескольких экземпляров
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
							console.error(`Binding was not completed because initialization failed! ${this.getDebugInfo()}`);
						}
					} else {
						throw new Error(`The container with id="${targetId}" does not exists! ${this.getDebugInfo()}`);
					}
				}
			}
			// Для варианта, когда используется атрибут sg-model
			if (!autoLoadBind?.viewId && this.constructor.singleInstance) {
				const eView = SGModelView.#findElementsBySGModel(this.constructor.name);
				if (eView) {
					this.$view = eView;
					if (this.constructor.initialized === true) {
						if (autoLoadBind?.templateId) { // переопределение шаблона!
							if (this.$view.childElementCount === 0) {
								this.$view.append(this.constructor.templates[autoLoadBind.templateId].content.cloneNode(true));
							} else {
								console.error(`Error when inserting template content at templateId="${autoLoadBind.templateId}"! There are already elements in the view! ${this.getDebugInfo()}`);
							}
						}
						this.bindHTML(this.$view);
					} else {
						console.error(`Binding was not completed because initialization failed! ${this.getDebugInfo()}`);
					}
				}
			}
			for (const name of this.deferredProperties) {
				if (this.#propertyElementLinks[name]) {
					this.#refreshElement(name);
				}
			}
			return true;
		}).then(() => {
			callback();
			this.initialization.__resolve();
		});

		if (isFirstPWR) {
			this.constructor.__pInitialize.then(this.#prrSeqConstructor.resolve);
		}
		
		return this.initialization.__promise;
	}

	/**
	 * Находит элементы с атрибутом `sg-model`. Элементы с установленным `[SGModelView.#sgModelUUID]` игнорируются.
	 * @param {string} [modelName] - Если указан, возвращает первый найденный элемент. Иначе — массив всех
	 * @param {Element|string} [root] - Корневой элемент или CSS-селектор. По умолчанию `document.body`
	 * @param {Element[]} [_results] - Внутренний параметр для рекурсии (не передавать вручную)
	 * @returns {Element|Element[]|null} Элемент, массив элементов или `null`
	 */
	static #findElementsBySGModel(modelName = void 0, root = void 0, _results = []) {
		root = (root && (typeof root === 'string' ? document.querySelector(root) : root)) || document.body;
		if (root instanceof Element === false) {
			throw new Error(`Incorrect type of parameter "root"!`);
		}
		if (modelName && !root[SGModelView.#sgModelUUID] && root.getAttribute(SGModelView.#ATTRIBUTES.SG_MODEL) === modelName) {
			return root;
		}
		for (let child of root.children) {
			if (child[SGModelView.#sgModelUUID]) continue;
			const attrValue = child.getAttribute(SGModelView.#ATTRIBUTES.SG_MODEL);
			if (modelName && attrValue === modelName) {
				return child;
			}
			if (!modelName && attrValue) {
				_results.push(child);
			}
			const results = this.#findElementsBySGModel(modelName, child, _results);
			if (modelName && results) {
				return results;
			}
		}
		return (modelName ? null : _results);
	}

	static #isSafeCSSExpression(expr) {
		return /^[\w\s\\.\\+\-\\*\\/\\(\\)\\[\]'"&|!?:=`]+$/.test(expr) &&
			!/(window|document|eval|Function|constructor|globalThis)/.test(expr);
	}

	/**
	 * Проверить - требуется ли тег SECTION для вставляемого содержимого
	 * @param {Element} eRoot 
	 * @returns {boolean}
	 */
	static #requiredSection(eRoot) {
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
	 * @param {string|Element} [root] Example "#my_div_id" or Element object
	 * @param {boolean|string} [mTemplate] Предварительно вывести контент из шаблона (если задано SGModelView.FLAGS.IMMEDIATELY_RENDER_DEFAULT_TEMPLATE - то берётся шаблон по умолчанию)
	 */
	bindHTML(root = void 0, mTemplate = void 0) {
		if (document.readyState === 'loading') {
			throw new Error(`document.readyState = loading! ${this.getDebugInfo()}`);
		}
		if (!this.constructor.initialized) {
			throw new Error(`Manual binding must be done inside the initialize() method! ${this.getDebugInfo()}`);
		}
		this.#bindHTML(root, mTemplate);
	}
	
	/**
	 * @private
	 */
	#bindHTML(root = void 0, mTemplate = void 0) {
		this.$view = (typeof root === 'string' ? document.querySelector(root) : (root ? root : document.body));
		if (!this.$view) {
			throw new Error(`Container "${root}" does not exist! ${this.getDebugInfo()}`);
		}
		if (!this.#binderInitialized) {
			if (typeof document === 'undefined') {
				throw new Error(`window.document is undefined! ${this.getDebugInfo()}`);
			}
			this.onChangeDOMElementValue = this.#onChangeDOMElementValue.bind(this);
			this.#eventsCounter = -1;
			this.#binderInitialized = true;
		} else {
			this.#clearSGinDOM(this.$view);
		}
		
		this.$view[SGModelView.#sgModelUUID] = this.uuid;
		if (this.constructor.enablePrintingUUIDClass === true) {
			this.$view.setAttribute(SGModelView.#ATTRIBUTES.SG_UUID, `${this.constructor.name}:${this.__uid}:${this.uuid}`);
		}

		if (mTemplate && this.constructor.autoLoadBind.templateId) {
			const templateId = (mTemplate === SGModelView.FLAGS.IMMEDIATELY_RENDER_DEFAULT_TEMPLATE ? this.constructor.autoLoadBind.templateId : mTemplate);
			const template = this.constructor.templates[templateId] || document.querySelector(`template[id=${templateId}]`);
			if (!template) {
				throw new Error(`Template with ID="${templateId}" not found! ${this.getDebugInfo()}`);
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
		this.#sysThis = ['constructor', 'initialize']; // TODO: дополнить?
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
		for (const elementDOM of elements) {
			if (elementDOM[SGModelView.#sgModelUUID] && !isRoot || elementDOM.nodeType !== Node.ELEMENT_NODE) { // Пропускаем вложенные инстансы SGModel-представлений и узлы других типов
				continue;
			}
			
			const sgInNode = (elementDOM[SGModelView.#sgNameInNode] ||= {});
			
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
				throw new Error(`An attribute "sg-model" was found inside the view, which is not allowed here! ${this.getDebugInfo()}`);
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
						throw new Error(`Dropdown lists must have an id attribute (for example in a button) and an aria-labelledby attribute of the list container (for example in a <UL> tag)! ${this.getDebugInfo()}`);
					}
					const sgInList = (eList[SGModelView.#sgNameInNode] ||= {});
					sgInList.control = elementDOM;
					eList.addEventListener('click', this._dropdownItemsClick);
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
				} catch (err) {
					console.error(`Incorrect value of attribute sg-attributes: "${sgAttributes}"! ${this.getDebugInfo()}\n`, err);
				}
			}
			
			// Now attributes are implemented only for static output (only at initialization)
			if (sgValue) {
				const fFormat = this[sgFormat] || Utils.fStub;
				const method = sgValue.replace(/(\w+)(.*)/, '$1');
				if (typeof this[method] === 'function') {
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
				if (SGModelView.#isSafeCSSExpression(_sgCSS)) {
					sgInNode.css = (new Function(`return ${_sgCSS}`)).bind(this);
				} else {
					console.error(`Unsafe sg-css expression! ${this.getDebugInfo()}\nExpression: ${_sgCSS}`);
				}
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
					console.warn(`The options of SELECT element is not a array! Property: ${sgOptions}. ${this.getDebugInfo()}`);
				}
			}

			if (sgFor && sgTemplate) {
				const template = this.constructor.templates[sgTemplate];
				if (template) {
					const link = this.#regPropertyElementLink(sgFor, elementDOM, SGModelView.#LINKTYPE_FORTEMPLATE); // eslint-disable-line no-unused-vars
					sgInNode.template = template;
					if (sgItemVariables) {
						sgInNode.item_variables = Utils.parseItemVariablesLine(sgItemVariables);
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
					console.warn(`Template "${sgTemplate}" not found! Property: ${sgOptions}. ${this.getDebugInfo()}`);
				}
			}
			
			this.#bindElements(elementDOM.childNodes);
		}
	}
	
	/** @private */
	#regPropertyElementLink(name, elementDOM, linkType) {
		const links = (this.#propertyElementLinks[name] ||= []);
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
	#printItem(name, elementDOM, collection, keyOrIndex, valueOrItem, requiredSection) {
		const sgInNode = elementDOM[SGModelView.#sgNameInNode];
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
		const sgItemValue = this.#getItemHash(name, keyOrIndex, valueOrItem);
		eItem.setAttribute(SGModelView.#ATTRIBUTES.SG_ITEM, sgItemValue);
		this.#scanItemContentAndSetValues(name, eItem, keyOrIndex, valueOrItem, sgInNode.item_variables);
	}
	
	/** @private */
	#refreshElement(name) {
		for (let j = 0; j < this.#propertyElementLinks[name].length; j++) {
			const link = this.#propertyElementLinks[name][j];
			const elementDOM = link.element;
			if (!elementDOM) return false;
			const sgInNode = elementDOM[SGModelView.#sgNameInNode];
			switch (link.linkType) {
				case SGModelView.#LINKTYPE_VALUE: {
				
					const value = this.data[name];

					switch (sgInNode.type) {
						case 'dropdown': {
							const eItems = document.querySelectorAll(`[${SGModelView.#ATTRIBUTES.SG_DROPDOWN}=${name}]`);
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
									case 'radio': case 'checkbox': { elementDOM.checked = value; break; }
									case 'range': case 'select-one': { elementDOM.value = value; break; }
									case 'date': {
										const dtm = String(value).match(/(\d{4})[-./](\d{2})[-./](\d{2})/); // YYYY-MM-DD* or YYYY.MM.DD* or YYYY/MM/DD
										elementDOM.value = (dtm ? `${dtm[1]}-${dtm[2]}-${dtm[3]}` : '');
										break;
									}
									case 'datetime-local': {
										const dtm = String(value).match(/(\d{4})[-./](\d{2})[-./](\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/);
										if (dtm) {
											const [_, year, month, day, hours, mins, secs] = dtm;
											elementDOM.value = `${year}-${month}-${day}T${hours}:${mins}${secs ? `:${secs}` : ''}`; // YYYY-MM-DD HH:MM:SS
										} else {
											elementDOM.value = '';
										}
										break;
									}
									case 'time': {
										elementDOM.value = String(value).match(/(?:^|\s|T)(\d{2}:\d{2})(?::\d+)?/)?.[1]; // *HH:MM:SS* or *HH:MM* (example: 2025-01-15 12:05:30+03, 2025-01-15T12:05:30.123Z)
										break;
									}
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
							result = result.call(this, name);
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
					const requiredSection = SGModelView.#requiredSection(sgInNode.template.content);
					link.element.innerHTML = '';
					const collection = this.data[name];
					const type = this.defaults[name]?.type;
					let keyOrIndex = 0;
					if (type === SGModel.TYPES.SET) {
						for (const valueOrItem of collection) {
							this.#printItem(name, link.element, collection, keyOrIndex++, valueOrItem, requiredSection);
						}
					} else if (type === SGModel.TYPES.ARRAY || type === SGModel.TYPES.ARRAY_NUMBERS) {
						for (keyOrIndex = 0; keyOrIndex < collection.length; keyOrIndex++) {
							this.#printItem(name, link.element, collection, keyOrIndex, collection[keyOrIndex], requiredSection);
						}
					} else if (type === SGModel.TYPES.OBJECT) {
						for (keyOrIndex in collection) {
							this.#printItem(name, link.element, collection, keyOrIndex, collection[keyOrIndex], requiredSection);
						}
					} else if (type === SGModel.TYPES.MAP) {
						for (const item of collection) {
							this.#printItem(name, link.element, collection, item[0], item[1], requiredSection);
						}
					} else {
						throw new Error(`Invalid property type! ${this.getDebugInfo()}`);
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
	 * @param {string} name - Имя свойства
	 * @param {DOMElement} element
	 * @param {mixed} valueOrItem
	 */
	#scanItemContentAndSetValues(name, element, keyOrIndex, valueOrItem, sgItemVariables) {

		// @aos
		if (typeof valueOrItem !== 'object') {
			SGModelView.#objWithValue.value = valueOrItem;
			valueOrItem = SGModelView.#objWithValue;
		}
		
		if (element instanceof Element) {

			const sgInNode = (element[SGModelView.#sgNameInNode] ||= {});
			
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
						if (Utils.isObject(itemVar)) {
							if (attr.value === subProperty) {
								sgInNode.item_variables_attributes ||= {};
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
					value = (typeof this[sgFormat] === 'function' ? this[sgFormat].call(this, value) : value);
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
					value = (typeof this[sgFormat] === 'function' ? this[sgFormat].call(this, value) : value);
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
				if (propName && (typeof this[attrValue] === 'function')) {
					const result = this[attrValue].call(this, valueOrItem[propName]);
					if (result) {
						element.classList.add(result);
					}
				}
			}
		}

		for (const childNode of element.childNodes) {
			if (childNode.nodeType === Node.ELEMENT_NODE) {
				this.#scanItemContentAndSetValues(name, childNode, keyOrIndex, valueOrItem, sgItemVariables);
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
		const sgInNode = elem[SGModelView.#sgNameInNode];
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
					const _sgInNode = _elem[SGModelView.#sgNameInNode];
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
			const sgInParentNode = eItem.parentNode[SGModelView.#sgNameInNode];
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
	 * Overrides the **SGModel->set** method
	 * @override
	 */
	set(name, valueOrCollection, options = Utils.OBJECT_EMPTY, flags = 0, event = void 0, elem = void 0) { // eslint-disable-line no-unused-vars
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
	clear(options = void 0, flags = 0) {
		const changed = super.clear(options, flags, (name) => {
			this.#sarc(name, true);
		});
		return changed;
	}

	/** @private */
	#getForItemCalc(result, sgItemValue, keyOrIndex, valueOrItem) {
		const hash = this.#getItemHash(result.property, keyOrIndex, valueOrItem);
		if (sgItemValue === hash) {
			if (Utils.isObject(valueOrItem)) {
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
	#getItemHash(name, keyOrIndex, valueOrItem, type = void 0) {
		type = type || this.defaults[name]?.type;
		if (type === SGModel.TYPES.ARRAY || type === SGModel.TYPES.OBJECT || type === SGModel.TYPES.SET || type === SGModel.TYPES.MAP) {
			let keyName = 'index';
			let keyValue = keyOrIndex;
			if (Utils.isObject(valueOrItem)) {
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
			const hash = Utils.sha256trimL(`${this.uuid}:${name}:${keyName}:${keyValue}`);
			return `${keyName}:${keyValue}:${hash}`;
		} else if (type === SGModel.TYPES.ARRAY_NUMBERS) {
			const hash = Utils.sha256trimL(`${this.uuid}:${name}:index:${keyOrIndex}`);
			return `index:${keyOrIndex}:${hash}`;
		}
		throw new Error(`The property "${name}" does not support data type "${SGModel.TYPES[type]}"! ${this.getDebugInfo()}`);
	}

	/**
	 * Получить данные элемента/записи коллекции
	 * @param {Event|Element} eventOrElement
	 * @returns {object} Вернёт объект: { key {string}, value {mixed}, item {mixed}, collection, property {string}, type {SGModel.TYPES.%}, $item {Element}, $control {Element}, hash {string} }, где:
	 *	key - либо индекс элемента для массивов/Set-коллекции, либо имя свойства объекта или ключа элемента Map-коллекции
	 *	value - значение элемента коллекции. Для keyName='index' преобразуется к Number, для keyName='id' преобразуется к BigInt
	 *	item - запись коллекции (для массивов или Set-коллекции равно **value**)
	 *	collection - сама коллекция
	 *	property - имя свойства в атрибуте sg-for
	 *	type - тип данных (SGModel.TYPES.ARRAY|SGModel.TYPES.ARRAY_NUMBERS|SGModel.TYPES.OBJECT|SGModel.TYPES.SET|SGModel.TYPES.MAP)	
	 *	keyName - имя ключа (м.б. id, uuid, code, hash или index)
	 *	$item - корневой DOM-элемент записи
	 *	$control - DOM-элемент, на который нажал пользователь, например, BUTTON
	 *	hash - хэш записи (ключа)
	 */
	getForItem(eventOrElement) {
		const $control = (eventOrElement instanceof Event ? eventOrElement.target : eventOrElement);
		eventOrElement = $control;
		if ($control instanceof Element) {
			while (eventOrElement) {
				if (eventOrElement[SGModelView.#sgModelUUID]) {
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
					result.type = this.defaults[result.property]?.type;
					let keyOrIndex = 0;
					if (result.type === SGModel.TYPES.SET) {
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
					} else if (result.type === SGModel.TYPES.ARRAY || result.type === SGModel.TYPES.ARRAY_NUMBERS) {
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
					} else if (result.type === SGModel.TYPES.OBJECT) {
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
					} else if (result.type === SGModel.TYPES.MAP) {
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
						throw new Error(`Invalid property type! ${this.getDebugInfo()}`);
					}
					return result;
				}
				eventOrElement = eventOrElement.parentElement;
			}
		}
		throw new Error(`Invalid parameter "eventOrElement"! ${this.getDebugInfo()}`);
	}

	/**
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
				this.deferredProperties.add(name);
			}
		}
		return changed;
	}

	/**
	 * @override
	 */
	 trigger(name, value = void 0, flags = 0) {
		super.trigger.call(this, name, value, flags);
		this.#sarc(name, true);
	}

	/**
	 * Очистить DOM-элементы представления от __sg, sg-uuid и sg-item. Удалить подписчики на события.
	 * @private
	 */
	#clearSGinDOM(root) {
		let name, item;
		for (name in this.#propertyElementLinks) {
			this.#propertyElementLinks[name].forEach(link => {
				if (link.linkType === SGModelView.#LINKTYPE_VALUE) {
					link.element.removeEventListener('change', this.onChangeDOMElementValue);
					link.element.removeEventListener('input', this.onChangeDOMElementValue);
				}
			});
			delete this.#propertyElementLinks[name];
		}
		while (item = this.#elementsEvents.pop()) { // eslint-disable-line no-cond-assign
			item.element.removeEventListener(item.event, item.callback);
		}
		if (root instanceof Element) {
			delete root[SGModelView.#sgNameInNode];
			delete root[SGModelView.#sgModelUUID];
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
	 * Вызвать родительский destroy() и удалить HTML-элементы представления
	 * @param {number} [flags]
	 */
	destroy(flags = 0) {
		super.destroy(flags);
		if (this.$view) {
			if (flags & SGModelView.FLAGS.DESTROY_AND_SAVE_DOM) {
				this.#clearSGinDOM(this.$view);
			} else {
				this.$view.remove();
			}
		}
	}
}

if (typeof globalThis === 'object' && globalThis !== null) globalThis.SGModelView = SGModelView;
if (Utils.isNode && typeof module === 'object') module.exports = SGModelView; // eslint-disable-line no-undef
else if (Utils.isBrowser) window['SGModelView'] = SGModelView;

export default SGModelView;

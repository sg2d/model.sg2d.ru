"use strict";

/*!
 * SGDevTools - Вспомогательные инструменты для отладки (отладочная система для SGModelView)
 * @version 1.1.2
 * @requires ES2025+ (ES16+)
 * @link https://github.com/sg2d/model.sg2d.ru
 * @license SGDevTools may be freely distributed under the MIT license
 * @copyright 2019-2026 © Калашников Илья (https://model.sg2d.ru, sg2d@yandex.ru)
 */
class SGDevTools {

	static temp = null;

	static _init(SGModelView) {
		this.SGModelView = SGModelView;
		this.#fInstanceByElement();
	}

	/**
	 * Инициализация функции проверки инстанса по HTML-элементу:
	 * 	Если нажать клавишу '~', а затем в течение 5 секунд кликнуть кнопкой мыши по любому HTML-элементу страницы,
	 *	то в консоли отобразится отладочная информация об SGModelView-инстансе,
	 * 	во вьюхе которого присутствует интересуемый HTML-элемент, а также информация обо всех sg-атрибутах в HTML-элементе.
	 * 	P.S: Список инстансов в SGModelView.__instances, корневой HTML-элемент вьюхи - this.$view
	 */
	static #fInstanceByElement() {
		let debugMode = false;
		let debugTimeout = null;
		const handleKeyDown = (event) => {
			if (event.altKey && event.code === 'Backquote') {
				debugMode = true;
				console.debug('🔍 SGModelView Debug Mode: You pressed Alt + ` (~). Now click left mouse button on any HTML element within 5 seconds');
				if (debugTimeout) {
					clearTimeout(debugTimeout);
				}
				debugTimeout = setTimeout(() => {
					debugMode = false;
					console.debug('	|- ⏰ SGModelView Debug Mode: Time expired');
				}, 5000);
				
				event.preventDefault();
			}
		};
		const handleClick = (event) => {
			if (!debugMode) return;
			event.preventDefault(); // Предотвращает стандартное поведение элемента (например, переход по ссылке, отправку формы)
			event.stopPropagation(); // Останавливает всплытие события к родительским элементам
			event.stopImmediatePropagation(); // Останавливает выполнение всех остальных обработчиков, привязанных к этому элементу
			debugMode = false;
			if (debugTimeout) {
				clearTimeout(debugTimeout);
				debugTimeout = null;
			}
			const clickedElement = event.target;
			let foundInstance = null;
			let foundSGAttributes = {};
			for (const [attrName,] of Object.entries(this.SGModelView.ATTRIBUTES)) {
				const value = clickedElement.getAttribute(attrName);
				if (value) {
					foundSGAttributes[attrName] = value;
				}
			}
			let currentElement = clickedElement;
			while (currentElement && currentElement !== document.body) {
				const sgModelUUID = this.SGModelView.getElementUUID(currentElement);
				if (sgModelUUID) {
					foundInstance = this.SGModelView.__instances[sgModelUUID];
					break;
				}
				currentElement = currentElement.parentElement;
			}
			if (foundInstance) {
				this.temp = foundInstance;
				console.group('📋 SGModelView Debug Info');
				console.debug('🎯 Clicked element:', clickedElement);
				console.debug(`🏷️ Class: ${foundInstance.constructor.name}, UUID=${foundInstance.uuid}, __uid=${foundInstance.__uid}`);
				console.debug('🌳 Root view element:', foundInstance.$view);
				if (Object.keys(foundSGAttributes).length > 0) {
					console.debug('🏷️ SG attributes of element:', foundSGAttributes);
				} else {
					console.debug('❌ SG attributes: none');
				}
				console.debug('💾 Instance data:', foundInstance.getData());
				console.debug('🔧 Instance:', foundInstance);
				console.debug('💡 SGModelView.dev.temp contains a reference to the found SGModelView instance');
				console.groupEnd();
			} else {
				this.temp = null;
				console.debug('❌ SGModelView Debug: Element ' + clickedElement + ' does not belong to any SGModelView instance');
				if (Object.keys(foundSGAttributes).length > 0) {
					console.debug('🏷️ Found SG attributes:', foundSGAttributes);
				}
			}
		};
		if (typeof document !== 'undefined') {
			document.addEventListener('keydown', handleKeyDown);
			document.addEventListener('click', handleClick, { capture: true }); // Используем capture=true чтобы handleClick в Capture Phase (фаза захвата - событие спускается от корня документа к целевому элементу, фаза всплытия (Bubble Phase) - событие поднимается от целевого элемента к корню (по умолчанию))
		}
		console.debug(`Activate temporary debug mode: Press Alt + '~' (backtick), you will have 5 seconds to click on any HTML element.`);
	}
}

export default SGDevTools;

import SGModelView from './../../sg-model-view.js';

async function creator() {
	class CustomView extends SGModelView {
		static defaultProperties = {
			rate: 0,
			hours: 0,
			salary: 0,
		};
		async initialize() {
			// создаём подписку на изменение свойств rate и hours
			this.on(['rate', 'hours'], () => (this.data.salary = this.data.rate * this.data.hours));
		}
	}
	const view = new CustomView({ uuid: '00000000-0000-0000-0000-7bc5a6105853' });
	view.data.rate = 3000; // синхронное присваивание (сразу после вызова конструктора new CustomView())
	view.data.hours = 8 * 20;
	const beforeValue = view.data.salary; // здесь д.б. пока ещё 0
	await view.initialization.promise; // ждём инициализацию
	const afterValue = view.data.salary; // проверяем
	return prepareTests(CustomView, view, beforeValue, afterValue);
}

function prepareTests(CustomView, view, beforeValue, afterValue) {
	return {
		class: CustomView,
		instance: view,
		code: 'sgmodelview-deferred-properties-checkers',
		title: 'SGModelView: проверка отложенной обработки изменения значения свойств при инициализации инстанса',
		sourceCode: creator,
		items: [
			{
				code: 'sgmodelview-deferred-properties__basic',
				title: 'подписчик this.on() выполнится сразу при его регистрации (создании)',
				input: view,
				runner: async () => ({ beforeValue: beforeValue, afterValue: afterValue }),
				verify: { beforeValue: 0, afterValue: 480000 },
			},
		]
	};
};

export default creator;
import SGModelView from './../../sg-model-view.js';

async function runner() {
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
	// Делаем синхронное присваивание (сразу после вызова конструктора new CustomView())
	view.data.rate = 3000;
	view.data.hours = 8 * 20;
	const beforeValue = view.data.salary; // Здесь д.б. пока ещё 0
	await view.initialization.promise;
	const afterValue = view.data.salary;
	return prepareTests(CustomView, view, beforeValue, afterValue);
}

function prepareTests(CustomView, view, beforeValue, afterValue) {
	return {
		code: 'sgmodelview-deferred-properties-checkers',
		title: 'SGModelView: проверка отложенной обработки изменения значения свойств при инициализации инстанса',
		sourceCode: runner,
		items: [
			{
				code: 'sgmodelview-deferred-properties__basic',
				title: 'подписчик this.on() выполнит отложенный расчёт this.data.salary',
				input: view,
				runner: async () => ({ beforeValue: beforeValue, afterValue: afterValue }),
				verify: { beforeValue: 0, afterValue: 480000 },
			},
		]
	};
};

export default runner;
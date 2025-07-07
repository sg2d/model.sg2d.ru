import SGModel from './../../sg-model.js';

const moduleCode = new URL(import.meta.url).pathname.split('/').pop().replace(/\.[^/.]+$/, '');

async function creator() {
	class CustomDeferredModel extends SGModel {
		static defaults = {
			rate: 0,
			hours: 0,
			salary: 0,
		};
		async initialize() {
			// создаём подписку на изменение свойств rate и hours
			this.on(['rate', 'hours'], () => (this.data.salary = this.data.rate * this.data.hours));
		}
	}
	const model = new CustomDeferredModel({ uuid: '00000000-0000-0000-0000-7bc5a6105853' });
	model.data.rate = 3000; // синхронное присваивание (сразу после вызова конструктора new CustomDeferredView())
	model.data.hours = 8 * 20;
	const beforeValue = model.data.salary; // здесь д.б. пока ещё 0
	await model.initialization; // ждём инициализацию
	const afterValue = model.data.salary; // проверяем
	return await prepareTests({CustomDeferredModel, model, beforeValue, afterValue});
}

async function prepareTests({CustomDeferredModel, model, beforeValue, afterValue}) {
	let testCode;
	return {
		class: CustomDeferredModel,
		instance: model,
		code: moduleCode,
		title: 'SGModel: проверка отложенной обработки изменения значения свойств при инициализации инстанса',
		sourceCode: creator,
		items: [
			{
				code: (testCode = 'basic',`${moduleCode}__${testCode}`),
				title: 'подписчик this.on() выполнится сразу при его регистрации (создании)',
				input: model,
				runner: async () => ({ beforeValue: beforeValue, afterValue: afterValue }),
				verify: { beforeValue: 0, afterValue: 480000 },
			},
		]
	};
};

export default creator;
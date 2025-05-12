import SGModel from './../../sg-model.js';

// TODO?:
//import json1 from './json/sgmodel-basic-checkers__auto-type-properties.json' assert { type: 'json' }; // TODO: ES2025

const moduleCode = new URL(import.meta.url).pathname.split('/').pop().replace(/\.[^/.]+$/, '');

let temp;

async function creator() {

	let counter = 0;
	class SubCustomModel extends SGModel {
		static defaults = () => {
			return { index: counter++ };
		}
	}

	class SubCustomModelStorage extends SGModel {
		static storageProperties = ['property2', 'subPropModel1', 'subPropModel2'];
		static allowUndeclaredProperties = true; // TODO: отдельный тест
		static defaults = {
			property1: 12345,
			property2: 'text3',
		}
	}

	class CustomClass {
		static staticProp1 = 12;
		instanceProp1 = 'ggg';
		constructor(options) {
			this.options = options;
		}
	}

	const instanceCustomClass = new CustomClass({ option1: 'optionValue1' });

	class CustomModel extends SGModel {
		static defaults = {
			voidProperty: undefined,
			nullProperty: null,
			numberProperty0: 0,
			numberProperty: 3.141592654,
			stringPropertyEmpty: '',
			stringProperty: 'text',
			booleanProperty0: false,
			booleanProperty: true,
			functionAnonProperty: () => {
				return 3.141592654;
			},
			functionNameProperty: function fName(a) {
				return a + a;
			},
			classProperty: CustomClass, // класс не базирующийся на SGModel
			instanceCustomClass: instanceCustomClass, // инстанс не базирующийся на SGModel
			xyProperty0: { x: 0, y: 0 },
			xyProperty: { x: 128, y: 256 },
			objectPropertyEmpty: {},
			objectProperty: { a: 'a1', b: 'bb22' },
			arrayPropertyEmpty: SGModel.TYPES.ARRAY,
			arrayProperty: ['999', 666, 'repeat_text', 333, 666, 'repeat_text'],
			arrayNumbersPropertyEmpty: { value: [], type: SGModel.TYPES.ARRAY_NUMBERS },
			arrayNumbersProperty: { value: [1, 22, 333, '+4444.44', '555,55', '-6 666,66', 'some text2...'], type: SGModel.TYPES.ARRAY_NUMBERS },
			setPropertyEmpty: new Set(),
			setProperty: new Set([400,303]),
			mapPropertyEmpty: SGModel.TYPES.MAP,
			mapProperty: new Map([["id", 333],["code", "code1"]]),
			arrayModelPropertyEmpty: SGModel.TYPES.ARRAY_MODEL,
			arrayModelProperty: [[new SubCustomModel(void 0, void 0, { uuid: '00000000-0000-0000-0000-3066eb5090f1' })], SGModel.TYPES.ARRAY_MODEL],
			modelPropertyEmpty: SGModel.TYPES.MODEL, // SubCustomModel заменится на null при автотипизации
			modelProperty: new SubCustomModel(void 0, void 0, { uuid: '00000000-0000-0000-0000-3066eb5090f2' }),
			_noSaveToStorageProperty: 12345,
		};
		async initialize() {
			this.on('numberProperty2', (newValue) => {
				this.data.stringProperty2 = `numberProperty2 changed to ${newValue}`;
			});
		}
		subscribeWork() {
			this.data.numberProperty2 = 2 * Math.sqrt(this.data.xyProperty.x ** 2 + this.data.xyProperty.y ** 2) * this.data.numberProperty; // Формула длины окружности (периметр окружности)
		}
		collectionWork() {
			this.data.objectProperty = { a: 'a1_change', c: 'ccc333' };
			this.addTo('objectProperty', 'value3', 'v');
			this.removeFrom('objectProperty', 'c');
			this.data.arrayProperty = ['999', 666, 'repeat_text2', 33, 666, 'repeat_text', 777],
			this.addTo('arrayProperty', 5000);
			this.removeFrom('arrayProperty', 3);
			this.data.setProperty = [303, 304];
			this.addTo('setProperty', 500);
			this.removeFrom('setProperty', 303);
			this.data.mapProperty = { id: 333, name: 'name1' };
			this.addTo('mapProperty', 'Description...', 'description');
			this.removeFrom('mapProperty', 'id');
			return { // TODO?: получить признак изменения (changed)
				objectProperty: this.data.objectProperty,
				arrayProperty: this.data.arrayProperty,
				setProperty: this.data.setProperty,
				mapProperty: this.data.mapProperty,
			};
		}
		clearWork() {
			model.clear();
			return {
				destroyed: this.destroyed, // там есть [[Circular reference]] на главный тестируемый инстанс. Проверяем рекурсивный destroy()
				data: this.data,
			};
		}
		clearToDefaultsWork() {
			model.clearToDefaults();
			return {
				data: this.data,
				destroyed: this.destroyed,
			}
		}
		setVariousValues() {
			const results = {};
			class SimpleClass { constructor(a, b = 64) { this.c = a + b; }};
			Object.entries({
				'null': null,
				'string': '',
				'number': 0,
				'NaN': NaN,
				'Infinity': Infinity,
				'object': () => ({}),
				'array': () => ([]),
				'set': () => (new Set()),
				'map': () => (new Map()),
				'instance': () => (new SimpleClass(16)),
				'function': () => (() => {}),
				'class': () => (class TempClass {}),
				'undefined': void 0,
			}).forEach(([key, value]) => {
				const data = results[key] = {};
				for (const name in this.data) {
					try {
						this.data[name] = typeof value === 'function' ? value() : value;
						data[name] = SGModel.utils.clone(this.data[name]);
						this.data[name] = this.defaults[name].type(); // clear
					} catch (err) {
						data[name] = err.message;
					}
				}
			});
			return results;
		}
	}

	const modelProperty = new SubCustomModel(void 0, void 0, { uuid: '00000000-0000-0000-0000-3066eb5090f3' });

	// Передаём в конструктор дополнительные свойства, причём бОльшая часть свойств не значится в свойствах по умолчанию
	const model = new CustomModel({
		uuid: '00000000-0000-0000-0000-3066eb5090f4', // задаём постоянный uuid, что бы получить всегда один и тот же снимок объекта
		voidProperty2: undefined,
		nullProperty2: null,
		numberProperty2: 2**16,
		stringProperty: 'text0 (overridding!)', // stringProperty должен перезаписаться новым значением
		stringProperty2: 'loading...',
		booleanProperty2: true,
		functionAnonProperty2: (a, b, c) => {
			return a * b / c;
		},
		functionNameProperty2: function fName2(a, b = 100) {
			return a * b;
		},
		classProperty2: CustomClass,
		instanceClassProperty2: instanceCustomClass,
		xyProperty2: { x: 192, y: 64 },
		objectProperty2: { prop1: 5, prop2: '33', prop3: { subprop1: 10 }, prop4: [66, 40] },
		arrayProperty2: [70, 'text1', 70, 'text1', 50],
		arrayNumbersProperty2: { value: [256, '512a', 'some text22'], type: SGModel.TYPES.ARRAY_NUMBERS },
		setProperty2: new Set([22, 'text2', { prop1: 500, prop2: '200' }]),
		mapProperty2: new Map([[30, 'text3'],['user25', { name: 'Ilya' }]]),
		mapPropertyEmpty2: SGModel.TYPES.MAP,
		modelProperty2: modelProperty,
		arrayModelProperty2: [
			new SubCustomModel(void 0, void 0, { uuid: '00000000-0000-0000-0000-3066eb5090f5' }),
			new SubCustomModelStorage({
				subPropFunc: (_) => {},
				subPropModel1: modelProperty,
				//subPropModel2 см. ниже (проверка на [[Circular reference]])
			}, void 0, { uuid: '00000000-0000-0000-0000-3066eb5090f6' }),
			modelProperty,
		],
		_noSaveToStorageProperty2: '54321', // не сохраняемое в хранилище свойство _noSaveToStorageProperty2
	}, {
		// no options
	}, {
		thisData1: new Date('2025-01-01T00:00:00+03:00'),
		thisData2: [10, -20, 10, 40.5, '10'],
		thisData3: Array.from({length: 3}, (_, index) => 2**(10 - index)),
		thisData4: modelProperty,
		thisData5: instanceCustomClass,
	});

	// Добавляем новое свойство - тип будет определён автоматически по значению
	model.data.arrayModelProperty2[1].set('subPropModel2', model); // +проверим на [[Circular reference]]

	await model.initialization;
	return await prepareTests({CustomModel, model});
}

async function prepareTests({CustomModel, model}) {
	let testCode;
	return {
		class: CustomModel,
		instance: model,
		code: moduleCode,
		title: 'SGModel: базовые проверки',
		sourceCode: creator,
		items: [
			{ // 1.1
				code: (testCode = 'auto-type-properties',`${moduleCode}__${testCode}`),
				title: 'автоматическая типизация свойств модели на основе: <code>static defaults = {...}</code>',
				input: model,
				runner: async (model) => ({ defTypes: SGModel.json.debug(model.defaults) }),
				verify: await window.loadJSON(moduleCode, testCode),
				//skip: true, // пропустить тест
				//break: true, // прервать группу тестов
			},
			{ // 1.2
				code: (testCode = 'tojson',`${moduleCode}__${testCode}`),
				title: 'получение корректного объекта для сериализации: <code>const obj = this.toJSON()</code>',
				input: model,
				runner: async (model) => model.toJSON(),
				verify: (
					temp = await window.loadJSON(moduleCode, testCode),
					temp?.['[[class CustomModel]]'] && (temp['[[class CustomModel]]'].__hash = model.constructor.__hash),
					temp
				),
				//skip: true,
			},
			{ // 1.3
				code: (testCode = 'tojsondebug',`${moduleCode}__${testCode}`),
				title: 'получение отладочного объекта для сериализации (+функции, +типы): <code>SGJson.debug(model)</code>',
				input: model,
				runner: async (model) => SGModel.json.debug(model),
				verify: (
					temp = await window.loadJSON(moduleCode, testCode),
					temp?.['[[class CustomModel]]'] && (temp['[[class CustomModel]]'].__hash = model.constructor.__hash),
					temp
				),
				//break: true,
			},
			{ // 1.4
				code: (testCode = 'subscribe',`${moduleCode}__${testCode}`),
				title: 'подписка на изменение значения свойства: <code>this.on(\'numberProperty2\', () => {...})</code>',
				input: model,
				runner: async (model) => (model.subscribeWork(), model.data.stringProperty2),
				verify: 'numberProperty2 changed to 1798.3525713812421',
			},
			{ // 1.5
				code: (testCode = 'getdata',`${moduleCode}__${testCode}`),
				title: 'получение данных для сохранения в localStorage или БД без пустых значений: <code>getData()</code>',
				input: model,
				runner: async (model) => model.getData(),
				verify: await window.loadJSON(moduleCode, testCode),
			},
			{ // 1.6
				code: (testCode = 'getdatawithempty',`${moduleCode}__${testCode}`),
				title: 'получение данных для сохранения в localStorage или БД с пустыми значениями: <code>getData(flags)</code>',
				input: model,
				runner: async (model) => model.getData(SGModel.json.FLAGS.WITH_EMPTIES),
				verify: await window.loadJSON(moduleCode, testCode),
			},
			{ // 1.7
				code: (testCode = 'getalldata',`${moduleCode}__${testCode}`),
				title: 'получение всех данных с декларациями функций - <code>getData(flags)</code>',
				input: model,
				runner: async (model) => model.getData(SGModel.json.FLAGS.ALL_ATTRIBUTES | SGModel.json.FLAGS.FUNCTION_DECLARATION | SGModel.json.FLAGS.WITH_EMPTIES),
				verify: await window.loadJSON(moduleCode, testCode),
			},
			{ // 1.8
				code: (testCode = 'collection',`${moduleCode}__${testCode}`),
				title: 'работа с коллекциями: детекция изменений, форматирование, добавление/удаление/очистка',
				input: model,
				runner: async (model) => (SGModel.json.debug(model.collectionWork())),
				verify: await window.loadJSON(moduleCode, testCode),
			},
			{ // 1.9
				code: (testCode = 'clear',`${moduleCode}__${testCode}`),
				title: 'очистка свойств (+из-за рекурсивной ссылки на исходный инстанс увы сейчас делается destroy()!)',
				input: model,
				runner: async (model) => (SGModel.json.debug(model.clearWork())),
				verify: await window.loadJSON(moduleCode, testCode),
			},
			{ // 1.10
				code: (testCode = 'cleartodefaults',`${moduleCode}__${testCode}`),
				title: 'очистка свойств значениями по умолчанию',
				input: model,
				runner: async (model) => (SGModel.json.debug(model.clearToDefaultsWork())),
				verify: await window.loadJSON(moduleCode, testCode),
			},
			{ // 1.11
				code: (testCode = 'set-various-values',`${moduleCode}__${testCode}`),
				title: 'обработка типами данных различных значений',
				input: model,
				runner: async (model) => (SGModel.json.debug(model.setVariousValues())),
				verify: await window.loadJSON(moduleCode, testCode),
			},
			{ // 1.99
				code: (testCode = 'tojsonfinish',`${moduleCode}__${testCode}`),
				title: 'последняя проверка инстанса: <code>SGJson.debug(model)()</code>',
				input: model,
				runner: async (model) => SGModel.json.debug(model),
				verify: (
					temp = await window.loadJSON(moduleCode, testCode),
					temp?.['[[class CustomModel]]'] && (temp['[[class CustomModel]]'].__hash = model.constructor.__hash),
					temp
				),
			},
		]
	};
};

export default creator;
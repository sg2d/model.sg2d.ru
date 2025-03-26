import SGModel from './../../sg-model.js';

async function runner() {

	class SimpleModel extends SGModel {
		static defaultProperties = {
			voidProperty: undefined,
			nullProperty: null,
			numberProperty: 3.141592654,
			stringProperty: 'text',
			booleanProperty: false,
			functionProperty: (a, b) => {
				return a + b;
			},
			xyProperty: { x: 128, y: 256 },
			objectProperty: {},
			arrayProperty: [],
			setProperty: new Set(),
			mapProperty: new Map(),
			_noSaveToStorageProperty: 12345,
		};
		async initialize() {
			this.on('numberProperty2', (newValue) => {
				this.data.stringProperty2 = `numberProperty2 changed to ${newValue}`;
			});
			return super.initialize();
		}
		customMethod() {
			this.data.numberProperty2 = 2 * Math.sqrt(this.data.xyProperty.x ** 2 + this.data.xyProperty.y ** 2) * this.data.numberProperty; // Формула длины окружности (периметр окружности)
			return this.data.numberProperty2;
		}
	}

	// Передаём в конструктор дополнительные свойства, причём:
	// + бОльшая часть свойств не значится в свойствах по умолчанию
	// + задаём постоянный uuid, что бы получить всегда один и тот же снимок объекта
	// + stringProperty должен перезаписаться новым значением
	// + не сохраняемое в хранилище свойство _noSaveToStorageProperty2
	const simpleModel = new SimpleModel({
		uuid: 'a960ab68-95ef-4c5b-a1cb-3066eb5090f6',
		voidProperty2: undefined,
		nullProperty2: null,
		numberProperty2: 2**16,
		stringProperty: 'text (overridding!)',
		stringProperty2: 'loading...',
		booleanProperty2: true,
		functionProperty2: (a, b) => {
			return a * b;
		},
		xyProperty2: { x: 192, y: 64 },
		objectProperty2: {},
		arrayProperty2: [],
		setProperty2: new Set(),
		mapProperty2: new Map(),
		_noSaveToStorageProperty2: '54321',
	}, {

	}, {
		thisData1: new Date('2025-01-01T00:00:00+03:00'),
		thisData2: Array.from({length: 10}, (_, index) => 2**(10 - index)),
	});

	await window.sleep(10); // ms // ждём что бы this.initialized стал fulfilled (выполнился this.initialize())
	return prepareTests(SimpleModel, simpleModel);
}

function prepareTests(SimpleModel, simpleModel) {
	return {
		title: 'SGModel: базовые проверки',
		code: runner,
		items: [
			{
				title: 'автоматическая типизация свойств модели на основе: <code>static defaultProperties = {...}</code>',
				input: simpleModel,
				runner: () => ({ typeProperties: SimpleModel.typeProperties }),
				verify: { typeProperties: { 'voidProperty': 0, 'nullProperty': 0, 'numberProperty': 1, 'stringProperty': 2, 'booleanProperty': 3, 'functionProperty': 4, 'xyProperty': 6, 'objectProperty': 6, 'arrayProperty': 7, 'setProperty': 10, 'mapProperty': 11, '_noSaveToStorageProperty': 1 }},
			},
			{
				title: 'получение корректного объекта для сериализации: <code>const obj = this.toJSON()</code>',
				input: simpleModel,
				runner: (srcObject) => srcObject.toJSON(),
				// @minify https://www.toptal.com/developers/javascript-minifier
				verify: {data:{nullProperty2:null,numberProperty2:65536,stringProperty:"text (overridding!)",stringProperty2:"loading...",booleanProperty2:!0,xyProperty2:{x:192,y:64},objectProperty2:{},arrayProperty2:[],setProperty2:{},mapProperty2:{},_noSaveToStorageProperty2:"54321",nullProperty:null,numberProperty:3.141592654,booleanProperty:!1,xyProperty:{x:128,y:256},objectProperty:{},arrayProperty:[],setProperty:{},mapProperty:{},_noSaveToStorageProperty:12345},__class:{name:"SimpleModel",__prototype:{name:"SGModel",version:"1.0.10",isNode:!1,isBrowser:!0}},__uid:1,initialized:!0,changed:!1,destroyed:!1,thisData1:"2024-12-31T21:00:00.000Z",thisData2:[1024,512,256,128,64,32,16,8,4,2],uuid:"a960ab68-95ef-4c5b-a1cb-3066eb5090f6",options:{}},
			},
			{
				title: 'подписка на изменение значения свойства: <code>this.on(\'numberProperty2\', () => {...})</code>',
				input: simpleModel,
				runner: (srcObject) => (srcObject.customMethod(), srcObject.data.stringProperty2),
				verify: 'numberProperty2 changed to 1798.3525713812421',
			},
			{
				title: 'получение данных для сохранения в localStorage или БД: <code>const data = this.getData()</code>',
				input: simpleModel,
				runner: (srcObject) => srcObject.getData(),
				verify: {numberProperty2:1798.3525713812421,stringProperty:"text (overridding!)",stringProperty2:"numberProperty2 changed to 1798.3525713812421",booleanProperty2:!0,xyProperty2:{x:192,y:64},objectProperty2:{},arrayProperty2:[],setProperty2:{},mapProperty2:{},numberProperty:3.141592654,xyProperty:{x:128,y:256},objectProperty:{},arrayProperty:[],setProperty:{},mapProperty:{}},
			}
		]
	};
};

export default runner;
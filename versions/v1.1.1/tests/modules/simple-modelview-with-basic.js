import SGModelView from './../../sg-model-view.js';

const moduleCode = new URL(import.meta.url).pathname.split('/').pop().replace(/\.[^/.]+$/, '');

async function creator() {
	class CustomView extends SGModelView {
		static singleInstance = true;
		static autoLoadBind = {
			srcHTML: 'modules/templates/simple-modelview-with-basic.html',
		};
		static defaults = {
			contract: 's',
			contracts: {},
			rate: 1000,
			rate_with_discount_with_rang: 1000,
			hours: 160,
			discountPer: 0, // %, для проверки sg-css
			salary: 0, // для проверки sg-format
			position_id: 0,
			position_info: '[выберите должность в таблице внизу]',
			rang: 2,
			employment: 1,
			employment_info: '',
			employments: [
				{ hours: 2 * 20, title: '2 часа/день' },
				{ hours: 4 * 20, title: '4 часа/день' },
				{ hours: 5 * 20, title: '5 часов/день' },
				{ hours: 6 * 20, title: '6 часов/день' },
				{ hours: 7 * 20, title: '7 часов/день' },
				{ hours: 8 * 20, title: 'фуллтайм' },
			],
			rangs: [ // для проверки sg-options
				{ value: 0, title: 'Trainee (-50%)', koef: -0.5, hint: 'Стажёр' },
				{ value: 1, title: 'Junior (-25%)', koef: -0.25 },
				{ value: 2, title: 'Middle', koef: 0 },
				{ value: 3, title: 'Senior (+25%)', koef: 0.25 },
				{ value: 4, title: 'TechLead (+50%)', koef: 0.5 },
			],
			positions: [ // для проверки sg-for и в UI элементов коллекции sg-property (в т.ч. sg-property="checked")
				{ id: 1, name: 'Frontend-developer', middleRate: 1000, checked: false },
				{ id: 2, name: 'Backend-developer', middleRate: 1500, checked: false },
				{ id: 3, name: 'Fullstack-developer', middleRate: 2000, checked: false },
				{ id: 4, name: 'Devops', middleRate: 2000, checked: false },
				{ id: 5, name: 'TeamLead', middleRate: 3000, checked: false },
			],
			_input_type: 'radio', // для проверки sg-item-variables
		};
		static CONTRACTS = [ // для проверки динамического форммирования элементов sg-dropdown (а также сопутствующей коллекции)
			['l',	-15,	'labor',			'Трудовой договор, в т.ч. по совм.'],
			['g',	-10,	'gph',				'Договор ГПХ с физ.лицом'],
			['s',	0,		'self',				'Самозанятый (договор услуг)'],
			['i',	+15,	'ip',					'Индивидуальный предприниматель'],
			['c',	+50,	'crypta',			'Оплата криптовалютой'],
			['f',	+100,	'freelance',	'Фриланс + Безопасная сделка'],
		];
		async initialize() {
			this.on('employment', (employment) => {
				this.data.hours = this.data.employments[employment].hours;
				this.data.employment_info = this.data.employments[employment].title;
			});
			this.on(['rate', 'discountPer', 'rang', 'contract'], () => {
				const oRang = this.data.rangs[this.data.rang];
				const ctr = this.data.contracts[this.data.contract];
				this.data.rate_with_discount_with_rang = SGModelView.utils.roundTo(this.data.rate * (1 + oRang.koef) * (1 + this.data.discountPer / 100) * (1 + ctr.discount/100));
			});
			this.on(['rate_with_discount_with_rang','hours'], () => {
				this.data.salary = this.data.rate_with_discount_with_rang * this.data.hours;
			});
			this.trigger('employment');
			this.trigger('hours');
			// Динамически заполняем коллекцию типа SGModel.TYPES.OBJECTS для sg-dropdown
			const { resolve } = this.prrContracts = Promise.withResolvers();
			setTimeout(async () => {
				this.data.contracts = CustomView.CONTRACTS.reduce((result, ctr) => {
					result[ctr[0]] = {
						discount: ctr[1],
						shortCode: ctr[2],
						title: ctr[3],
						discountText: ctr[1] === 0 ? '' : (ctr[1] > 0 ? `+${ctr[1]}%` : `${ctr[1]}%`),
					};
					return result;
				}, {});
				this.trigger('contract'); // TODO?: при обновлении sg-dropdown-элементов обновить связанный контрол с sg-dropdown? м.б. тогда и не нужно делать this.trigger('contract')
				// TODO?: А зачем вообще в пунтах li атрибут sg-dropdown="contract", м.б. onclick вытащить на уровень UL ?
				resolve();
			}, 100); // Имитируем асинхронную загрузку данных с сервера
		}
		onClickChangeDiscountPer(evt) { // для проверки sg-click
			this.data.discountPer += Number(evt.target.dataset.dir);
			this.data.discountPer = Math.max(-50, Math.min(50, this.data.discountPer));
		}
		cssIncreaseOrDecrease(propName) {
			const discountPer = this.data[propName];
			if (discountPer === 0) return 'd-none';
			return discountPer > 0 ? 'd-inline color-green' : 'd-inline color-red';
		}
		cssDangerOrSuccess(value) {
			if (value == 0) return 'd-none';
			return value < 0 ? 'text-success' : 'text-danger';
		}
		formatDiscount(per) {
			if (per) return `${per > 0 ? '+' : ''}${per}%`;
			return '';
		}
		formatCost(cost) {
			const fractional = Math.floor(100*(cost - Math.floor(cost)));
			return cost.toLocaleString().replace(/,.*/, '').replace(/\s/g, "&thinsp;") + '.' + fractional;
		}
		formatPer(per) {
			return `${per > 0 ? 'Надбавка к з/п ' : 'Уменьшение з/п на '}${per}%`;
		}
		onClickTablePositions(evt) {
			const result = this.getForItem(evt);
			// ручное изменение checked, т.к. для коллекций не реализован полноценный вложенный биндинг
			this.forEach('positions', (position) => { position.checked = false; });
			result.item.checked = true;
			this.data.position_info = result.item.name;
			this.data.rate = result.item.middleRate;
			this.resultFromGetForItem = result; // запоминаем результат работы this.getForItem(evt)
		}
	}

	const model = new CustomView({ uuid: '00000000-0000-0000-0000-8240f6f432cb' });
	await model.initialization;
	return await prepareTests({CustomView, model});
}

async function prepareTests({CustomView, model}) {
	let testCode;
	return {
		class: CustomView,
		instance: model,
		code: moduleCode,
		title: 'SGModelView: базовые проверки',
		sourceCode: creator,
		//showView: true, // debug
		items: [
			{
				code: (testCode = 'bind-html',`${moduleCode}__${testCode}`),
				title: 'загрузка шаблона <code>static autoBindLoad.srcHTML = "...";</code> и ручной биндинг <code>this.bindHTML(root, true);</code>',
				input: model,
				runner: async (model, eView) => {
					model.bindHTML(eView, SGModelView.FLAGS.IMMEDIATELY_RENDER_DEFAULT_TEMPLATE);
					return !!model.$view.innerHTML.replace(/\s*/, '');
				},
				verify: true,
				//skip: true, // пропустить тест
				//break: true, // прервать группу тестов
			},
			{
				code: (testCode = 'dynamic-sg-dropdown',`${moduleCode}__${testCode}`),
				title: 'проверка динамического формирования коллекции для <code>&lt;... sg-dropdown="contracts"&gt;</code> с внутренними <code>sg-format</code> и <code>sg-css</code>',
				input: model,
				runner: async (model) => {
					await model.prrContracts.promise;
					return {
						contracts: model.data.contracts,
						ULHash: SGModelView.utils.sha256(model.$view.querySelector('[aria-labelledby=modelview-basic-tests_contract]').innerHTML),
					};
				},
				verify: await window.loadJSON(moduleCode, testCode),
			},
			{
				code: (testCode = 'sg-dropdown-item-click',`${moduleCode}__${testCode}`),
				title: 'проверка выбора пункта в <code>&lt;... sg-dropdown="contracts"&gt;</code>',
				input: model,
				runner: async (model) => {
					const beforeBtnText = model.$view.querySelector('#modelview-basic-tests_contract').innerHTML;
					model.$view.querySelector('[aria-labelledby=modelview-basic-tests_contract] li:nth-of-type(2)').click();
					const afterBtnText = model.$view.querySelector('#modelview-basic-tests_contract').innerHTML;
					return { beforeBtnText, afterBtnText };
				}, //await window.sleep(1000); view.$view.querySelector('#modelview-basic-tests_contract').click(); // не срабатывает отсюда!
				verify: {
					"beforeBtnText": "Самозанятый (договор услуг) <sup sg-value=\"discount\" sg-css=\"cssDangerOrSuccess\" sg-format=\"formatDiscount\" class=\"d-none\"></sup>",
					"afterBtnText": "Договор ГПХ с физ.лицом <sup sg-value=\"discount\" sg-css=\"cssDangerOrSuccess\" sg-format=\"formatDiscount\" class=\"text-success\">-10%</sup>"
				},
			},
			{
				code: (testCode = 'sg-for',`${moduleCode}__${testCode}`),
				title: 'проверка вывода коллекции <code>&lt;... sg-for="positions"&gt;</code>',
				input: model,
				runner: async (model) => (SGModelView.utils.sha256(model.$view.querySelector('.js-positions').innerHTML)),
				verify: 'b5ce1f38b909e78fe1b50d1295953312796c75074ae4d3df04aede6008d1e12c',
			},
			{
				code: (testCode = 'getforitem',`${moduleCode}__${testCode}`),
				title: 'проверка <code>&lt;... sg-click="onClickTablePositions"&gt;</code> (выбор должности), <code>&lt;... sg-item="..."&gt;</code> и <code>this.getForItem(evt);</code>',
				input: model,
				runner: async (model) => {
					model.$view.querySelector('.js-positions tbody tr:nth-of-type(3) td:nth-of-type(3)').click();
					const resultFromGetForItem = SGModelView.json.debug(model.resultFromGetForItem, model);
					delete model.resultFromGetForItem;
					return resultFromGetForItem;
				},
				verify: await window.loadJSON(moduleCode, testCode),
			},
			{
				code: (testCode = 'sg-property-set-refresh',`${moduleCode}__${testCode}`),
				title: 'при изменении значения свойства <code>view.data.rang = 2;</code> должно измениться отображаемое значение в контроле',
				input: model,
				runner: async (model) => (model.data.rang = 2,model.$view.querySelector('.js-rang').value),
				verify: "2",
			},
			{
				code: (testCode = 'sg-property-event-change',`${moduleCode}__${testCode}`),
				title: 'при изменении значения в контроле, должно измениться значение соответствующего свойства',
				input: model,
				runner: async (model) => {
					const control = model.$view.querySelector('.js-rate');
					control.value = 1111;
					control.dispatchEvent(new Event('change'))
					return model.data.rate_with_discount_with_rang;
				},
				verify: 1111,
			},
			{
				code: (testCode = 'sg-css-class-function',`${moduleCode}__${testCode}`),
				title: 'динамические css-классы (функция) с сохранением предустановленных классов (js-discount): <code>&lt;... sg-css="cssIncreaseOrDecrease"&gt;</code>',
				input: model,
				runner: async (model) => {
					model.data.discountPer = 10;
					const control = model.$view.querySelector('.js-discount');
					return control.classList;
				},
				verify: {"0": "js-discount","1": "d-inline","2": "color-green"},
			},
			{
				code: (testCode = 'sg-css-class-inline',`${moduleCode}__${testCode}`),
				title: 'динамические css-классы (inline-код): <code>&lt;... sg-css="!rate_with_discount_with_rang || isNaN(rate_with_discount_with_rang) ? \'border-red\' : \'\'"&gt;</code>',
				input: model,
				runner: async (model) => {
					model.data.rate_with_discount_with_rang = '';
					const control = model.$view.querySelector('.js-rate');
					return control.classList;
				},
				verify: {"0": "js-rate","1": "input-rate","2": "border-red"},
			},
			{
				code: (testCode = 'sg-format',`${moduleCode}__${testCode}`),
				title: 'форматирование значения: <code>&lt;... sg-format="formatPer"&gt;</code>',
				input: model,
				runner: async (model) => {
					model.data.discountPer = 15;
					const control = model.$view.querySelector('.js-discount');
					return control.innerText;
				},
				verify: 'Надбавка к з/п 15%',
			},
			{
				code: (testCode = 'getdata',`${moduleCode}__${testCode}`),
				title: 'получение данных для сохранения в localStorage или БД без пустых значений: <code>const data = this.getData()</code>',
				input: model,
				runner: async (model) => model.getData(),
				verify: await window.loadJSON(moduleCode, testCode),
			},
			{
				code: (testCode = 'tojson-debug',`${moduleCode}__${testCode}`),
				title: 'получение отладочного объекта для сериализации (класс-потомок от SGModelView): <code>SGJson.debug(model)</code>',
				input: model,
				runner: async (model) => SGModelView.json.debug(model),
				verify: await window.loadJSON(moduleCode, testCode),
			},
			/*{ // TODO:
				code: (testCode = 'destroy',`${moduleCode}__${testCode}`),
				title: 'удаление инстанса вместе с HTML: <code>this.destroy()</code>',
				input: model,
				runner: async (model) => model.destroy(),
				verify: (
					() => {
						const obj = {}; // TODO
						//obj.__class.__proto.version = SGModelView.version;
						//obj.__uid = view.__uid;
						return obj;
					})(),
			},*/
		]
	};
};

export default creator;
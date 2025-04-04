import SGModelView from './../../sg-model-view.js';

async function creator() {
	class CustomView extends SGModelView {
		static singleInstance = true;
		static autoLoadBind = {
			srcHTML: 'modules/templates/simple-modelview-with-basic.html',
		};
		static defaultProperties = {
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
				this.data.rate_with_discount_with_rang = SGModelView.roundTo(this.data.rate * (1 + oRang.koef) * (1 + this.data.discountPer / 100) * (1 + ctr.discount/100));
			});
			this.on(['rate_with_discount_with_rang','hours'], () => {
				this.data.salary = this.data.rate_with_discount_with_rang * this.data.hours;
			});
			this.trigger('employment');
			this.trigger('hours');
			// Динамически заполняем коллекцию типа SGModel.TYPE_OBJECTS для sg-dropdown
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

	const view = new CustomView({ uuid: '00000000-0000-0000-0000-8240f6f432cb' });
	await view.initialization.promise;
	return prepareTests({CustomView, view});
}

function prepareTests({CustomView, view}) {
	return {
		class: CustomView,
		instance: view,
		code: 'sgmodelview-basic-checkers',
		title: 'SGModelView: базовые проверки',
		sourceCode: creator,
		//showView: true, // TODO: off
		items: [
			{
				code: 'sgmodelview-basic-checkers__bind-html',
				title: 'загрузка шаблона <code>static autoBindLoad.srcHTML = "...";</code> и ручной биндинг <code>this.bindHTML(root, true);</code>',
				input: view,
				runner: async (view, eView) => {
					view.bindHTML(eView, true);
					return !!view.$view.innerHTML.replace(/\s*/, '');
				},
				verify: true,
			},
			{
				code: 'sgmodelview-basic-checkers__dynamic-sg-dropdown',
				title: 'проверка динамического формирования коллекции для <code>&lt;... sg-dropdown="contracts"&gt;</code> с внутренними <code>sg-format</code> и <code>sg-css</code>',
				input: view,
				runner: async (view) => {
					await view.prrContracts.promise;
					return {
						contracts: view.data.contracts,
						ULHash: SGModelView.sha256(view.$view.querySelector('[aria-labelledby=modelview-basic-tests_contract]').innerHTML),
					};
				},
				verify: {contracts:{l:{discount:-15,shortCode:"labor",title:"Трудовой договор, в т.ч. по совм.",discountText:"-15%"},g:{discount:-10,shortCode:"gph",title:"Договор ГПХ с физ.лицом",discountText:"-10%"},s:{discount:0,shortCode:"self",title:"Самозанятый (договор услуг)",discountText:""},i:{discount:15,shortCode:"ip",title:"Индивидуальный предприниматель",discountText:"+15%"},c:{discount:50,shortCode:"crypta",title:"Оплата криптовалютой",discountText:"+50%"},f:{discount:100,shortCode:"freelance",title:"Фриланс + Безопасная сделка",discountText:"+100%"}},ULHash:"1d811e4872acf621b5d5c4f9f296a6db06759199f101f213aebca480279f462f"},
				//break: true // TODO: off
			},
			{
				code: 'sgmodelview-basic-checkers__sg-dropdown-item-click',
				title: 'проверка выбора пункта в <code>&lt;... sg-dropdown="contracts"&gt;</code>',
				input: view,
				runner: async (view) => {
					const beforeBtnText = view.$view.querySelector('#modelview-basic-tests_contract').innerHTML;
					view.$view.querySelector('[aria-labelledby=modelview-basic-tests_contract] li:nth-of-type(2)').click();
					const afterBtnText = view.$view.querySelector('#modelview-basic-tests_contract').innerHTML;
					return { beforeBtnText, afterBtnText };
				}, //await window.sleep(1000); view.$view.querySelector('#modelview-basic-tests_contract').click(); // не срабатывает отсюда!
				verify: {
					"beforeBtnText": "Самозанятый (договор услуг) <sup sg-value=\"discount\" sg-css=\"cssDangerOrSuccess\" sg-format=\"formatDiscount\" class=\"d-none\"></sup>",
					"afterBtnText": "Договор ГПХ с физ.лицом <sup sg-value=\"discount\" sg-css=\"cssDangerOrSuccess\" sg-format=\"formatDiscount\" class=\"text-success\">-10%</sup>"
				},
				//break: true // TODO: off
			},
			{
				code: 'sgmodelview-basic-checkers__sg-for',
				title: 'проверка вывода коллекции <code>&lt;... sg-for="positions"&gt;</code>',
				input: view,
				runner: async (view) => (SGModelView.sha256(view.$view.querySelector('.js-positions').innerHTML)),
				verify: 'b5ce1f38b909e78fe1b50d1295953312796c75074ae4d3df04aede6008d1e12c',
			},
			{
				code: 'sgmodelview-basic-checkers__getforitem',
				title: 'проверка <code>&lt;... sg-click="onClickTablePositions"&gt;</code> (выбор должности), <code>&lt;... sg-item="..."&gt;</code> и <code>this.getForItem(evt);</code>',
				input: view,
				runner: async (view) => {
					view.$view.querySelector('.js-positions tbody tr:nth-of-type(3) td:nth-of-type(3)').click();
					const resultFromGetForItem = view.resultFromGetForItem;
					delete view.resultFromGetForItem;
					return resultFromGetForItem;
				},
				verify: {key:3n,value:null,item:{id:3,name:"Fullstack-developer",middleRate:2e3,checked:!0},collection:[{id:1,name:"Frontend-developer",middleRate:1e3,checked:!1},{id:2,name:"Backend-developer",middleRate:1500,checked:!1},{id:3,name:"Fullstack-developer",middleRate:2e3,checked:!0},{id:4,name:"Devops",middleRate:2e3,checked:!1},{id:5,name:"TeamLead",middleRate:3e3,checked:!1}],property:"positions",type:7,keyName:"id",$item:{__sg:{}},$control:{__sg:{}},hash:"1361a9d9315215d3"},
			},
			{
				code: 'sgmodelview-basic-checkers__sg-property-set-refresh',
				title: 'при изменении значения свойства <code>view.data.rang = 2;</code> должно измениться отображаемое значение в контроле',
				input: view,
				runner: async (view) => (view.data.rang = 2,view.$view.querySelector('.js-rang').value),
				verify: "2",
			},
			{
				code: 'sgmodelview-basic-checkers__sg-property-event-change',
				title: 'при изменении значения в контроле, должно измениться значение соответствующего свойства',
				input: view,
				runner: async (view) => {
					const control = view.$view.querySelector('.js-rate');
					control.value = 1111;
					control.dispatchEvent(new Event('change'))
					return view.data.rate_with_discount_with_rang;
				},
				verify: 1111,
			},
			{
				code: 'sgmodelview-basic-checkers__sg-css-class-function',
				title: 'динамические css-классы (функция) с сохранением предустановленных классов (js-discount): <code>&lt;... sg-css="cssIncreaseOrDecrease"&gt;</code>',
				input: view,
				runner: async (view) => {
					view.data.discountPer = 10;
					const control = view.$view.querySelector('.js-discount');
					return control.classList;
				},
				verify: {"0": "js-discount","1": "d-inline","2": "color-green"},
			},
			{
				code: 'sgmodelview-basic-checkers__sg-css-class-inline',
				title: 'динамические css-классы (inline-код): <code>&lt;... sg-css="!rate_with_discount_with_rang || isNaN(rate_with_discount_with_rang) ? \'border-red\' : \'\'"&gt;</code>',
				input: view,
				runner: async (view) => {
					view.data.rate_with_discount_with_rang = '';
					const control = view.$view.querySelector('.js-rate');
					return control.classList;
				},
				verify: {"0": "js-rate","1": "input-rate","2": "border-red"},
			},
			{
				code: 'sgmodelview-basic-checkers__sg-format',
				title: 'форматирование значения: <code>&lt;... sg-format="formatPer"&gt;</code>',
				input: view,
				runner: async (view) => {
					view.data.discountPer = 15;
					const control = view.$view.querySelector('.js-discount');
					return control.innerText;
				},
				verify: 'Надбавка к з/п 15%',
			},
			{
				code: 'sgmodelview-basic-checkers__tojson',
				title: 'получение корректного объекта для сериализации (класс-потомок от SGModelView): <code>const obj = this.toJSON()</code>',
				input: view,
				runner: async (srcObject) => srcObject.toJSON(),
				verify: (
					() => {
						const obj = {data:{contract:"g",contracts:{l:{discount:-15,shortCode:"labor",title:"Трудовой договор, в т.ч. по совм.",discountText:"-15%"},g:{discount:-10,shortCode:"gph",title:"Договор ГПХ с физ.лицом",discountText:"-10%"},s:{discount:0,shortCode:"self",title:"Самозанятый (договор услуг)",discountText:""},i:{discount:15,shortCode:"ip",title:"Индивидуальный предприниматель",discountText:"+15%"},c:{discount:50,shortCode:"crypta",title:"Оплата криптовалютой",discountText:"+50%"},f:{discount:100,shortCode:"freelance",title:"Фриланс + Безопасная сделка",discountText:"+100%"}},rate:2e3,rate_with_discount_with_rang:2070,hours:80,discountPer:15,salary:165600,position_id:0,position_info:"Fullstack-developer",rang:2,employment:1,employment_info:"4 часа/день",employments:[{hours:40,title:"2 часа/день"},{hours:80,title:"4 часа/день"},{hours:100,title:"5 часов/день"},{hours:120,title:"6 часов/день"},{hours:140,title:"7 часов/день"},{hours:160,title:"фуллтайм"}],rangs:[{value:0,title:"Trainee (-50%)",koef:-.5,hint:"Стажёр"},{value:1,title:"Junior (-25%)",koef:-.25},{value:2,title:"Middle",koef:0},{value:3,title:"Senior (+25%)",koef:.25},{value:4,title:"TechLead (+50%)",koef:.5}],positions:[{id:1,name:"Frontend-developer",middleRate:1e3,checked:!1},{id:2,name:"Backend-developer",middleRate:1500,checked:!1},{id:3,name:"Fullstack-developer",middleRate:2e3,checked:!0},{id:4,name:"Devops",middleRate:2e3,checked:!1},{id:5,name:"TeamLead",middleRate:3e3,checked:!1}],_input_type:"radio"},$view:"[object HTMLDivElement]",__class:{name:"CustomView",templates:{"00000000-0000-0000-0000-8240f6f432cb":"[object HTMLTemplateElement]",tmp_contracts_item:"[object HTMLTemplateElement]",tmp_position_tr:"[object HTMLTemplateElement]"},__prototype:{name:"SGModelView",version:"1.1.0",isNode:!1,isBrowser:!0},autoLoadBind:{srcHTML:"modules/templates/simple-modelview-with-basic.html",templateId:"00000000-0000-0000-0000-8240f6f432cb"},CONTRACTS:[["l",-15,"labor","Трудовой договор, в т.ч. по совм."],["g",-10,"gph","Договор ГПХ с физ.лицом"],["s",0,"self","Самозанятый (договор услуг)"],["i",15,"ip","Индивидуальный предприниматель"],["c",50,"crypta","Оплата криптовалютой"],["f",100,"freelance","Фриланс + Безопасная сделка"]],__hash:"e1cbfaa0f12a1fcf08ac0f068982f3d4f84cff317c3bbec8b43987babd57c491",initialized:!0},__uid:1,initialized:!0,changed:!0,destroyed:!1,uuid:"00000000-0000-0000-0000-8240f6f432cb",options:{},prrContracts:{promise:{}}};
						obj.__class.__prototype.version = SGModelView.version;
						obj.__uid = view.__uid;
						return obj;
					})(),
			},
		]
	};
};

export default creator;
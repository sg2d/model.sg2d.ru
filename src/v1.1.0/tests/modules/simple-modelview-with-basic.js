import SGModelView from './../../sg-model-view.js';

async function creator() {
	class CustomView extends SGModelView {
		static singleInstance = true;
		static autoLoadBind = {
			srcHTML: 'modules/templates/simple-modelview-with-basic.html',
		};
		static defaultProperties = {
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
		async initialize() {
			this.on('employment', (employment) => {
				this.data.hours = this.data.employments[employment].hours;
				this.data.employment_info = this.data.employments[employment].title;
			});
			this.on(['rate_with_discount_with_rang','hours'], () => {
				this.data.salary = this.data.rate_with_discount_with_rang * this.data.hours;
			});
			this.on(['rate', 'discountPer', 'rang'], () => {
				const oRang = this.data.rangs[this.data.rang];
				this.data.rate_with_discount_with_rang = SGModelView.roundTo(this.data.rate * (1 + oRang.koef) * (1 + this.data.discountPer / 100));
			});
			this.trigger('employment');
			this.trigger('hours');
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
	return prepareTests(CustomView, view);
}

function prepareTests(CustomView, view) {
	return {
		class: CustomView,
		instance: view,
		code: 'sgmodelview-basic-checkers',
		title: 'SGModelView: базовые проверки',
		sourceCode: creator,
		items: [
			{
				code: 'sgmodelview-basic-checkers__bind-html',
				title: 'Загрузка шаблона <code>static autoBindLoad.srcHTML = "...";</code> и ручной биндинг <code>this.bindHTML(root, true);</code>',
				input: view,
				runner: async (view, eView) => {
					view.bindHTML(eView, true);
					return !!view.$view.innerHTML.replace(/\s*/, '');
				},
				verify: true,
			},
			{
				code: 'sgmodelview-basic-checkers__sg-for',
				title: 'проверка вывода коллекции <code>&lt;... sg-for="positions"&gt;</code>',
				input: view,
				runner: async (view) => (SGModelView.sha256(view.$view.querySelector('.js-positions').innerHTML)),
				verify: '21598684ea3a70a6f174a9fbd2438763f974b8cd33f22f5843658d20ec9c7482',
			},
			{
				code: 'sgmodelview-basic-checkers__getforitem',
				title: 'выбор должности и проверка функции <code>this.getForItem(evt);</code>',
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
				verify: ( // @minify https://www.toptal.com/developers/javascript-minifier
					()=>{
						const obj = {data:{rate:2e3,rate_with_discount_with_rang:2300,hours:80,discountPer:15,salary:184e3,position_id:0,position_info:"Fullstack-developer",rang:2,employment:1,employment_info:"4 часа/день",employments:[{hours:40,title:"2 часа/день"},{hours:80,title:"4 часа/день"},{hours:100,title:"5 часов/день"},{hours:120,title:"6 часов/день"},{hours:140,title:"7 часов/день"},{hours:160,title:"фуллтайм"}],rangs:[{value:0,title:"Trainee (-50%)",koef:-.5,hint:"Стажёр"},{value:1,title:"Junior (-25%)",koef:-.25},{value:2,title:"Middle",koef:0},{value:3,title:"Senior (+25%)",koef:.25},{value:4,title:"TechLead (+50%)",koef:.5}],positions:[{id:1,name:"Frontend-developer",middleRate:1e3,checked:!1},{id:2,name:"Backend-developer",middleRate:1500,checked:!1},{id:3,name:"Fullstack-developer",middleRate:2e3,checked:!0},{id:4,name:"Devops",middleRate:2e3,checked:!1},{id:5,name:"TeamLead",middleRate:3e3,checked:!1}],_input_type:"radio"},$view:"[object HTMLDivElement]",__class:{name:"CustomView",templates:{"00000000-0000-0000-0000-8240f6f432cb":"[object HTMLTemplateElement]",tmp_position_tr:"[object HTMLTemplateElement]"},__prototype:{name:"SGModelView",version:"1.1.0",isNode:!1,isBrowser:!0},autoLoadBind:{srcHTML:"modules/templates/simple-modelview-with-basic.html",templateId:"00000000-0000-0000-0000-8240f6f432cb"},__hash:"86983d40c3ecf8da9bc2ee632408da2ffcbc21e3fdb73857040210cd16dfd751",initialized:!0},__uid:2,initialized:!0,changed:!0,destroyed:!1,uuid:"00000000-0000-0000-0000-8240f6f432cb",options:{}};
						obj.__class.__prototype.version = SGModelView.version;
						return obj;
					})(),
			},
		]
	};
};

export default creator;
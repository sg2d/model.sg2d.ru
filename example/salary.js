"use strict";

import SGModelView from "./../src/sg-model-view.js";

class OptionsMethods {
  constructor(values) {
    Object.assign(this, values);
  }
  getSymbolByIndex(code) { return Object.keys(this)[code]; };
  getValueByIndex(code) { return this[this.getSymbolByIndex(code)][0]; };
  getDescByIndex(code) { return this[this.getSymbolByIndex(code)][1]; };
	getValueBySymbol(symb) { return this[symb][1]; };
  symb(name) {
    for (let p in this) {
      if (p.length === 1 && typeof this[p] === 'object') {
        if (this[p][1] === name) {
          return p;
        }
      }
    }
    return void 0;
  };
};

class Salary extends SGModelView {
	
	static singleInstance = true;
	
	static CURRENT_VERSION = 6;
	
	static defaultProperties = {
		initialized: false,
		
		version: 6,
		
		contract: 'l',
		level: 'm',
		days_in_week: 5,
		england: 'a',
		hours_in_day: 4,
		hourly_payment: false,
		schedule: 'b',
		deadline: false,
		otech: false,
		code: '1',
		javascript: false,
		nodejs: false,
		java: false,
		vue: false,
		react: false,
		postgresql: false,
		php: false,
		cpp: false,
		typescript: false,
		vanillajs: false,
		python: false,
		other: false,
		
		// скидки/наценки в %
		javascript_koef: -5,
		nodejs_koef: -5,
		java_koef: +50,
		vue_koef: +5,
		react_koef: +40,
		postgresql_koef: -5,
		php_koef: +30,
		cpp_koef: +10,
		typescript_koef: +15,
		vanillajs_koef: -5,
		other_koef: +100,
		python_koef: +40,
		
		rate_hour_min: 0,
		salary_month: 0,
		hours: 0,
		hours_meas: "",
		hours_in_day_desc: "",
		timeout: 5,
		rate: 0,
		salary_year: 0,
		
		usdrub: 0,
		cnyrub: 0,
		tonrub: 0,
		salary_month_usd: 0,
		rate_usd: 0,
		salary_month_cny: 0,
		rate_cny: 0,
		salary_month_ton: 0,
		rate_ton: 0,
		
		salary_labor_fot: 0,
		salary_labor_ndfl: 0,
		salary_labor_insurance: 0,
		salary_labor_month: 0,
		salary_labor_year: 0,
		contract_self_limit: 0,
		self_benefit_percent: 0.0,
		
		current_year: new Date().getFullYear()
	};
	
	static typeProperties = {
		version: SGModel.TYPE_NUMBER,
		
		contract: SGModel.TYPE_STRING,
		level: SGModel.TYPE_STRING,
		days_in_week: SGModel.TYPE_NUMBER,
		england: SGModel.TYPE_STRING,
		hours_in_day: SGModel.TYPE_NUMBER,
		hourly_payment: SGModel.TYPE_BOOLEAN,
		deadline: SGModel.TYPE_BOOLEAN,
    otech: SGModel.TYPE_BOOLEAN,
		code: SGModel.TYPE_STRING,
		javascript: SGModel.TYPE_BOOLEAN,
		nodejs: SGModel.TYPE_BOOLEAN,
		java: SGModel.TYPE_BOOLEAN,
		vue: SGModel.TYPE_BOOLEAN,
		react: SGModel.TYPE_BOOLEAN,
		postgresql: SGModel.TYPE_BOOLEAN,
		php: SGModel.TYPE_BOOLEAN,
		cpp: SGModel.TYPE_BOOLEAN,
		typescript: SGModel.TYPE_BOOLEAN,
		vanillajs: SGModel.TYPE_BOOLEAN,
		python: SGModel.TYPE_BOOLEAN,
		other: SGModel.TYPE_BOOLEAN,
		
    otech_per: SGModel.TYPE_NUMBER,
    
		salary_labor_fot: SGModel.TYPE_NUMBER,
		salary_labor_ndfl: SGModel.TYPE_NUMBER,
		salary_labor_insurance: SGModel.TYPE_NUMBER,
		salary_labor_month: SGModel.TYPE_NUMBER,
		salary_labor_year: SGModel.TYPE_NUMBER,
		contract_self_limit: SGModel.TYPE_NUMBER,
		self_benefit_percent: SGModel.TYPE_NUMBER,
	};
	
	static hashProperties = {
		v: "version",
		A: "vanillajs",
		B: "hourly_payment",
		C: "contract",
		D: "days_in_week",
		E: "england",
		F: "postgresql",
		G: "code",
		H: "hours_in_day",
		I: "python",
		J: "javascript",
		//K: "",
		//M: "",
		N: "nodejs",
		O: "other",
		P: "php",
		//Q: "",
		R: "react",
		S: "cpp",
		T: "typescript",
		//U: "",
		W: "deadline",
		V: "vue",
		X: "schedule",
		Y: "java",
    Z: "otech",
		L: "level", // level идёт последним!
	};
	
	static HOUR_RATE_BASE = 2675;
	static HOUR_RATE_MIN = 1000;
	static CONTRACT_SELF_LIMIT = 4800000;
	
	static CONTRACTS = new OptionsMethods({
		"s": [0, 'self'],
		"c": [0, 'crypta'],
		"l": [-10, 'labor'],
		"i": [+15, 'ip'],
		"f": [+35, 'freelance'],
	});
	
	static LEVEL_DEFAULT = 'j';
	
	static SCHEDULES = new OptionsMethods({
		"a": [0, 'office'],
		"b": [-25, 'remote'],
		"c": [+100, 'relocation'],
		"d": [+200, 'relocation_out'],
	});
	
	static NDFL_PER = 13; // %
	static NDFL_LIMIT = 5000000;
	static NDFL_LIMIT_PER = 15; // %
	static INSURANCE_PER = 30; // per //0.22 + 0.051 + 0.029 + 0.002;
	static INSURANCE_LIMIT = 1917000; // for 2023 year
	static INSURANCE_LIMIT_PER = 15.1; // %
	
	static LEVELS = new OptionsMethods({
		"t": [-50, 'trainee'],
		"j": [-25, 'junior'],
		"i": [-10, 'junior_plus'],
		"m": [0, 'middle'],
		"n": [+25, 'middle_plus'],
		"s": [+50, 'senior'],
		"l": [+75, 'teamlead']
	});
  
	static ENGLANDS = new OptionsMethods({
		"a": [0, 'a'],
		"b": [100, 'b']
	});
	
	static DAYS_IN_WEEK_KOEF = [void 0, +10, -10, -15, -10, 0, +100, +200];
  
	static OTECH_KOEF = 13.9;
	
	static HOURLY_PAYMENT_PER = +30; // %
	static HOURS_DEADLINE_KOEF = +30; // %
	static DEADLINE_AND_HOURLY_PAYMENT_PER = +40; // %
	
	static USDKOEF = 1.25;
	
	static HOURS_KOEF = [void 0, +25, -10, -5, 0, +5, +10, +15, +20];
	
	static CODES = [
		[-10, 'Проект с нуля или кода очень мало'],
		[0, 'Код поддерживается полностью текущим штатом'],
		[+10, 'Около 25% legacy в проекте'],
		[+20, 'Около 50% legacy в проекте'],
		[+33, 'Около 75% legacy в проекте'],
		[+50, 'Проект никто не поддерживает!'],
	];
  
	static TIMEOUTS = [void 0, 5, 5, 5, 5, 10, 10, 15, 15];
	
	static _fields_koef = {
		'javascript': 's',
		'nodejs': 'm',
		'react': 't',
		'postgresql': 'm',
		'vue': 'j',
		'php': 'i',
		'cpp': 'i',
		'typescript': 'i',
		'vanillajs': 'm',
		'java': 'j',
		'python': 't',
		'other': 't',
	};
	
	async initialize() {
		
		try {
			this.checkDollarInRubles();
			this.checkCNYInRubles();
			this.checkTONCoinInRubles();
		} catch (err) {}
		
		Salary.CONTRACTS._inverse = {};
		for (let p in Salary.CONTRACTS) {
			if (p[0] !== '_') {
				Salary.CONTRACTS._inverse[Salary.CONTRACTS[p][1]] = p;
			}
			this.set('contract_' + Salary.CONTRACTS[p][1], Salary.CONTRACTS[p][0]);
		}
		
		Salary.SCHEDULES._inverse = {};
		for (let p in Salary.SCHEDULES) {
			if (p[0] !== '_') {
				Salary.SCHEDULES._inverse[Salary.SCHEDULES[p][1]] = p;
			}
			this.set('schedule_' + Salary.SCHEDULES[p][1], Salary.SCHEDULES[p][0]);
		}
		
		for (let p in Salary.LEVELS) {
			this.set('level_' + Salary.LEVELS[p][1], Salary.LEVELS[p][0]);
		}
    
		for (let p in Salary.ENGLANDS) {
			this.set('eng_' + Salary.ENGLANDS[p][1], Salary.ENGLANDS[p][0]);
		}
		
		for (let i = 1; i < Salary.DAYS_IN_WEEK_KOEF.length; i++) {
			this.set('days_in_week_' + i, Salary.DAYS_IN_WEEK_KOEF[i]);
		}
		
		this.set('contract_self_limit', Salary.CONTRACT_SELF_LIMIT);
    
		this.set('otech_per', 100*(Salary.OTECH_KOEF - 1), { precision: 1 });
		
		this.on('hours_in_day', (hours)=>{
			this.set('hours_in_day_desc', (hours == 8 ? 'Фуллтайм' : hours + ' ' + this.getHoursMeas(hours) + '/день')); // TODO: надписи вытащить в шаблон?
			this.set('timeout', Salary.TIMEOUTS[hours]);
			// TODO: переделать, когда sgAttribute будет динамическим!
			//document.querySelector('input#deadline').disabled = (hours == 8);
		}, void 0, void 0, SGModel.FLAG_IMMEDIATELY);
		
		this.on('code', (code)=>{
			this.set('code_desc', Salary.CODES[code][1]);
		}, void 0, void 0, SGModel.FLAG_IMMEDIATELY);
		
		this.on('hours', (hours)=>{
			this.set('hours_meas', this.getHoursMeas(hours));
		}, void 0, void 0, SGModel.FLAG_IMMEDIATELY);
		
		this.on('deadline', () => {
			['days_in_week_1', 'days_in_week_2', 'days_in_week_3', 'days_in_week_4'].forEach((name) => {
				this.set(name, this.get(name), void 0, SGModel.FLAG_FORCE_CALLBACKS);
			});
			this.set('days_in_week', this.get('days_in_week'), void 0, SGModel.FLAG_FORCE_CALLBACKS);
		});
		
		const jsTechDependent = ['typescript', 'nodejs', 'vanillajs', 'react', 'vue'];
		jsTechDependent.forEach(code => {
			this.on(code, (value) => {
				if (value) {
					this.set('javascript', true);
				}
			});
		});
		this.on('javascript', (javascript) => {
			if (!javascript) {
				jsTechDependent.forEach(code => {
					this.set(code, false);
				});
			}
		});
		['react', 'vue'].forEach(code => {
			this.on(code, (value) => {
				if (value) {
					this.set('vanillajs', false);
				}
			});
		});
		['vanillajs'].forEach(code => {
			this.on(code, (value) => {
				if (value) {
					this.set('react', false);
					this.set('vue', false);
				}
			});
		});
		
		// Автоматический level
		this.on(Object.keys(Salary._fields_koef), (value, previousValue, propName) => {
			let level_cumm = 0, q = 0;
			for (let tn in Salary._fields_koef) {
				const tl = Salary._fields_koef[tn];
				if (this.get(tn)) {
					q++;
					level_cumm += Salary.LEVELS[tl][0];
				}
			}
			level_cumm /= q;
			let level = Salary.LEVEL_DEFAULT;
			let ln_prev = 't';
			let l_prev = Salary.LEVELS[ln_prev][0];
			for (const ln_cur in Salary.LEVELS) {
				if (ln_cur === 't') continue;
				const l_cur = Salary.LEVELS[ln_cur][0];
				if (level_cumm >= l_prev && level_cumm < l_cur) {
					level = ln_prev;
					break;
				}
				ln_prev = ln_cur;
			}
			this.set('level', level);
		}, void 0, void 0, SGModel.FLAG_IMMEDIATELY);
		
		this.set('rate_hour_min', Salary.HOUR_RATE_MIN);
		
		this.bindHTML("body");
		
		// Hash parser
		let parameters = Array.from(location.hash.matchAll(/(\w)(\w)/g));
		if (parameters.length) {
			let _parameters = {};
			for (let p in parameters) {
				var code = parameters[p][1];
				var value = parameters[p][2];
				var name = Salary.hashProperties[code];
				if (name) {
					_parameters[name] = value;
				}
			}
			if ((_parameters.version || 1) >= Salary.CURRENT_VERSION) {
				for (let p in _parameters) {
					this.set(p, _parameters[p]);
				}
			} else {
				alert('Ссылка не поддерживается - версия хеша ' + location.hash + ' устарела!');
			}
		}
		
		this.on(Object.values(Salary.hashProperties), this.calc);
		
		// to update the DOM on first launch:
		this.on('usdrub', this.calc, void 0, void 0, SGModel.FLAG_IMMEDIATELY);
		['contract', 'level', 'schedule', 'days_in_work', 'england'].forEach((name) => {
			this.set(name, this.get(name), void 0, SGModel.FLAG_FORCE_CALLBACKS);
		});
		
		this.set("initialized", true);
	}
	
	calc() {
		let hours = 4 * this.get('days_in_week') * this.get('hours_in_day');
		this.set('hours', hours);
		let koef = 1;
		
		koef *= k(Salary.CONTRACTS[this.get("contract")][0]);
		koef *= k(Salary.SCHEDULES[this.get('schedule')][0]);
		koef *= k(Salary.LEVELS[this.get("level")][0]);
		koef *= k(Salary.CODES[this.get("code")][0]);
		koef *= k(Salary.ENGLANDS[this.get("england")][0]);
		
		if (this.get('hourly_payment') && this.get('deadline')) {
			koef *= k(Salary.DEADLINE_AND_HOURLY_PAYMENT_PER);
			if (this.get('days_in_week') > 5) {
				koef *= k(Salary.DAYS_IN_WEEK_KOEF[this.get('days_in_week')]);
			}
		} else {
			if (this.get('hourly_payment')) {
				koef *= k(Salary.HOURLY_PAYMENT_PER);
			}
			if (this.get('deadline')) {
				koef *= k(Salary.HOURS_DEADLINE_KOEF);
				if (this.get('days_in_week') > 5) {
					koef *= k(Salary.DAYS_IN_WEEK_KOEF[this.get('days_in_week')]);
				}
			}
			if (!this.get('deadline')) {
				if (!this.get('hourly_payment')) {
					koef *= k(Salary.HOURS_KOEF[this.get('hours_in_day')]);
				}
				koef *= k(Salary.DAYS_IN_WEEK_KOEF[this.get('days_in_week')]);
			}
		}
		
    if (this.get('otech')) {
      koef *= Salary.OTECH_KOEF;
    }
		
		let perSum = 0;
		for (let t in Salary._fields_koef) {
			if (this.get(t)) {
				perSum += this.get(t + '_koef');
				//koef *= k(this.get(t + '_koef'));
			}
		}
		koef *= k(perSum);
		
		let rate = Math.max(Salary.HOUR_RATE_BASE * koef, Salary.HOUR_RATE_MIN);
		document.querySelector('#rate_title').title = rate;
		rate = SGModel.roundTo(rate / 5, -1) * 5;
		let salary = SGModel.roundTo(rate * hours, -3);
		
		this.set('rate', rate);
		this.set('salary_month', salary);
		this.set('salary_year', this.get('salary_month') * (this.get('contract') === Salary.CONTRACTS.symb('labor') ? 12 : 11));
		this.set('rate_usd', SGModel.roundTo(Salary.USDKOEF * this.get('rate') / this.get('usdrub'), 1));
		this.set('salary_month_usd', SGModel.roundTo(Salary.USDKOEF * this.get('salary_month') / this.get('usdrub'), -1));
		this.set('rate_cny', SGModel.roundTo(this.get('rate') / this.get('cnyrub'), 1));
		this.set('salary_month_cny', SGModel.roundTo(this.get('salary_month') / this.get('cnyrub'), -1));
		this.set('rate_ton', SGModel.roundTo(this.get('rate') / this.get('tonrub'), 2));
		this.set('salary_month_ton', SGModel.roundTo(this.get('rate_ton') * hours, -1));
		
		if (this.get('contract') === Salary.CONTRACTS.symb('labor')) {
			const sml_fot = salary + salary * 1 / (1 - Salary.NDFL_PER/100);
			const sml = sml_fot + sml_fot * Salary.INSURANCE;

			this.set("salary_labor_fot", sml_fot);
			this.set("salary_labor_ndfl", sml_fot * Salary.NDFL);
			this.set("salary_labor_insurance", sml_fot * Salary.INSURANCE);
			this.set("salary_labor_month", sml);
			this.set("salary_labor_year", sml * 12);
			
			const salary_self = this.get("salary_month") / k(Salary.CONTRACTS[Salary.CONTRACTS.symb('labor')][0]);
			this.set("self_benefit_percent", ((this.get("salary_labor_year") - salary_self * 11) / this.get("salary_labor_year") * 100).toFixed(1));
		}
	}
  
	getHoursMeas(h) {
		return "час" + this._getNoun(h, "", "а", "ов");
	}
	
	_getNoun(number, one, two, five) {
		let n = Math.abs(number);
		n %= 100;
		if (n >= 5 && n <= 20) return five;
		n %= 10;
		if (n === 1) return one;
		if (n >= 2 && n <= 4) return two;
		return five;
	}
	
	getNumThinsp(value) {
		return (''+value.toLocaleString().replace(/,.*/, "")).replace(/\s/g, "&thinsp;");
	}
	
	getNumThinsp2(value) {
		const fractional = Math.floor(100*(value - Math.floor(value)));
		return (''+value.toLocaleString().replace(/,.*/, "")).replace(/\s/g, "&thinsp;") + '.' + fractional;
	}
	
	formatHoursExtraCharge(value) {
		const per = Salary.HOURS_KOEF[value];
		return this.formatDiscount(per);
	}
	
	formatCodeExtraCharge(code) {
		const per = Salary.CODES[code][0];
		return this.formatDiscount(per);
	}
	
	formatDiscount(per) {
		if (per) {
			return '' + (per > 0 ? '+' : '') + per + '%';
		} else {
			return '';
		}
	}
	
	getCodeTitle(code) {
		return Salary.CODES[code][1];
	}
	
	getHourTitle(hour) {
		const per = Salary.HOURS_KOEF[hour];
		if (! per) return '';
		return (per > 0 ? '+' : '') + per + '%';
	}
	
	cssDangerOrSuccessAndDiscountForDaysInWeek(propertyOrValue) {
		let cssClass = this.cssDangerOrSuccess(propertyOrValue);
		if (this.get('deadline')) {
			cssClass += ' no-visible';
		}
		return cssClass;
	}
	
	cssDangerOrSuccess(propertyOrValue) {
		let value = (typeof propertyOrValue === "string" && propertyOrValue.length > 1 ? this.get(propertyOrValue) : propertyOrValue);
		if (value == 0) return ""; else return value < 0 ? "text-success" : "text-danger";
	}
	
	hoursInDayClick(evt) {
		this.set('hours_in_day', evt.target.dataset.hours);
	}
	
	supportCodeClick(evt) {
		this.set('code', evt.target.dataset.code);
	}
	
	getLevelFor(tech) {
		const level = String(Salary.LEVELS.getValueBySymbol(Salary._fields_koef[tech])).replace('_plus', '+');
		return `${tech} - ${level}`;
	}
	
	saveLink() {
		var hash = [];
		for (var code in Salary.hashProperties) {
			var name = Salary.hashProperties[code];
			var value = this.properties[name];
			if (value === false) value = 0;
			if (value === true) value = 1;
			hash.push(code + value);
		}
		let href = location.href.replace(/#.*/, "") + "#" + hash.join("");
		let link_input = document.querySelector("#link_link");
		link_input.value = href;
	}
	
	sendEmail(event) {
		window.open("mailto:sg2d@yandex.ru?subject="+event.currentTarget.dataset.subject+
			"&body="+event.currentTarget.dataset.body
				.replace("%hours_in_day%", this.get("hours_in_day"))
				.replace("%rate%", this.get("rate"))
				.replace("%link%", document.querySelector("#link_link").value));
	}
	
	linkCopy() {
		let link_input = document.querySelector("#link_link");
		link_input.select();
		try {
			let bSuccess = document.execCommand('copy');
			console.log('Copying link command was ' + (bSuccess ? 'successful' : 'unsuccessful'));
		} catch (err) {
			console.log('Oops, unable to copy');
		}
		return false;
	}
	
	setContractSelf() {
		this.set("contract", Salary.CONTRACTS.symb('self'));
	}
	
	static currencyURL = 'https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/$DATE$/currencies/usd/rub.json';
	static currencyURLcny = 'https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/$DATE$/currencies/cny/rub.json';
	static currencyURLTONCoin = 'https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=rub';
	
	checkDollarInRubles() {
		return this.getCourceInRubles(Salary.currencyURL, 'usdrub');
	}

	checkCNYInRubles() {
		return this.getCourceInRubles(Salary.currencyURLcny, 'cnyrub');
	}
	
	checkTONCoinInRubles() {
		return this.getCourceInRubles(Salary.currencyURLTONCoin, 'tonrub', 'the-open-network.rub');
	}
	
	getCourceInRubles(currencyURL, currencyCode, pathProps = 'rub', precision = 2) {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			//xhr.timeout = 2000; // ms
			xhr.onload = (evt)=>{
				try {
					const props = pathProps.split('.');
					let value = xhr.response;
					if (value) {
						for (let i = 0; i < props.length; i++) {
							value = value[props[i]];
							if (!value) break;
						}
						this.set(currencyCode, SGModel.roundTo(value, precision));
						resolve();
					} else {
						reject(new Error('For url ' + currencyURL + ' a bad response has been received! xhr.response=' + String(value) + '!'));
					}
				} catch(err) {
					reject(err);
				}
			};
			xhr.onerror = (err)=>{
				reject(err);
			};
			xhr.ontimeout = (err)=>{
				// no code
			};
			xhr.open('GET', currencyURL.replace('$DATE$', new Date().toISOString().substring(0, 10)));
			xhr.responseType = 'json';
			xhr.send();
		});
	}
}

function k(per) {
  return 1 + per/100;
}

addEventListener("load", ()=>{ window.salaryApp = new Salary(); });
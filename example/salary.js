"use strict";

import SGModelView from "./../src/sg-model-view.js";

class Salary extends SGModelView {
	
	static singleInstance = true;
	
	static defaultProperties = {
		contract: 3,
		level: 6,
		days_in_week: 4,
		hours_in_day: 6,
		relocation: false,
		code_startup: true,
		code_supported: false,
		code_legacy: false,
		es5_nodejs: true,
		vue: false,
		react: false,
		php: false,
		pixijs: true,
		super_interesting: true,
		
		rate_hour_min: 0,
		salary_month: 0,
		hours: 0,
		hours_meas: "",
		hours_in_day_desc: "",
		hours_extra_charge: 0,
		salary_hour: 0,
		salary_year: 0
	};
	
	static typeProperties = {
		contract: SGModel.TYPE_NUMBER,
		level: SGModel.TYPE_NUMBER,
		days_in_week: SGModel.TYPE_NUMBER,
		hours_in_day: SGModel.TYPE_NUMBER,
		relocation: SGModel.TYPE_BOOLEAN,
		code_startup: SGModel.TYPE_BOOLEAN,
		code_supported: SGModel.TYPE_BOOLEAN,
		code_legacy: SGModel.TYPE_BOOLEAN,
		es5_nodejs: SGModel.TYPE_BOOLEAN,
		vue: SGModel.TYPE_BOOLEAN,
		react: SGModel.TYPE_BOOLEAN,
		php: SGModel.TYPE_BOOLEAN,
		pixijs: SGModel.TYPE_BOOLEAN,
		super_interesting: SGModel.TYPE_BOOLEAN,
		
		hours_extra_charge: SGModel.TYPE_NUMBER
	};
	
	static hashProperties = ["contract", "level", "days_in_week", "hours_in_day", "relocation", "code_startup", "code_supported", "code_legacy", "es5_nodejs", "vue", "react", "php", "pixijs", "super_interesting"];
	
	static HOUR_RATE_BASE = 500;
	static HOUR_RATE_MIN = 500;
	static RELOCATION_MONTH_MIN = 500000;
	
	static CONTRACT_KOEF = [1, 1.36, 1.5, 1.75, 2, 2.25];
	static LEVEL_KOEF = [0.5, 0.75, 0.9, 1, 1.25, 1.5];
	static DAYS_IN_WEEK_KOEF = [0.5, 0.6, 0.7, 0.8, 1, 1.25, 2];
	static RELOCATION_KOEF = 2;
	static CODE_SUPPORTED_KOEF = 1.25;
	static CODE_LEGACY_KOEF = 2;
	static ES5_NODEJS_KOEF = 0.95;
	static REACT_KOEF = 1.05;
	static PHP_KOEF = 1.1;
	static PIXIJS_KOEF = 0.9;
	static SUPER_INTERESTING_KOEF = 0.75;
	
	static FIBONACCI = [1,2,3,5,8,13,21,34];
	static HOURS_EXTRA_CHARGE = [];
	
	initialize() {
		
		// 4h -> 5 (0%)
		for (var i = 0; i < Salary.FIBONACCI.length; i++) {
			Salary.HOURS_EXTRA_CHARGE[i] = (100 * (Salary.FIBONACCI[i] / (5 * (i+1) / 4) - 1)).toFixed(0);
		}
		
		let codeTypes = ["code_startup", "code_supported", "code_legacy"];
		this.on(codeTypes, (value, valuePrev, name)=>{
			codeTypes.forEach(_name=>{
				var elem = document.querySelector("[sg-property="+_name+"]");
				if (name !== _name) {
					this.set(_name, false, void 0, SGModelView.FLAG_NO_CALLBACKS);
				}
				if (this.get(_name)) {
					elem.parentNode.classList.add("selected");
				} else {
					elem.parentNode.classList.remove("selected");
				}
			});
		});
		
		this.on("hours_in_day", (hours)=>{
			this.set("hours_in_day_desc", (hours == 8 ? "Фуллтайм" : hours + " " + this.getHoursMeas(hours)+"/день"));
			this.set("hours_extra_charge", Salary.HOURS_EXTRA_CHARGE[hours - 1]);
		}, void 0, void 0, SGModel.FLAG_IMMEDIATELY);
		
		this.on("hours", (hours)=>{
			this.set("hours_meas", this.getHoursMeas(hours));
		}, void 0, void 0, SGModel.FLAG_IMMEDIATELY);
		
		this.set("rate_hour_min", Salary.HOUR_RATE_MIN);
		this.set("relocation_month_min", Salary.RELOCATION_MONTH_MIN);
		
		let eRelocationLabel = document.querySelector("#relocation_label");
		eRelocationLabel.title = eRelocationLabel.title.replace("%relocation_month_min%", Salary.RELOCATION_MONTH_MIN);
		
		//document.querySelector("#send_offer").addEventListener("click", this.sendOffer.bind(this));
		document.querySelector("#save_link").addEventListener("click", this.saveLink.bind(this));
		document.querySelector("#link_copy").onclick = this.linkCopy.bind(this);
		
		this.bindHTML("body");
		
		// Hash parser
		let parameters = location.hash.replace("#", "").split("&");
		for (var i = 0; i < parameters.length; i++) {
			parameters[i] = parameters[i].split("=");
			if (this.has(parameters[i][0])) {
				this.set(parameters[i][0], parameters[i][1]);
			}
		}
		
		this.setOnAllCallback(this.calc, SGModel.FLAG_IMMEDIATELY);
	}
	
	calc() {
		let hours = 4 * this.get("days_in_week") * this.get("hours_in_day");
		this.set("hours", hours);
		let salary = this.constructor.FIBONACCI[this.get("hours_in_day") - 1] / this.get("hours_in_day")  * Salary.HOUR_RATE_BASE * hours;
		salary *= Salary.CONTRACT_KOEF[this.get("contract") - 1];
		salary *= Salary.LEVEL_KOEF[this.get("level") - 1];
		salary *= Salary.DAYS_IN_WEEK_KOEF[this.get("days_in_week") - 1];
		salary *= this.get("relocation") ? Salary.RELOCATION_KOEF : 1;
		salary *= this.get("code_supported") ? Salary.CODE_SUPPORTED_KOEF : 1;
		salary *= this.get("code_legacy") ? Salary.CODE_LEGACY_KOEF : 1;
		salary *= this.get("es5_nodejs") ? Salary.ES5_NODEJS_KOEF : 1;
		salary *= this.get("vue") ? Salary.ES5_NODEJS_KOEF : 1;
		salary *= this.get("react") ? Salary.REACT_KOEF : 1;
		salary *= this.get("php") ? Salary.PHP_KOEF : 1;
		salary *= this.get("pixijs") ? Salary.PIXIJS_KOEF : 1;
		salary *= this.get("super_interesting") ? Salary.SUPER_INTERESTING_KOEF : 1;
		
		if (this.get("relocation")) salary = Math.max(salary, Salary.RELOCATION_MONTH_MIN);
		
		let rate = Math.max(salary / hours, Salary.HOUR_RATE_MIN);
		
		salary = rate * hours;
		
		salary = SGModel.roundTo(salary, -2);
		this.set("salary_hour", SGModel.roundTo(rate, -1));
		this.set("salary_month", salary);
		this.set("salary_year", this.get("salary_month") * 12);
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
		return (''+value.toLocaleString()).replace(/\s/, "&thinsp;");
	}
	
	formatHoursExtraCharge(hours_extra_charge) {
		if (hours_extra_charge < 0) {
			return "(" + hours_extra_charge + "%)";
		} else if (hours_extra_charge > 0) {
			return "(+" + hours_extra_charge + "%)";
		} else {
			return "";
		}
	}
	
	/*sendOffer() {
		debugger;
		Email.send({
			SecureToken: "todo",
			To: "_@_.ru",
			From: "_@sg2d.ru",
			Subject: "Offer from the salary constructor form",
			Body: "TODO..."
		}).then(
			message => console.log(message)
		);
	}*/
	
	saveLink() {
		var hash = [];
		Salary.hashProperties.forEach(name=>{
			var value = this.properties[name];
			if (value === false) return;
			if (value === true) value = 1;
			hash.push(name + "=" + value);
		})
		let href = location.href.replace(/#.*/, "") + "#" + hash.join("&");
		let link_input = document.querySelector("#link_link");
		link_input.value = href;
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
}

addEventListener("load", ()=>{ window.salaryApp = new Salary(); });
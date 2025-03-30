import SGModel from './../sg-model.js';
import SGModelView from './../sg-model-view.js';
import simpleModelWithBasicTests from './modules/simple-model-with-basic.js';
import parsePgStrArrayTests from './modules/parse-pg-str-array.js';
import simpleModelViewWithBasicTests from './modules/simple-modelview-with-basic.js';
import deferredPropertiesTests from './modules/deferred-properties.js';

window.sleep = function(ms = 33) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

const eContent = document.querySelector('#content');
const eTemplateTestsGroup = document.querySelector('#tmp_tests_group');
const eTemplateTestsItem = document.querySelector('#tmp_tests_item');
const eStatistics = document.querySelector('.statistics');
const eStatPassed = eStatistics.querySelector('.passed');
const eStatFailed = eStatistics.querySelector('.failed');
const eStatError = eStatistics.querySelector('.error');
let globalCounter = 0;

document.title = `SGModel & SGModelView - Автотесты для v${SGModel.version}`;
document.querySelector('.header h5 > u').innerText = `v${SGModel.version}`;

// Очищаем комментарии на первом уровне
eTemplateTestsGroup.content.childNodes.forEach(e => {
	if (e.nodeType === Node.COMMENT_NODE) e.remove();
});

async function run() {
	const testsGroups = window.testsGroups = [ // [{ class, instance, list }]
		await simpleModelWithBasicTests(),
		await parsePgStrArrayTests(),
		await simpleModelViewWithBasicTests(),
		await deferredPropertiesTests(),
	];

	const stats = {
		passed: 0,
		failed: 0,
		error: 0,
	};
	for (let testIndex = 0; testIndex < testsGroups.length; testIndex++) {
		const testsGroup = testsGroups[testIndex];
		if (!testsGroup.title) return;
		globalCounter++;
		const eSection = document.createElement('SECTION');
		eSection.__testsGroup = testsGroup;
		eSection.classList.add('tests-group');
		const eBlock =  eTemplateTestsGroup.content.cloneNode(true);
		eSection.append(eBlock);
		eContent.append(eSection);
		const eHeader = eSection.querySelector('h6');
		eHeader.childNodes[0].textContent = `${globalCounter}. ${testsGroup.title}`;
		eHeader.querySelector('a').setAttribute('href', `#${testsGroup.code}`);
		if (testsGroup.sourceCode) {
			eHeader.querySelector('button.show-code').style.display = 'inline-block';
		}
		if (testsGroup.description) {
			eHeader.querySelector('button.show-description').style.display = 'inline-block';
		}
		const eShowViewButton = eSection.querySelector('button.show-view');
		const eView = eSection.querySelector('.view');
		const eList = eSection.querySelector('ul');
		let localCounter = 0;
		for (let testIndex = 0; testIndex < testsGroup.items.length; testIndex++) {
			const item = testsGroup.items[testIndex];
			const eItem =  eTemplateTestsItem.content.cloneNode(true);
			const eItemHeader = eItem.querySelector('.item-header');
			const eStatus = eItemHeader.querySelector('.status');
			const eDetails = eItem.querySelector('.item-details');
			eItemHeader.querySelector('a').setAttribute('href', `#${item.code}`);
			eItemHeader.querySelector('a').onclick = stopPropagation;
			eItemHeader.querySelector('.ordnum').innerText = `${globalCounter}.${++localCounter}.`;
			eItemHeader.querySelector('.title').innerHTML = (item.title ? ` &ndash; ${item.title}` : '');
			item.testsGroup = testsGroup;
			const inData = item.input;
			let status = '';
			const runner = item.runner || item.testsGroup.runner;
			try {
				item.fact = await runner(item.input, eView);
				item.passed = (JSON.stringify(item.fact, jsonStringifyReplacer) === JSON.stringify(item.verify, jsonStringifyReplacer));
				status = (item.passed ? 'passed' : 'failed');
				stats[status]++; 
			} catch (err) {
				console.error(err);
				status = 'error';
				stats.error++;
				item.fact = JSON.stringify(err, Object.getOwnPropertyNames(err));
			}
			if ((testsGroup.instance instanceof SGModelView) && (testsGroup.instance.$view) && (eShowViewButton.style.display === 'none')) {
				eShowViewButton.style.display = 'block';
			}
			eStatus.innerText = status;
			eStatus.classList.add(status);
			try {
				eDetails.querySelector('.input-data').innerHTML = (inData instanceof Object && inData.constructor ? `instance of ${inData.constructor.name}` : JSON.stringify(inData, jsonStringifyReplacer));
			} catch (err) {
				console.error(err);
				eDetails.querySelector('.input-data').innerHTML = `<b style="color: red">${err.message}</b>`;
			}
			eDetails.querySelector('.runner').innerHTML = String(runner);
			let verify;
			try {
				verify = JSON.stringify(item.verify, jsonStringifyReplacer, 2);
			} catch (err) {
				console.error(err);
				verify = err.message;
			}
			if (status === 'passed') {
				eDetails.querySelector('.passed').style.display = 'block';
			} else {
				// Выделяем отличающиеся строки цветом
				let processedLines1 = verify.split('\n');
				let processedLines2;
				try {
					processedLines2 = JSON.stringify(item.fact || '', jsonStringifyReplacer, 2).split('\n');
				} catch (err) {
					console.error(err);
					processedLines2 = [err.message, ...err.stack.split('\n')];
				}
				const len = Math.max(processedLines1.length, processedLines2.length);
				for (let index = 0; index < len; index++) {
					if (index >= processedLines1.length || index >= processedLines2.length || processedLines1[index] !== processedLines2[index]) {
						if (index < processedLines1.length) processedLines1[index] = `<b class="warn">${processedLines1[index]}</b>`;
						if (index < processedLines2.length) processedLines2[index] = `<b class="warn">${processedLines2[index]}</b>`;
					}
				}
				verify = processedLines1.join('\n')
				const eSpan = eDetails.querySelector('.failed-or-error');
				eSpan.style.display = 'block';
				eSpan.innerHTML = processedLines2.join('\n');
			}
			eDetails.querySelector('.verify').innerHTML = verify;
			eList.append(eItem);
		}
		const total = stats.passed + stats.failed + stats.error;
		eStatPassed.innerHTML = `passed: ${Number(stats.passed / total * 100).toFixed(1)}% (${stats.passed} из ${total})`;
		eStatFailed.innerHTML = `failed: ${stats.failed > 0 ? `${Number(stats.failed / total * 100).toFixed(1)}% (${stats.failed})` : 'нет'}`;
		eStatError.innerHTML = `error: ${stats.error > 0 ? `${Number(stats.error / total * 100).toFixed(1)}% (${stats.error})` : 'нет'}`;
		if (stats.passed) eStatPassed.classList.remove('no-items'); else eStatPassed.classList.add('no-items');
		if (stats.failed) eStatFailed.classList.remove('no-items'); else eStatFailed.classList.add('no-items');
		if (stats.error) eStatError.classList.remove('no-items'); else eStatError.classList.add('no-items');
	}
}

function jsonStringifyReplacer(_, value) {
	return (typeof value === 'bigint' ? `${value.toString()}n`: value);
}

let oExpanded = {
	passed: false,
	failed: false,
	error: false,
};
document.onClickExpandCollapse = function(eExpandCollapseButton) {
	const type = (eExpandCollapseButton.classList.contains('passed') ? 'passed' : (eExpandCollapseButton.classList.contains('failed') ? 'failed' : 'error'));
	const expanded = oExpanded[type] = !oExpanded[type];
	eContent.querySelectorAll('.item-header').forEach(eItemHeader => {
		const itemType = eItemHeader.querySelector('.status').innerText;
		if (itemType === type) {
			const eItemDetails = eItemHeader.parentNode.querySelector('.item-details');
			if (expanded) {
				if (eItemDetails.style.display === 'none') eItemHeader.click();
			} else {
				if (eItemDetails.style.display !== 'none') eItemHeader.click();
			}
		}
	});
}

document.onClickItemHeader = function(e) {
	const eLi = e.closest('li');
	if (eLi) {
		const eDetails = eLi.querySelector('.item-details');
		eDetails.style.display = (eDetails.style.display === 'none' ? 'block' : 'none');
		eLi.querySelector('.close').style.display = eDetails.style.display;
		if (eDetails.style.display !== 'none') {
			eLi.classList.add('expanded');
		} else {
			eLi.classList.remove('expanded');
		}
	}
}

document.onClickShowView = function(eButton) {
	const eSection = eButton.closest('SECTION');
	const eView = eSection.querySelector('div.view');
	if (eView.style.display !== 'none') {
		eView.style.display = 'none';
		eButton.textContent = 'Показать представление';
		eButton.classList.remove('active');
	} else {
		eView.style.display = 'block';
		eButton.textContent = 'Скрыть представление';
		eButton.classList.add('active');
	}
}

document.onClickShowCode = function(eButton) {
	const eSection = eButton.closest('SECTION');
	const ePre = eSection.querySelector('pre.code');
	const ePreOther = eSection.querySelector('pre.description');
	if (ePre.style.display !== 'none') {
		ePre.style.display = 'none';
		eButton.textContent = 'Показать код';
		eButton.classList.remove('active');
		return;
	}
	const code = eSection && eSection.__testsGroup && eSection.__testsGroup.sourceCode;
	if (code) {
		ePre.innerHTML = code;
		ePre.style.display = 'block';
		eButton.textContent = 'Скрыть код';
		eButton.classList.add('active');
		if (ePreOther.style.display !== 'none') {
			eSection.querySelector('button.show-description').click();
		}
	}
}

document.onClickShowDescription = function(eButton) {
	const eSection = eButton.closest('SECTION');
	const ePre = eSection.querySelector('pre.description');
	const ePreOther = eSection.querySelector('pre.code');
	if (ePre.style.display !== 'none') {
		ePre.style.display = 'none';
		eButton.textContent = 'Показать описание';
		eButton.classList.remove('active');
		return;
	}
	const description = eSection && eSection.__testsGroup && eSection.__testsGroup.description;
	if (description) {
		ePre.innerHTML = description.replace(/^\s*|\s*$/g, '');
		ePre.style.display = 'block';
		eButton.textContent = 'Скрыть описание';
		eButton.classList.add('active');
		if (ePreOther.style.display !== 'none') {
			eSection.querySelector('button.show-code').click();
		}
	}
}

function stopPropagation(evt) {
	evt.stopPropagation();
}

run();
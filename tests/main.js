import SGModel from '/src/sg-model.js';
import SGModelView from '/src/sg-model-view.js';
import simpleModelWithBasicTests from './modules/simple-model-with-basic.js';
import parsePgStrArrayTests from './modules/parse-pg-str-array.js';
import simpleModelViewWithBasicTests from './modules/simple-modelview-with-basic.js';
import deferredPropertiesTests from './modules/model-deferred-properties.js';

// Модули групп тестов
const creators = [
	simpleModelWithBasicTests,
	parsePgStrArrayTests,
	simpleModelViewWithBasicTests,
	deferredPropertiesTests,
];

// Глобальные элементы и переменные
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

async function run() {
	const testsGroups = window.testsGroups = []; // [{ class, instance, list }, ...]
	const stats = { passed: 0, failed: 0, error: 0 };
	for (const creator of creators) {
		try {
			testsGroups.push(await creator());
		} catch (err) {
			console.error(err);
			testsGroups.push({
				title: err.message,
				sourceCode: err.stack,
				error: true,
				items: []
			});
		}
	}
	for (const testsGroup of testsGroups) {
		if (!testsGroup.title) return;
		globalCounter++;
		const eSection = document.createElement('SECTION');
		eSection.__testsGroup = testsGroup;
		eSection.classList.add('tests-group');
		const eBlock =	eTemplateTestsGroup.content.cloneNode(true);
		eSection.append(eBlock);
		eContent.append(eSection);
		const eHeader6 = eSection.querySelector('h6');
		const eShowCodeBtn = eHeader6.querySelector('button.show-code');
		eHeader6.childNodes[0].textContent = `${globalCounter}. ${testsGroup.title}`;
		eHeader6.querySelector('a').setAttribute('href', `#${testsGroup.code}`);
		if (testsGroup.sourceCode) {
			eShowCodeBtn.style.display = 'inline-block';
		}
		if (testsGroup.description) {
			eHeader6.querySelector('button.show-description').style.display = 'inline-block';
		}
		const eShowViewButton = eSection.querySelector('button.show-view');
		const eView = eSection.querySelector('.view');
		if (testsGroup.showView === true) eShowViewButton.click();
		const eList = eSection.querySelector('ul');
		let localCounter = 0;
		for (const test of testsGroup.items) {
			if (test.skip === true) continue;
			const eItem =	eTemplateTestsItem.content.cloneNode(true);
			const eItemHeader = eItem.querySelector('.item-header');
			const eStatus = eItemHeader.querySelector('.status');
			const eDetails = eItem.querySelector('.item-details');
			eItemHeader.querySelector('a').setAttribute('href', `#${test.code}`);
			eItemHeader.querySelector('a').onclick = stopPropagation;
			eItemHeader.querySelector('.ordnum').innerText = `${globalCounter}.${++localCounter}.`;
			eItemHeader.querySelector('.title').innerHTML = (test.title ? ` &ndash; ${test.title}` : '');
			const eIconCopyVerify = eDetails.querySelector('.icon-copy.js-verify');
			const eIconCopyFailedOrError = eDetails.querySelector('.icon-copy.js-failed-or-error');
			eIconCopyVerify.addEventListener('click', copyResult);
			eIconCopyFailedOrError.addEventListener('click', copyResult);
			test.testsGroup = testsGroup;
			const inData = test.input;
			let status = '';
			const runner = test.runner || test.testsGroup.runner;
			try {
				test.fact = await runner(test.input, eView);
				test.passed = (JSON.stringify(test.fact, jsonStringifyReplacer) === JSON.stringify(test.verify, jsonStringifyReplacer));
				status = (test.passed ? 'passed' : 'failed');
				stats[status]++; 
			} catch (err) {
				console.error(err);
				status = 'error';
				stats.error++;
				test.fact = JSON.stringify(err, Object.getOwnPropertyNames(err));
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
			let verify, comparedLines1;
			try {
				verify = JSON.stringify(test.verify, jsonStringifyReplacer, 2);
			} catch (err) {
				console.error(err);
				verify = err.message;
			}
			const ePre1 = eDetails.querySelector('.verify')
			comparedLines1 = verify;
			if (status === 'passed') {
				eDetails.querySelector('.passed').style.display = 'block';
			} else {
				// Выделяем отличающиеся строки цветом
				let processedLines1 = verify.split('\n');
				let processedLines2;
				try {
					processedLines2 = JSON.stringify(test.fact || '', jsonStringifyReplacer, 2).split('\n');
				} catch (err) {
					console.error(err);
					processedLines2 = [err.message, ...err.stack.split('\n')];
				}
				const { result1, result2: comparedLines2 } = compareTextBlocks(processedLines1, processedLines2);
				const ePre2 = eDetails.querySelector('.failed-or-error');
				ePre2.style.display = 'block';
				ePre2.innerHTML = comparedLines2;
				comparedLines1 = result1;
				new ScrollSync(ePre1, ePre2);
  			new ScrollSync(ePre2, ePre1);
			}
			ePre1.innerHTML = comparedLines1;
			eList.append(eItem);
			if (test.break === true) break;
		}
		if (testsGroup.error === true) {
			eHeader6.classList.add('error');
			eShowCodeBtn.click();
			stats.error++;
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
	const eView = eButton.closest('SECTION').querySelector('div.view');
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

window.loadJSON = function(moduleCode, testCode) {
	const url = `modules/json/${moduleCode}/${testCode}.json`;
	return fetch(url, { json: true }).then(async result => {
		try {
			if (result.ok) return await result.json();
		} catch (err) {
			err.message = err.message + `. Url="${url}"`;
			console.error(err);
			return err.message;
		}
		throw new Error(`File with url "${url}" does not exist!`);
	});
}

function copyResult() {
	this.classList.add('copied');
	setTimeout(() => this.classList.remove('copied'), 2000);
	const ePre = this.parentNode.querySelector('pre');
	const text = ePre.textContent.replace(/\u00A0/g, ' ');
	try {
		navigator.clipboard.writeText(text);
	} catch (err) { // eslint-disable-line no-unused-vars
		const textarea = document.createElement('textarea');
		textarea.value = text;
		document.body.appendChild(textarea);
		textarea.select();
		try {
			const success = document.execCommand('copy');
			if (!success) throw new Error('Copy failed');
			console.log('Текст скопирован!');
		} catch (err) {
			console.error('Ошибка копирования:', err);
		} finally {
			document.body.removeChild(textarea);
		}
	}
}

/**
 * Сравнивает две версии текста построчно и помечает различия тегом <b class="warn">...</b>
 * @ai used ChatGPT 2025.04.26
 * @param {string[]} processedLines1 - Первая версия текста, разбитая на строки
 * @param {string[]} processedLines2 - Вторая версия текста, разбитая на строки
 * @returns {{ result1: string, result2: string }} - Объекты с доработанными строками текста
 */
function compareTextBlocks(processedLines1, processedLines2) {
	const SEARCH_AREA = 10; // Зона поиска ближайших совпадений после расхождения
	const result1 = [];
	const result2 = [];
	let i = 0, j = 0;
	while (i < processedLines1.length || j < processedLines2.length) {
		const line1 = processedLines1[i] ?? '';
		const line2 = processedLines2[j] ?? '';
		if (line1 === line2) {
			result1.push(line1);
			result2.push(line2);
			i++;
			j++;
		} else {
			// Попробуем найти ближайшее совпадение вперёд
			let found = false;
			for (let lookahead = 1; lookahead <= SEARCH_AREA; lookahead++) { // Ограничим зону поиска
				if (processedLines1[i + lookahead] === line2) {
					// Пропущены строки в первой версии
					for (let k = 0; k < lookahead; k++) {
						result1.push(`<b class="warn">${processedLines1[i + k]}</b>`);
						result2.push('<b class="warn">&nbsp;</b>');
					}
					i += lookahead;
					found = true;
					break;
				} else if (processedLines2[j + lookahead] === line1) {
					// Пропущены строки во второй версии
					for (let k = 0; k < lookahead; k++) {
						result1.push('<b class="warn">&nbsp;</b>');
						result2.push(`<b class="warn">${processedLines2[j + k]}</b>`);
					}
					j += lookahead;
					found = true;
					break;
				}
			}
			if (!found) {
				// Строки различаются, но соответствий рядом нет
				result1.push(`<b class="warn">${line1}</b>`);
				result2.push(`<b class="warn">${line2}</b>`);
				i++;
				j++;
			}
		}
	}
	return {
		result1: result1.join('\n'),
		result2: result2.join('\n'),
	};
}

/**
 * Для синхронизации скроллинга в PRE-тегах
 * @ai used DeepSeek 2025.04.29
 */
class ScrollSync {
	constructor(source, target) {
		this.source = source;
		this.target = target;
		this.isSyncing = false;
		this.source.addEventListener('scroll', this.syncScroll.bind(this));
	}
	syncScroll() {
		if (this.isSyncing) return;
		this.isSyncing = true;
		// Синхронизация scrollTop
		const scrollPercentage = this.source.scrollTop / (this.source.scrollHeight - this.source.clientHeight);
		this.target.scrollTop = scrollPercentage * (this.target.scrollHeight - this.target.clientHeight);
		// Синхронизация scrollLeft
		const scrollLeftPercentage = this.source.scrollLeft / (this.source.scrollWidth - this.source.clientWidth);
		this.target.scrollLeft = scrollLeftPercentage * (this.target.scrollWidth - this.target.clientWidth);
		this.isSyncing = false;
	}
}

// Очистка комментариев в шаблоне (на первом уровне вложенности)
eTemplateTestsGroup.content.childNodes.forEach(e => {
	if (e.nodeType === Node.COMMENT_NODE) e.remove();
});

run();
import simpleModelWithBasicTests from './modules/simple-model-with-basic-tests.js';
import parsePgStrArrayTests from './modules/parse-pg-str-array-tests.js';

window.sleep = function(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

const eContent = document.querySelector('#content');
const eTemplateTestsGroup = document.querySelector('#tmp_tests_group');
const eTemplateTestsItem = document.querySelector('#tmp_tests_item');
let globalCounter = 0;

async function run() {
	const tests = [
		await simpleModelWithBasicTests(),
		await parsePgStrArrayTests(),
	];

	tests.forEach(testsGroup => {
		if (!testsGroup.title) return;
		globalCounter++;
		const eSection = document.createElement('SECTION');
		eSection.__testsGroup = testsGroup;
		const eBlock =  eTemplateTestsGroup.content.cloneNode(true);
		eSection.append(eBlock);
		eContent.append(eSection);
		const eHeader = eSection.querySelector('h6');
		eHeader.childNodes[0].textContent = `${globalCounter}. ${testsGroup.title} `;
		if (testsGroup.code) {
			eHeader.querySelector('button.show-code').style.display = 'inline-block';
		}
		if (testsGroup.description) {
			eHeader.querySelector('button.show-description').style.display = 'inline-block';
		}
		const eList = eSection.querySelector('ul');
		let localCounter = 0;
		testsGroup.items.forEach(item => {
			const eItem =  eTemplateTestsItem.content.cloneNode(true);
			const eStatus = eItem.querySelector('.status');
			const eDetails = eItem.querySelector('.item-details');
			eItem.querySelector('.ordnum').innerText = `${globalCounter}.${++localCounter}.`;
			eItem.querySelector('.title').innerHTML = (item.title ? ` &ndash; ${item.title}` : '');
			item.testsGroup = testsGroup;
			const inData = item.input;
			let status = '';
			const runner = item.runner || item.testsGroup.runner;
			try {
				item.fact = runner(item.input);
				item.passed = (JSON.stringify(item.fact) === JSON.stringify(item.verify));
				status = (item.passed ? 'passed' : 'failed');
			} catch (err) {
				status = 'error';
				if (!item.fact) {
					item.fact = JSON.stringify(err, Object.getOwnPropertyNames(err));
				}
			}
			eStatus.innerText = status;
			eStatus.classList.add(status);
			eDetails.querySelector('.input-data').innerHTML = (inData instanceof Object && inData.constructor ? `instance of ${inData.constructor.name}` : JSON.stringify(inData));
			eDetails.querySelector('.runner').innerHTML = String(runner);
			let verify = JSON.stringify(item.verify, null, 2);
			if (status === 'passed') {
				eDetails.querySelector('.success').style.display = 'block';
			} else {
				// Выделяем отличающиеся строки цветом
				let processedLines1 = verify.split('\n');
				let processedLines2 = JSON.stringify(item.fact, null, 2).split('\n');
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
		});
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
	const code = eSection && eSection.__testsGroup && eSection.__testsGroup.code;
	if (code) {
		/*let lines = String(code).split('\n').slice(1, -1);
		while (lines.length && lines[0] === '') {
			lines = lines.slice(1);
		}
		if (lines.at(-1).includes('prepareTests')) lines = lines.slice(0, -1);
		const processedLines = lines.map(line => {
			if (line.startsWith('\t')) return line.substring(1);
			if (line.startsWith('  ')) return line.substring(2);
			return line;
		});*/
		ePre.innerHTML = code;//processedLines.join('\n');
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

run();
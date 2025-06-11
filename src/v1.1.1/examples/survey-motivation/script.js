let surveyData = [];
let currentFactorIndex = 0;
let factorScores = [];

async function fetchSurveyData() {
	const response = await fetch('motivation_survey.json');
	if (!response.ok) {
		throw new Error('Ошибка загрузки данных');
	}
	return await response.json();
}

function createFactorElement(factor) {
	const template = document.getElementById('factor-template');
	const clone = template.content.cloneNode(true);
	
	const title = clone.querySelector('.factor-title');
	title.textContent = factor.factor;

	const questionsContainer = clone.querySelector('.questions');
	factor.questions.forEach((question, qIndex) => {
		const questionDiv = document.createElement('div');
		questionDiv.className = 'mb-4';

		const questionText = document.createElement('p');
		questionText.className = 'fw-semibold';
		questionText.textContent = question.text;
		questionDiv.appendChild(questionText);

		const answersDiv = document.createElement('div');
		answersDiv.className = 'list-group';

		question.answers.forEach(answer => {
			const label = document.createElement('label');
			label.className = 'list-group-item list-group-item-action';
			label.style.cursor = 'pointer';

			const input = document.createElement('input');
			input.type = 'radio';
			input.name = `factor-${factor.index}-question-${qIndex}`;
			input.value = answer.score;
			input.className = 'form-check-input me-2';

			label.appendChild(input);
			label.append(answer.text);
			answersDiv.appendChild(label);
		});

		questionDiv.appendChild(answersDiv);
		questionsContainer.appendChild(questionDiv);
	});

	return clone;
}

function enableNextButtonIfReady(section) {
	const allQuestions = section.querySelectorAll('.question');
	const answered = Array.from(allQuestions).every(q => q.querySelector('input[type="radio"]:checked'));
	const nextBtn = section.querySelector('.next-btn');
	nextBtn.disabled = !answered;
}

function updateProgressBar() {
	const progressBar = document.getElementById('progress-bar');
	const percent = Math.round((currentFactorIndex / surveyData.length) * 100);
	progressBar.style.width = `${percent}%`;
	progressBar.textContent = `${percent}%`;
}

function showNextFactor() {
	const surveyContainer = document.getElementById('survey');
	surveyContainer.innerHTML = ''; // Очистить

	updateProgressBar();

	if (currentFactorIndex >= surveyData.length) {
		calculateFinalResult();
		return;
	}

	const factor = surveyData[currentFactorIndex];
	const factorElement = createFactorElement(factor);
	surveyContainer.appendChild(factorElement);

	const section = surveyContainer.querySelector('.card');
	section.addEventListener('change', () => enableNextButtonIfReady(section));

	const nextBtn = section.querySelector('.next-btn');
	nextBtn.addEventListener('click', () => {
		calculateFactorScore(section);
		currentFactorIndex++;
		showNextFactor();
	});

	document.querySelector('header').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function calculateFactorScore(section) {
	let sum = 0;

	section.querySelectorAll('input[type="radio"]:checked').forEach(input => {
		sum += parseFloat(input.value);
	});

	factorScores.push(sum);
}

function calculateFinalResult() {
	const total = factorScores.reduce((acc, val) => acc + val, 0);
	const average = (total / factorScores.length).toFixed(2);

	const resultDiv = document.getElementById('result');
	resultDiv.innerHTML = `
		<p>Ваш итоговый балл мотивации: <strong>${average}</strong></p>
		<button id="downloadReport" class="btn btn-success mt-3">Отчёт</button>
	`;

	document.getElementById('progress-bar').style.width = '100%';
	document.getElementById('progress-bar').textContent = '100%';
	document.getElementById('downloadReport').addEventListener('click', generatePDFReport);
}

document.addEventListener('DOMContentLoaded', async () => {
	try {
		surveyData = await fetchSurveyData();
		showNextFactor();
	} catch (error) {
		console.error(error);
		alert('Ошибка загрузки анкеты.');
	}
});

function generatePDFReport() {
	const { jsPDF } = window.jspdf;
	const doc = new jsPDF();
	let y = 10;
	let lineHeight = 8;

	doc.setFont('Arial', 'normal');
	doc.setFontSize(14);
	doc.text('Отчёт по профессиональной мотивации', 10, y);
	y += lineHeight * 2;

	surveyData.forEach((factor, fIndex) => {
		const factorScore = factorScores[fIndex];

		doc.setFontSize(12);
		doc.setTextColor(40, 40, 40);
		doc.text(`Фактор: ${factor.factor} (балл: ${factorScore})`, 10, y);
		y += lineHeight;

		factor.questions.forEach((question, qIndex) => {
			const selectedInput = document.querySelector(
				`input[name="factor-${factor.index}-question-${qIndex}"]:checked`
			);

			if (selectedInput) {
				const selectedLabel = selectedInput.parentElement.textContent.trim();
				const score = selectedInput.value;

				doc.setFontSize(10);
				doc.setTextColor(70, 70, 70);
				doc.text(`Q: ${question.text}`, 12, y);
				y += lineHeight;
				doc.text(`Выбранный ответ: ${selectedLabel}`, 14, y);
				y += lineHeight;
				doc.text(`Коэффициент: ${score}`, 14, y);
				y += lineHeight;

				if (y > 270) { // Переход на новую страницу
					doc.addPage();
					y = 10;
				}
			}
		});

		y += lineHeight * 2;
		if (y > 270) {
			doc.addPage();
			y = 10;
		}
	});

	// Итоговый результат
	const finalScore = (factorScores.reduce((acc, val) => acc + val, 0) / factorScores.length).toFixed(2);

	doc.setFontSize(14);
	doc.setTextColor(0, 0, 0);
	doc.text('Итоговый балл анкеты: ' + finalScore, 10, y);

	// Сохранение PDF
	doc.save('motivation_report.pdf');
}
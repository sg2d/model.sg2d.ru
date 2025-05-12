import SGModel from './../../sg-model.js';

function creator() {
	return prepareTests();
}

function prepareTests() {
	return {
		class: null,
		instance: null,
		code: 'sgmodel-static-parsepgstrarray',
		title: 'SGModel: static parsePgStrArray(line)',
		sourceCode: SGModel.utils.parsePgStrArray,
		description: `
-- Пример структуры БД и данных для тестирования типичного массива объектов и наличия специальных символов:
CREATE TYPE wob_url_type AS (
	title varchar(128),
	url varchar(256)
);

CREATE TABLE IF NOT EXISTS wob_tasks (
	id serial PRIMARY KEY,
	code VARCHAR(16) NOT NULL,
	description text,
	wiki_links wob_url_type[],
	doc_links wob_url_type[]
);

INSERT INTO wob_tasks (id, code, description, wiki_links, doc_links) OVERRIDING SYSTEM VALUE VALUES	(
	1, 'ADO-52', 'description...',
	ARRAY[('Проект SG2D ModelView - Отечественный MVVM-фреймворк (4-SGM)','https://wiki.sg2d.ru/ru/dev/sgm'),('SG2D Wiki: 3. Регламент по разработке: 9. CI/CD','https://wiki.sg2d.ru/ru/dev/regulations#h-9-cicd')]::wob_url_type[],
	ARRAY[('SGModel & SGModelView - Binding models and MVVM pattern','https://model.sg2d.ru/'),('Special symbols: '', ", \\, /, (, ), |, -, _, +, =, {, }, \`, !, ?, @, #, $, %, ^, &, *, ~, . end!','https://ggg.ggg')]::wob_url_type[]
);
`,
		runner: async (inData) => SGModel.utils.parsePgStrArray(inData),
		items: [
			{
				code: 'sgmodel-static-parsepgstrarray__simple',
				title: 'простой список',
				input: '{coding,debug,ai,git}',
				verify: JSON.parse('["coding","debug","ai","git"]'),
			},
			{
				code: 'sgmodel-static-parsepgstrarray__typical-array',
				title: 'типичный массив объектов',
				input: JSON.parse('"{\\"(\\\\\\"Проект SG2D ModelView - Отечественный MVVM-фреймворк (4-SGM)\\\\\\",https://wiki.sg2d.ru/ru/dev/sgm)\\",\\"(\\\\\\"SG2D Wiki: 3. Регламент по разработке: 9. CI/CD\\\\\\",https://wiki.sg2d.ru/ru/dev/regulations#h-9-cicd)\\"}"'),
				verify: JSON.parse('[["Проект SG2D ModelView - Отечественный MVVM-фреймворк (4-SGM)","https://wiki.sg2d.ru/ru/dev/sgm"],["SG2D Wiki: 3. Регламент по разработке: 9. CI/CD","https://wiki.sg2d.ru/ru/dev/regulations#h-9-cicd"]]'),
			},
			{
				code: 'sgmodel-static-parsepgstrarray_special-chars',
				title: 'обработка специальных символов',
				input: JSON.parse('"{\\"(\\\\\\"SGModel & SGModelView - Binding models and MVVM pattern\\\\\\",https://model.sg2d.ru/)\\",\\"(\\\\\\"Special symbols: \', \\\\\\"\\\\\\", \\\\\\\\\\\\\\\\, /, (, ), |, -, _, +, =, {, }, `, !, ?, @, #, $, %, ^, &, *, ~, . end!\\\\\\",https://ggg.ggg)\\"}"'),
				verify: JSON.parse('[["SGModel & SGModelView - Binding models and MVVM pattern","https://model.sg2d.ru/"],["Special symbols: \', \\", \\\\, /, (, ), |, -, _, +, =, {, }, `, !, ?, @, #, $, %, ^, &, *, ~, . end!","https://ggg.ggg"]]'),
			},
		]
	};
};

export default creator;
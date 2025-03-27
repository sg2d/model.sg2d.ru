import SGModelView from './../../sg-model-view.js';

async function runner() {

	class CustomView extends SGModelView {
		static defaultProperties = {
			//
		};
		async initialize() {
			//
		}
	}

	const view = new CustomView({
		uuid: '00000000-0000-0000-0000-8240f6f432cb',
	}, {

	}, {
		
	});

	await view.initialization.promise;
	return prepareTests(CustomView, view);
}

function prepareTests(CustomView, view) {
	return {
		code: 'sgmodelview-basic-checkers',
		title: 'SGModelView: базовые проверки',
		sourceCode: runner,
		items: [
			/*{
				code: 'sgmodelview-basic-checkers__todo',
				title: 'todo: <code>todo</code>',
				input: view,
				runner: async () => ({ todo: 'todo '}),
				verify: { todo: 'todo' },
			},*/
		]
	};
};

export default runner;
# SGModel & SGModelView

*Ссылка на GitHub-страницу: [https://github.com/sg2d/model.sg2d.ru](https://github.com/sg2d/model.sg2d.ru)*

*Ссылка на Gitverse-страницу: [https://gitverse.ru/sg2d/model.sg2d.ru](https://gitverse.ru/sg2d/model.sg2d.ru)*

**SGModelView** - Микрофреймворк для создания MVVM-приложений.

**SGModel** - Библиотека-класс в основе SGModelView для работы с данными (биндинг-модели). Библиотека хорошо адаптирована для наследования классов. Может использоваться как в браузере, так и на Node.js.

#### Исходники (версия 1.1):

* [sg-model.js (58 KB)](https://model.sg2d.ru/src/v1.1.0/sg-model.js)
* [sg-model-view.js (53 KB)](https://model.sg2d.ru/src/v1.1.0/sg-model-view.js)

#### Страница автотестов:

* [https://model.sg2d.ru/src/tests](https://model.sg2d.ru/src/v1.1.0/tests)

## Описание API

* [Основные статические свойства SGModel](#основные-статические-свойства-sgmodel)
	* [static typeProperties = {…}](#static-typeproperties--)
	* [static defaultsProperties = {…}](#static-defaultsproperties--)
	* [static options = {...}](#static-options--)
	* [static localStorageKey = ""](#static-localstoragekey--)
	* [static storageProperties = []](#static-storageproperties--)
	* [static autoSave = false](#static-autosave--false)
* [Свойства и методы экземпляра SGModel](#свойства-и-методы-экземпляра-sgmodel)
	* [constructor(properties = {}, options = void 0, thisProperties = void 0)](#constructorproperties---options--void-0-thisproperties--void-0)
	* [UUID и uid](#uuid-и-uid)
	* [data](#data)
	* [initialization = {}](#initialization--)
	* [initialized = false](#initialized--false)
	* [async initialize()](#async-initialize)
	* [changed = false](#changed--false)
	* [destroyed = false](#destroyed--false)
	* [defaults()](#defaults)
	* [set(name, value, options = void 0, flags = 0, event = void 0, elem = void 0)](#setname-value-options--void-0-flags--0-event--void-0-elem--void-0)
	* [get(name)](#getname)
	* [addTo(), removeFrom(), clearProperty(), size()](#addto-removefrom-clearproperty-size)
	* [on(name, func, context = void 0, data = void 0, flags = 0)](#onname-func-context--void-0-data--void-0-flags--0)
	* [off(name, func)](#offname-func)
	* [trigger(name, value = void 0, flags = 0)](#triggername-value--void-0-flags--0)
	* [clearToDefaults()](#cleartodefaults)
	* [clear()](#clear)
	* [save()](#save)
	* [getData(bDeleteEmpties = false)](#getdatabdeleteempties--false)
	* [toJSON()](#tojson)
	* [destroy()](#destroy)
* [Поддержка Singleton паттерна в наследуемых классах](#поддержка-singleton-паттерна-в-наследуемых-классах)
	* [static singleInstance = false](#static-singleinstance--false)
	* [static getOrCreateInstance()](#static-getorcreateinstance)
	* [Статические методы для работы с данными](#статические-методы-для-работы-с-данными)
	* [static data](#static-data)
* [Утилиты используемые в SGModel](#утилиты-используемые-в-sgmodel)
	* [static defaults(dest, …sources)](#static-defaultsdest-sources)
	* [static clone(source)](#static-clonesource)
	* [static initObjectByObject(dest, source)](#static-initobjectbyobjectdest-source)
	* [static upperFirstLetter(s)](#static-upperfirstletters)
	* [static roundTo(value, precision = 0)](#static-roundtovalue-precision--0)
	* [static parsePgStrArray(line)](#static-parsepgstrarrayline)
* [MVVM-паттерн в SGModelView](#mvvm-паттерн-в-sgmodelview)
	* [Статические свойства экземпляра SGModelView](#статические-свойства-экземпляра-sgmodelview)
		* [static templates = {...}](#static-templates--)
		* [static autoLoadBind = {...}](#static-autoloadbind--)
		* [Способ инициализации вьюхи](#способ-инициализации-вьюхи)
	* [Свойства экземпляра SGModelView](#свойства-экземпляра-sgmodelview)
		* [this.$view](#thisview)
	* [Методы экземпляра SGModelView](#методы-экземпляра-sgmodelview)
		* [bindHTML(root = void 0, mTemplate = void 0)](#bindhtmlroot--void-0-mtemplate--void-0)
		* [destroy(noRemoveDOM = false)](#destroynoremovedom--false)
	* [Атрибуты в HTML-документе](#атрибуты-в-html-документе)
		* [sg-model](#sg-model)
		* [sg-property](#sg-property)
		* [sg-value](#sg-value)
		* [sg-type, sg-option и sg-dropdown](#sg-type-sg-option-и-sg-dropdown)
		* [sg-options](#sg-options)
		* [sg-css](#sg-css)
		* [sg-format](#sg-format)
		* [sg-attributes](#sg-attributes)
		* [sg-click](#sg-click)
		* [sg-for, sg-template, sg-item-variables и sg-item](#sg-for-sg-template-sg-item-variables-и-sg-item)
			* [getForItem(evtOrElem)](#getforitemevtorelem)
* [Пример использования](#пример-использования)
* [Лицензия](#лицензия)

# SGModel

SGModel - Легковесная библиотека-класс для структурирования веб-приложений с помощью биндинг-моделей. Это упрощенный аналог Backbone.js! Библиотека хорошо адаптирована для наследования классов. Может использоваться как в браузере, так и на Node.js.

## Основные статические свойства SGModel

### static typeProperties = {...}

Описание типов свойств. Пример кода:

```js
class PlayerBase extends SGModel {

	static typeProperties = Object.assign({
		position: SGModel.TYPE_OBJECT_NUMBERS,
		rotate: SGModel.TYPE_NUMBER
	}, SGModel.typeProperties);
	
	//...
}

class Tank extends PlayerBase {
	
	static typeProperties = Object.assign({
		armor: SGModel.TYPE_NUMBER,
		ammunition1: SGModel.TYPE_NUMBER,
		ammunition2: SGModel.TYPE_NUMBER,
		ammunition3: SGModel.TYPE_NUMBER
	}, PlayerBase.typeProperties);
	
	//...
}
```

#### Поддерживаемые типы свойств:

- `SGModel.TYPE_ANY` - тип свойства по умолчанию
- `SGModel.TYPE_NUMBER` - при установке `null` или пустой строки (`""`) сохраняется значение `null` (как в СУБД)
- `SGModel.TYPE_STRING`
- `SGModel.TYPE_BOOLEAN`
- `SGModel.TYPE_FUNCTION`
- `SGModel.TYPE_XY` - либо число, например, 1234.5, либо объект, например: {x: 1234.5, y: 1234.5}. Этот тип удобен для работы с графическими движками
- `SGModel.TYPE_OBJECT` - при изменении хотя бы одного свойства объекта выполняются колбэки заданные методом `.on()`
- `SGModel.TYPE_ARRAY` - при изменении хотя бы одного элемента массива выполняются колбэки заданные методом `.on()`
- `SGModel.TYPE_ARRAY_NUMBERS` - то же что и `SGModel.TYPE_ARRAY`, но значения приводятся к числовому типу
- `SGModel.TYPE_OBJECT_NUMBERS` - то же что и `SGModel.TYPE_OBJECT`, но значения приводятся к числовому типу
- `SGModel.TYPE_SET`
- `SGModel.TYPE_MAP`

(!) При проверке изменения значения везде применяется строгая проверка (===).
(!) При получении `undefined` (или то же что и `void 0`) свойство удаляется (`delete this._data[propName]`)

### static defaultsProperties = {...}

Один из способов задания перечня свойств и их значений по умолчанию при создании экземпляра. Другой способ - использовать метод `defaults()` экземпляра, см. ниже.

Пример кода:

```js
class PlayerBase extends SGModel {

	//...

	static defaultProperties = {
		position: {x: 0, y: 0},
		rotate: 0
	}
	
	//...
}

class Tank extends PlayerBase {

	//...

	defaults() {
		return SGModel.defaults({
			armor: 1000,
			ammunition1: 20,
			ammunition2: 20,
			ammunition3: 5
		}, PlayerBase.defaultProperties);
	}
	
	//...
}
```

### static options = {...}

Пользовательские настройки. Если заданы, то в при создании экземпляра эти настройки объединяются с настройками options, которые передаются в конструкторе, в this.options.

### static localStorageKey = ""

Если задано не пустое строковое значение, то данные синхронизируются с локальным хранилищем.
Поддержка хранения данных как одного экземпляра класса (single instance), так и нескольких экземпляров: `localStorageKey+"_"+uuid`

### static storageProperties = []

Если задан перечень названий свойств, то при выполнении save() записываются только эти свойства! Также эти свойства возвращаются методом [this.getData()](#getdatabdeleteempties--false)

### static autoSave = false

Если true, то изменения при выполнении set(...) сразу сохраняются в постоянном хранилище (обычно в localStorage)

## Свойства и методы экземпляра SGModel

### constructor(properties = {}, options = void 0, thisProperties = void 0)

* `properties` - свойства
* `options` - пользовательские настройки
* `thisProperties` - свойства и методы передающиеся в контекст this созданного экземпляра

### UUID и uid

* `this.uuid` - уникальный идентификатор экземпляра. Генерируется автоматически при создании экземпляра, если не был передан вручную в `this.defaults()` (или `static defaultProperties`) или в конструкторе в properties. Значение UUID используется в составе имени ключа для получения сохраненных данных инстанса из локального хранилища (задан `static localStorageKey`).
* `this.__uid` - (@protected) порядковый сквозной (в разрезе всех классов-потомков унаследованных от SGModel) числовой номер экземпляра. Генерируется автоматически при создании экземпляра.

### data

Объект для доступа к свойствам. При изменении значений свойств выполняются ранее назначенные колбэки. Если свойства не существует, то выбрасывается ошибка.

```js
const model = new SGModel({ title: '' });
model.data.title = 'Title 1';
```

### initialization = {...}

Объект с промисом инициализации: `this.initialization = { promise, resolve, reject };`. Создаётся автоматически при создании инстанса.

### initialized = false

Статус инициализации инстанса. Присваивается в `true`, когда `this.initialization.promise` выполняется успешно.

### async initialize()

Вызывается сразу после создания экземпляра. Переопределяется в классах потомках.
Обычно ничего не возвращает, но можно вернуть boolean-значение, причём как в промисе (`async initialize() {...}`), так и без него (`initialize() {...}`), тогда это переопределит присваивание `this.initialized` в конструкторе, откуда вызывается метод. По умолчанию, если выбросов ошибок не было, `this.initialized` присваивается в `true`.

### changed = false

Если какое-то свойство было изменено, то устанавливается в true. Сбрасывается вручную (в false).

### destroyed = false

Если true, значит экземпляр прошёл процедуру уничтожения destroy()

### defaults()

Один из способов задания перечня свойств и их значений по умолчанию при создании экземпляра.
Этот вариант предпочтителен, когда нужно обратиться к статическим свойствам и методам класса.
Другой способ - использовать `static defaultsProperties = {...}`, см. выше.

### set(name, value, options = void 0, flags = 0, event = void 0, elem = void 0)

Задать значение свойства.

* `name`
* `val`
* `options`
	* `previous_value` - Если задано, то используется в качестве предыдущего значения
	* `format` - Функция для форматирования элементов коллекции ((item, index)=>{...}). Например, если элемент - это массив ['url', 'title'] и его можно нужно преобразовать в объект { url: 'url', title: 'title' } для вывода во вьюхе с циклом sg-for
* `flags`	- допустимые флаги:
	* `SGModel.FLAG_OFF_MAY_BE` - если при .set() могут быть .off() то нужно передать этот флаг
	* `SGModel.FLAG_PREV_VALUE_CLONE` - передавать предыдущее значение (делается тяжёлый clone)
	* `SGModel.FLAG_NO_CALLBACKS` - если задано, то колбэки не выполняются
	* `SGModel.FLAG_FORCE_CALLBACKS` - выполнить колбеки даже если нет изменений
	* `SGModel.FLAG_IGNORE_OWN_SETTER` - игнорировать собственные сеттеры (выполняется стандартный)
* `event` - событие элемента
* `elem` - DOM-элемент вызвавший событие

Возвращает true если свойство было изменено.

### get(name)

Получить значение свойства

### addTo(), removeFrom(), clearProperty(), size()

Методы для работы со свойстами типа массив, объект, Set, Map:

* addTo(name, value, key = void 0, options = void 0, flags = 0)
* removeFrom(name, keyOrValue, options = void 0, flags = 0)
* clearProperty(name, options = void 0, flags = 0) // Очищает сложные типы, но при этом сохраняя их (указатель на объект тот же!)
* size(name) // Для объекта подсчитает кол-во его собственных свойств

### on(name, func, context = void 0, data = void 0, flags = 0)

Задать колбэк на изменение свойства

* `name` - имя свойства или массив имён свойств
* `func` - колбэк
* `context` - если не задано, то передаётся "this" текущего объекта. Для массива имён можно передать массив контекстов
* `data` - если задано, то в колбэке вместо текущего значения (первый элемент в arguments[]) передаётся это значение (data). Для массива имён можно передать массив данных
* `flags` - допустимые флаги:
	* `SGModel.FLAG_IMMEDIATELY` - func выполнится сразу

Пример выполнении колбэка и список параметров:

```js
this.on(
	["field1", "field2", "field3", "field4"], // один колбэк для нескольких полей
	(newValue, oldValue, name)=>{ // name - имя поля, значение которого изменилось
		//...
	}
);

```

### off(name, func)

Удалить колбэки из списка подписчиков на изменение свойства. Если задан func, то из списка удаляется конкретный колбэк

* `name` - имя свойства или массив имён свойств
* `func` - колбэк

### trigger(name, value = void 0, flags = 0)

Выполнить колбэки, которые выполняются при изменении значения свойства, либо сгенерировать событие

* `name` - имя свойства или имя события
* `value` - параметр события
* `flags` - допустимые флаги:
	* `SGModel.FLAG_OFF_MAY_BE` - если при .set() могут быть .off() то нужно передать этот флаг

### clearToDefaults()

Очищает значения всех свойств, задавая им деволтные (первоначальные) значения.

### clear()

Очищает значения всех свойств, задавая им "нулевые" значения согласно типу данных. Сложные объекты очищаются, например, у массива остаётся 0 элементов.

### save()

Сохраняет данные (из this.data) в локальное хранилище localStorage.
Если `storageProperties` не задан, то свойства, начинающиеся с символа "_" не записывается в хранилище.
Если `storageProperties` задан, то в хранилище записываются только те свойства, которые указаны в массиве `storageProperties`.

### getData(bDeleteEmpties = false)

Получить объект с properties и значениями. Используется либо данные `storageProperties`, либо берутся свойства без начального символа "_". Флаг `bDeleteEmpties` определяет - будут ли в возвращаемом объекте свойства со значениями `null` и `undefined`.

### toJSON()

Подготовить инстанс для преобразования в текстовое json-представление. Статические свойства класса инстанса запишутся в свойство-объект __class. Функция `this.toJSON()` также используется при некоторых вызовах стандартных функций, например: `JSON.stringify(instance1)`.

### destroy()

Очищает список колбэков и присваивает `destroyed = true`

## Поддержка Singleton паттерна в наследуемых классах

### static singleInstance = false

Если true, то возможен только один действующий экземпляр класса.

Пример кода:

```js
class Application extends SGModel {
	
	static singleInstance = true;
	static localStorageKey = "app_options";
	
	static APP_STATE1 = 0;
	static APP_STATE2 = 0;
	//...
	
	constructor(...args) {
		super(...args);
		window.MyApp = this;
		
		//...
	}
	
	defaults() {
		return {
			state: Application.APP_STATE1
		};
	}
	
	initialize() {
		//...
	}
}

new Application();
```

### static getOrCreateInstance()

Получить указатель на одиночный экземляр класса. Если экземпляр ещё не существует, то он будет создан.

### Статические методы для работы с данными

Проекции на методы singleton-экземпляра get, set, addto, removefrom, clear, size, on, off и save.

### static data

Ссылка на объект со свойствами singleton-экземпляра


## Утилиты используемые в SGModel

### static defaults(dest, ...sources)

Если какого-то свойства в dest не оказалось, то оно при наличии берётся из объектов sources

### static clone(source)

Полное клонирование объекта с вложенными массивами и объектами (используется рекурсия)

### static initObjectByObject(dest, source)

Заполнить значения объекта/массива dest значениями из объекта/массива source (с рекурсией)

### static upperFirstLetter(s)

Сделать первый символ прописным

### static roundTo(value, precision = 0)

Округление числа до заданной точности

### static parsePgStrArray(line)

Преобразование из текстового представления массива PostgreSQL в массив объектов

# MVVM-паттерн в SGModelView

**SGModelView** - Микрофрейморк для создания MVVM-приложений, основанный на **SGModel**. Поддерживает использование TEMPLATE-шаблонов для singleton-инстансов и multi-инстансов в циклах sg-for.

## Статические свойства экземпляра SGModelView

### static enablePrintingUUIDClass = true

Включить вывод в атрибутах корневого DOM-элемента представления UUID инстанса и имя класса модели.

### static templates = {...}

Шаблоны для вставки блоков HTML-кода (ассоциативный массив с элементами HTMLTemplateElement и DocumentFragment). Может быть сформирован автоматически в зависимости от параметров в `static autoLoadBind = {...}` (см. ниже).

### static autoLoadBind = {...}

Параметры автоматической загрузки шаблона, генерации на его основе контента и биндинга данных.

- `[autoLoadBind.srcHTML = void 0]` {mixed} - может быть строкой (HTML-код, URL) или объектом (HTMLElement/HTMLTemplateElement);
- `[autoLoadBind.templateId = void 0]` {string} - код основного шаблона (обычно это значение id в теге template), который сразу клонируется в document;
- `[autoLoadBind.viewId = void 0]` {string} - id контейнера, куда клонируется основной шаблон;
- `[constructor.templates = {}]` {object} - ассоциативный массив распознанных шаблонов.

Значение `autoLoadBind.srcHTML` может быть следующего типа:

- `string` распознается как HTML-код - код размещается во временный HTMLTemplateElement;
- `string` распознается как URL - выполняется асинхронная загрузка HTML-кода во временный HTMLTemplateElement;
- `object` является инстансом на основе `HTMLElement` - сразу переходим на следующий этап.

Все найденные внутри шаблоны (поиск по тегу TEMPLATE) переносятся в ассоциативный массив `constructor.templates = {...}`, где ключом выступает id шаблона (id в теге TEMPLATE), либо текущей индекс (начинается с 0) если id не установлен, либо UUID для HTML-контента вне тегов TEMPLATE (доступ по ключу: `constructor.templates[this.uuid]`). Если `autoLoadBind.templateId` не задан, то при наличии шаблона по умолчанию в `autoLoadBind.templateId` присваивается id шаблона по умолчанию. Далее, для singleton-представления и заданном `autoLoadBind.viewId` или при работе с несколькими экземплярами представления и переданным в конструкторе `options.viewId`, шаблон клонируется в документ и выполняется биндинг данных с контролами.При создании нескольких экземпляров контент каждой записи размещается в теге `SECTION`. Если в html-коде есть стили (STYLE) и скрипты (SCRIPT) на первом уровне вложенности, то они просто добавляются в BODY документа (body.append).

Пример кода для singleton-вьюхи (единственного инстанса представления):

```html
<template id="tmp_filters">
	<div>
		<div>Компания:</div><div><input type="text" sg-property="orgs"/></div>
		<div>Проект:</div><div><input type="text" sg-property="project"/></div>
		<div>Задача:</div><div><input type="text" sg-property="task"/></div>
	</div>
</template>
```

```js
export default class MyViewForm extends SGModelView {
	static singleInstance = true; // default: false
	static autoLoadBind = {
		srcHTML: 'templates/filters.html',
		templateId: '#tmp_filters', // Символ '#' при наличии отбрасывается
		viewId: '#filters_cnt', // Можно любой CSS-селектор, возвращающий один элемент, например: 'body > div.my-class1 main'
	};
	//...
	async initialize() {
		//...
	}
}
```

Пример кода с многократным использованием вьюхи (несколько однотипных инстансов представления):

```html
<template id="tmp_record">
	<div>
		<div>Код:</div>
		<div sg-property="code"></div>
	</div>
	<div>
		<div>Описание:</div>
		<div><textarea sg-property="description"></textarea></div>
	</div>
</template>
```

```js
export default class MyRecords extends SGModelView {
	static multipleInstances = true; // default: true
	static autoLoadBind = {
		srcHTML: 'templates/records.html',
		containerId: '#records_cnt', // Контейнер, в котором будут добавляться однотипные вьюхи каждой записи
	};
	//...
	async initialize() {
		//...
	}
}
```

```js
for (let i = 0; i < 10; i++) {
	const record = new MyRecords();
}
```

### Способ инициализации вьюхи

Есть следующие способы инициализации вьюхи:

* const view = new CustomView(); ...; view.bindHTML('#my_view_id'); // Ручная инициализация и связывание с данными (без template-шаблонов)
* static autoLoadBind = { srcHTML }; ...; view.bindHTML('#my_view_id', true); // Ручная инициализация и связывание с данными (используется template-шаблон по умолчанию, который создаётся т.к. задан `srcHTML`)
* static autoLoadBind = { srcHTML }; ...; view.bindHTML('#my_view_id', 'tmp_filters'); // Ручная инициализация и связывание с данными (используется определённый template-шаблон, который создаётся т.к. задан `srcHTML`)
* static autoLoadBind = { srcHTML, templateId, containerId|viewId }; // Автоматическая загрузка контента вьюхи и связывание
* static autoLoadBind = { templateId, containerId|viewId }; // Автоматическая загрузка контента вьюхи и связывание, при этом template-шаблон уже должен существовать на странице (`srcHTML` не задан)
* new MyModeView(); <div sg-model="MyModeView">...<span>Content...</span>...</div> // Использование атрибута **sg-model** на корневом элементе вьюхи, контент непосредственно в корневом элементе вьюхи (например, всё одном html-файле)
* Атрибут **sg-model** на корневом элементе вьюхи, контент в отдельном html-файле в виде template-шаблона: class CustomView extends SGModeView { autoLoadBind = { srcHTML: './templates/my-template1.html' } }

## Свойства экземпляра SGModelView

Свойства экземпляра SGModelView помимо свойств экземпляра SGModel:

### this.$view

Корневой DOM-элемент вьюхи инстанса SGModelView.

## Методы экземпляра SGModelView

### bindHTML(root = void 0, mTemplate = void 0)

Ручное связвание данных (свойств в `this.data`) с HTML-документом (его частью, например, с формой) - теперь при изменении значений в HTML-элементах автоматически обновляются данные в экземпляре модели и наоборот.
Если одновременно заданы статические свойства `autoLoadBind.templateId` и (`autoLoadBind.viewId` || `autoLoadBind.$container` || `autoLoadBind.containerId`), то `bindHTML()` выполняется автоматически.
Параметр `mTemplate` позволяет сразу же вывести содержимое шаблона, загруженного, например, с указанием пути к шаблону (или сразу контента шаблона) `autoLoadBind.srcHTML`, но без других заданных директив в объекте `autoLoadBind`.

```js
initialize()
	...
	let promise = this.bindHTML("#my_form");
	...
	return promise;
}
```

### destroy(noRemoveDOM = false)

Удалить представление вместе с его элементами в DOM (по умолчанию). Если `noRemoveDOM` true, элементы в DOM не удаляются, но очищаются от днамически генерируемых sg-атрибутов (sg-uuid, sg-item), свойств (__sg, __sgModelUUID) и подписчиков на события change и input.
После выполнения метода `this.destroyed` инстанса будет `true`.

## Атрибуты в HTML-документе

### sg-model

Альтернативный вариант для Singleton-представлений вместо использования static autoLoadBind.viewId - прописать sg-model="MyModelView" в корневом элементе представления, причём содержимое представления может находится как сразу в текущем html-файле, так и в отдельном template-шаблоне.

### sg-property

Поддерживаются следующие HTML-элементы ввода данных (и типы):

- `INPUT` (text, range, checkbox, radio, date, time, datetime-local)
- `SELECT` и `OPTION` (select-one, select-multiple)
- `TEXTAREA`
- `BUTTON` (button)

Также `sg-property` можно указать на любом другом теге. В этом случае значение будет выводится через innerHTML. Ещё есть в чём-то схожий атрибут `sg-value` (см. ниже).

### sg-value

Для задания первоначального innerHTML элемента можно использовать атрибут `sg-value`. Также с помощью `sg-value` можно получить доступ к любым публичным статическим свойствам любого класса-потомка, унаследованного от SGModel или SGModelView!
В текущей версии фреймворка реализована только инициализация innerHTML. Пример HTML и Javascript-кода:

```html
<div sg-value="getSomeValue()">loading...</div> <!-- вызов метода без параметров -->
<div sg-value="getSomeValue('ggg')">loading...</div>
<div sg-value="getSomeValue('ggg', 'ggg2')">loading...</div>
<div sg-value="versionCore">loading...</div> <!-- обычное свойства в this.data (значение должно быть задано при инициализации, например, в static defaultProperties = {...}) -->
<div sg-value="MyForm.STAT_PROP_NAME1">loading...</div> <!-- статическое свойство текущего класса -->
<div sg-value="OtherCustomView.PROP_NAME5">loading...</div> <!-- статическое свойство другого класса -->
```

```js
class MyForm extends SGModelView {
	const STAT_PROP_NAME1 = 'value1'; // Можно вывести значение статического свойства
	getSomeValue(a = 'no_value_for_a', b = 'no_value_for_b') {
		return 'Some values: a=' + a + ', b=' + b;
	}
}
```

В целях упрощения работы парсера, значения параметров передаются в методы в HTML-шаблоне в одинарных кавычках (в том числе и для чисел) !

### sg-type, sg-option и sg-dropdown

Для реализации кастомных выпадающих списков выбора значения, реализованных, например, в Bootstrap, нужно задать атрибут `sg-type="dropdown"`. В контейнере-списке необходимо задать атрибут `aria-labelledby` со значением id основного контрола (кнопки). В каждом пункте списка должны быть заданы атрибуты `sg-option` и `sg-dropdown`. С учётом всего этого SGModelView автоматически будет обновлять текст основого контрола (кнопки) на содержимое выбранного пункта (копируется innerHTML).
Пример, html-кода:

```html
<label>Формат сотрудничества:</label>
<button id="contract" sg-property="contract" sg-type="dropdown" type="button" data-bs-toggle="dropdown">Трудовой договор</button>
<ul class="dropdown-menu dropdown-menu-pointer" aria-labelledby="contract">
	<li sg-option="1" sg-dropdown="contract">Трудовой договор</li>
	<li sg-option="2" sg-dropdown="contract">Самозанятый</li>
	<li sg-option="3" sg-dropdown="contract">Фриланс + Безопасная сделка</li>
	<li sg-option="4" sg-dropdown="contract">Договор услуг</li>
	<li sg-option="5" sg-dropdown="contract">Договор подряда</li>
	<li sg-option="6" sg-dropdown="contract">ИП</li>
</ul>
```

```js
class MyForm extends SGModelView {

	static defaultProperties = {
		contract: 1,
		...
	};
	
	...
	
	initialize()
		...
		return this.bindHTML("#my_form");
	}
}
```

### sg-options

Для элемента SELECT можно инициализировать список вариантов с помощью атрибута `sg-options`:

```html
<DIV id="my_form">
	<SELECT sg-options="myitems"></SELECT>
</DIV>
```

```js
class MyForm extends SGModelView {
	initialize()
		this.set('myitems', [ { value: 1001, title: "One", hint: "Description for one..." }, { value: 2002, title: "Two", hint: "Description for two..."} ]);
		return this.bindHTML("#my_form");
	}
}
```

### sg-css

Для динамического формирования списка css-классов элемента можно прописать javascript inline-условие прямо в атрибуте `sg-css` тега. Свойства и методы распознаются автоматически. Пример HTML-кода:

```html
<div>
	<span sg-property="hours" sg-css="hours > 4 ? 'text-danger' : 'text-success'" class="some-base-class1 some-base-class2">4</span>ч.
</div>
```

```js
class MyForm extends SGModelView {
	static defaultProperties = {
		hours: 8
	}
	/* or
	defaults() {
		return {
			hours: 8
		};
	}*/
	...
	someMethod() {
		this.set("hours", 4);
	}
}

```
или
```html
<div>
	<span sg-property="hours" sg-css="cssDangerOrSuccess" class="some-base-class1 some-base-class2">4</span>ч.
</div>
```

```js
class MyForm extends SGModelView {
	...
	cssDangerOrSuccess(property) {
		let value = this.get(property);
		if (value == 0) return ""; else return value < 0 ? "text-success" : "text-danger";
	}
}
```

При этом *some-base-class1* и *some-base-class2* не будут затронуты при вычислении списка css-классов!

Важно! Для ускорения работы используется упрощеный вариант парсера - все операторы должны быть разделены хотя бы одним пробелом!

### sg-format

Для форматирования значения можно использовать атрибут `sg-format` в значении которого имя функции обработчика. Пример HTML и Javascript-кода:

```html
<span sg-property="salary" sg-format="getNumThinsp">1&thinsp;000&thinsp;000</span>&thinsp;руб./год
```

```js
class MyForm extends SGModelView {
	...
	getNumThinsp(value) {
		return (''+value.toLocaleString()).replace(/\s/g, "&thinsp;");
	}
}
```

### sg-attributes

Для задания первоначальных значений атрибутов элемента можно использовать атрибут `sg-attributes`. В текущей версии реализована только инициализация атрибутов. Пример HTML и Javascript-кода:

```html
<span sg-property="task_code" sg-attributes="{ title: task_description }">...</span>
<img sg-attributes="{ src: getSomeSrcA(), title: getSomeTitleA() }"/>
<div sg-attributes="{ title: getSomeTitleB('ggg') }">Short text...</div>
<div sg-attributes="{ style: getSomeStyleC('256', 'value2') }">Description...</div>
```

```js
class MyForm extends SGModelView {
	...
	getSomeSrcA() {
		let src = 'https://site.ru/picture.png';
		//...
		return src;
	}
	getSomeTitleA() {
		return 'Some title';
	}
	getSomeTitleB(param1) {
		return this.get(param1);
	}
	getSomeTitleC(value1, value2) {
		value1 = +value1;
		//...
		return 'color: #f673c9; font-size: 15pt';
	}
}
```

В целях упрощения работы парсера, значения параметров передаются в методы в HTML-шаблоне в одинарных кавычках (в том числе и для чисел) !

### sg-click

Для назначения обработчика onclick можно использовать атрибут `sg-click` в значении которого имя функции обработчика. Пример HTML и Javascript-кода:

```html
<button type="button" sg-click="sendEmail">Отправить ссылку по e-mail...</button>
```

```js
class MyForm extends SGModelView {
	...
	sendEmail(event) {
		...
	}
}
```

### sg-for, sg-template, sg-item-variables и sg-item

На данный момент это простая реализация вывода коллекций, см. пример ниже.
Для каждого пункта (записи) коллекции автоматически формируется атрибут **sg-item**, значение которого состоит из уникального хеша + имя ключа записи (имя свойства объекта/ключа Map-коллекции или индекс элемента массива/множества Set).
Для простой коллекции, состоящей из примитивных элементов, например, текст или число, в представлении в простых атрибутах (не sg-*) или в текстовом узле используется ключевое слово `$value`, которое заменяется на примитивное значение.

Для коллекции, элементы которой - объекты, подстановка свойств объекта в sg-атрибуты выполняется как обычно (например: `sg-property="itemprop1"`), а в стандартные элементы - с добавлением префикса "$" (например: `href="$url"`). Есть специальные субсвойства: `$index` для коллекций-массивов (начинается с 1, 2, 3, ...) и `$key` для коллекций-объектов. Поддерживаются sg-атрибуты `sg-option` (для sg-dropdown списков), `sg-property`, `sg-value`, `sg-format` и `sg-css`.

В корневом теге списка можно задать статические и динамические переменные, используя атрибут **sg-item-variables**, например, заведём две переменные - $tagClass и $inputType:

```html
<h2>Выбранные проекты:</h2>
<div sg-for="selectedProjects"
			sg-template="tmp_filters_item_selected"
			sg-item-variables="{ $tagClass: 'text-bg-primary', $inputType: input_type }"
			sg-click="onClickSelectedItems">
</div>
<h2>Выбранные задачи:</h2>
<div sg-for="selectedTasks"
			sg-template="tmp_filters_item_selected"
			sg-item-variables="{ $tagClass: 'text-bg-secondary', $inputType: input_type }"
			sg-click="onClickSelectedItems">
</div>
<h2>Сотрудник:</h2>
<div sg-for="selectedEmployees"
			sg-template="tmp_filters_item_selected"
			sg-item-variables="{ $tagClass: 'text-bg-warning', $inputType: input_type }"
			sg-click="onClickSelectedItems">
</div>
```

В самом шаблоне переменные подставляются простой заменой, например, `$tagClass` в каждом атрибуте заменится на `text-bg-success`, а $inputType на текущее значение `this.data.input_name` (например, `radio` или `checkbox`):

```html
<template id="tmp_filters_item_selected">
	<span class="badge bg-gradient wob-tag $tagClass">
		<input type="$inputType" sg-property="checked"/><span sg-property="code" title="ИД=$id"></span><sup sg-property="reference" sg-css="cssRedOrGreenOrHide" sg-format="formatReference"></sup><button type="button" class="btn-close" title="Удалить тег"></button>
	</span>
</template>
```

#### getForItem(evtOrElem)

Вспомогательный метод для получения данных по кликнутой записи коллекции и других сопутствующих данных.

Возвращает объект со следующими данными:

* **key** - либо индекс элемента для массивов/Set-коллекции, либо имя свойства объекта или ключа элемента Map-коллекции
*	**value** - значение элемента коллекции. Для keyName='index' преобразуется к Number, для keyName='id' преобразуется к BigInt
*	**item** - запись коллекции (для массивов или Set-коллекции равно **value**)
*	**collection** - коллекция, в которой присутствует item
*	**property** - имя свойства в атрибуте sg-for
*	**type** - тип данных (SGModel.TYPE_ARRAY|SGModel.TYPE_ARRAY_NUMBERS|SGModel.TYPE_OBJECT|SGModel.TYPE_OBJECT_NUMBERS|SGModel.TYPE_SET|SGModel.TYPE_MAP)	
*	**keyName** - имя ключа (м.б. id, uuid, code, hash или index)
*	**$item** - корневой DOM-элемент записи
*	**$control** - DOM-элемент, на который нажал пользователь, например, BUTTON
*	**hash** - хэш записи (ключа)

Пример:

```html
<div sg-model="GroupInfo">
	<div>Имя группы пользователей: <span sg-property="name"></span></div>
	<div sg-for="users" sg-template="tmp_user" sg-click="onClickUsers">
		<span><span>$value</span> <button>X</button></span>
	</div>
</div>
<script>
	var groupInfo = new GroupInfo({
		name: "Группа 1",
		users: ['Юзер 1', 'Юзер 2', 'Юзер 3']
	});
</script>
```

```js
export default class GroupInfo extends SGModelView {
	static defaultProperties = {
		name: '',
		users: []
	};
	onClickUsers(evt) {
		const { eControl, eItem, key, item: value, collection } = this.getForItem(evt);
		if (key && eControl.tagName === 'BUTTON') {
			this.removeFrom('users', value);
		}
	}
}
```

# Пример использования

HTML-код основной страницы index.html (пример):

```html
<!DOCTYPE html>
<html>
	<head>
		<title>Test SGModelView</title>
		<script type="module" charset="utf-8" src="index.js" defer></script>
	</head>
	<body>
		<div id="filters_panel_cnt"></div>
	</body>
</html>
```

HTML-код панели фильтров и повторяющего блока filters_panel.html (пример):

```html
<template id="tmp_filters_panel">
	<h1>Фильтрация</h1>
	<h2>Список проектов</h2>
	<div sg-css="selectedProjects ? '' : 'filter-off'">
		<div class="form-check form-switch">
			<input type="checkbox" id="flt_selected_projects" sg-property="selectedProjects">
			<label for="flt_selected_projects">Проекты:</label>
		</div>
		<div sg-for="projects" sg-template="tmp_filters_item_selected" sg-click="onClickProjects"></div>
	</div>
	<hr/>
	<h2>Список задач</h2>
	<div sg-css="selectedTasks ? '' : 'filter-off'">
		<div class="form-check form-switch">
			<input type="checkbox" id="flt_selected_tasks" sg-property="selectedTasks">
			<label for="flt_selected_tasks">Проекты:</label>
		</div>
		<div sg-for="tasks" sg-template="tmp_filters_item_selected" sg-click="onClickTasks"></div>
	</div>
	<hr/>
	<h2>Ключевые слова</h2>
	<div sg-css="selectedKeywords ? '' : 'filter-off'">
		<div class="form-check form-switch">
			<input type="checkbox" id="flt_selected_keywords" sg-property="selectedKeywords">
			<label for="flt_selected_keywords">Ключевые слова:</label>
		</div>
		<div>
			<input type="text" sg-property="keywords"/>
		</div>
	</div>
	<hr/>
	<button sg-click="applyFilters">Применить</button>
</template>

<template id="tmp_filters_item_selected">
	<span><span>$value</span><button type="button">X</button></span>
</template>
```

Javascript-код index.js (пример):

```js
import FiltersPanel from './filters.js';
const fltPanel = new FiltersPanel({
	projects: ['PROJECT_A', 'PROJECT_B', 'PROJECT_C'],
	tasks: ['PRA-123', 'PRC-310', 'PRC-311', 'PRC-488'],
});
```

Javascript-код filters.js (пример):

```js
import SGModelView from 'https://model.sg2d.ru/src/sg-model-view.js';

export default class FiltersPanel extends SGModelView {
	static singleInstance = true; // говорим, что у нас будет единственный инстанс, следовательно в localStorage имя ключа не будет записываться с UUID
	static localStorageKey = 'filters_panel'; // Имя ключа в localStorage
	static autoSave = true;	// Автоматически сохранять значения свойств модели в хранилище localStorage
	static autoLoadBind = { // При создании инстанса сразу же выполнить загрузку HTML-кода, клонирование HTML-кода в document и связать контролы с данными
		srcHTML: 'filters_panel.html',
		templateId: 'tmp_filters_panel',
		viewId: '#filters_panel_cnt',
	};
	static defaultProperties = {
		selectedProjects: false,
		selectedTasks: false,
		selectedKeywords: false,
		projects: [],
		tasks: [],
		keywords: '',
	};
	static typeProperties = {
		selectedOrgs: SGModel.TYPE_BOOLEAN,
		selectedTasks: SGModel.TYPE_BOOLEAN,
		selectedKeywords: SGModel.TYPE_BOOLEAN,
		projects: SGModel.TYPE_ARRAY,
		tasks: SGModel.TYPE_ARRAY,
		keywords: SGModel.TYPE_STRING,
	};
	async initialize() {
		//...
	}
	onClickProject() {
		//...
	}
	onClickTasks() {
		//...
	}
	applyFilters() {
		//...
	}
}
```

# Лицензия

**SGModel и SGModelView распространяются под [MIT License](http://opensource.org/licenses/MIT)**

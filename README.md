# SGModel & SGModelView

Ссылка на GitHub-страницу: [https://github.com/VediX/model.sg2d.github.io](https://github.com/VediX/model.sg2d.github.io)

*SGModel* - Быстрая легковесная библиотека-класс для структурирования веб-приложений с помощью биндинг-моделей и пользовательских событий. Это более быстрый и упрощенный аналог Backbone.js! Библиотека хорошо адаптирована для наследования классов (ES6).

*SGModelView* - надстройка над SGModel позволяющая связать данные в JavaScript с визуальными элементами HTML-документа, используя *MVVM-паттерн*. Это очень упрощенный аналог KnockoutJS или VueJS.

Пример использования: [Перейти на страницу примера](/example/)

## Оглавление

[Основные статические свойства SGModel](#%D0%BE%D1%81%D0%BD%D0%BE%D0%B2%D0%BD%D1%8B%D0%B5-%D1%81%D1%82%D0%B0%D1%82%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B5-%D1%81%D0%B2%D0%BE%D0%B9%D1%81%D1%82%D0%B2%D0%B0-sgmodel)

[Свойства и методы экземпляра](#%D1%81%D0%B2%D0%BE%D0%B9%D1%81%D1%82%D0%B2%D0%B0-%D0%B8-%D0%BC%D0%B5%D1%82%D0%BE%D0%B4%D1%8B-%D1%8D%D0%BA%D0%B7%D0%B5%D0%BC%D0%BF%D0%BB%D1%8F%D1%80%D0%B0)

[Собственные сеттеры](#%D1%81%D0%BE%D0%B1%D1%81%D1%82%D0%B2%D0%B5%D0%BD%D0%BD%D1%8B%D0%B5-%D1%81%D0%B5%D1%82%D1%82%D0%B5%D1%80%D1%8B)

[Поддержка Singleton паттерна](#%D0%BF%D0%BE%D0%B4%D0%B4%D0%B5%D1%80%D0%B6%D0%BA%D0%B0-singleton-%D0%BF%D0%B0%D1%82%D1%82%D0%B5%D1%80%D0%BD%D0%B0)

[Утилиты, используемые в SGModel](#%D1%83%D1%82%D0%B8%D0%BB%D0%B8%D1%82%D1%8B-%D0%B8%D1%81%D0%BF%D0%BE%D0%BB%D1%8C%D0%B7%D1%83%D0%B5%D0%BC%D1%8B%D0%B5-%D0%B2-sgmodel)

[SGModelView](#sgmodelview)

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

#### Поддерживаемые типы свойств

- `SGModel.TYPE_ANY` - тип свойства по умолчанию
- `SGModel.TYPE_NUMBER`
- `SGModel.TYPE_STRING`
- `SGModel.TYPE_BOOLEAN`
- `SGModel.TYPE_OBJECT` - при изменении хотя бы одного свойства объекта выполняются колбэки заданные методом .on()
- `SGModel.TYPE_ARRAY` - при изменении хотя бы одного элемента массива выполняются колбэки заданные методом .on()
- `SGModel.TYPE_ARRAY_NUMBERS` - то же что и SGModel.TYPE_ARRAY, но значения приводятся к числовому типу
- `SGModel.TYPE_OBJECT_NUMBERS` - то же что и SGModel.TYPE_OBJECT, но значения приводятся к числовому типу
- `SGModel.TYPE_NUMBER_OR_XY` - либо число, например, 1234.5, либо объект, например: {x: 1234.5, y: 1234.5}. Этот тип удобен для работы с графическими движками

(!) При проверке изменения значения везде применяется строгая проверка (===).

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

### static localStorageKey = ""

Если задано не пустое строковое значение, то данные синхронизируются с локальным хранилищем.
Поддержка хранения данных как одного экземпляра класса (single instance), так и нескольких экземпляров: `localStorageKey+"_"+id`

### static localStorageProperties = []

Если задан перечень названий свойст, то при выполнении save() записываются только эти свойства!

## Свойства и методы экземпляра

### id

Уникальный числовой идентификатор экземпляра. Генерируется автоматически при создании экземпляра, если не был передан вручную.

Если при создании экземпляра нужно заполнить его данными из локального хранилища localStorage (синхронизировать), то id необходимо указать заранее при вызове конструктора (в props). Также в этом случае необходимо задать `localStorageKey`.

### changed = false

Если какое-то свойство было изменено, то устанавливается в true. Сбрасывается вручную (в false).

### destroyed = false

Если true, значит экземпляр прошёл процедуру уничтожения destroy()

### constructor(props, thisProps, options)

* props - свойства
* thisProps - свойства и методы передающиеся в контекст this созданного экземпляра
* options - пользовательские настройки

### defaults()

Один из способов задания перечня свойств и их значений по умолчанию при создании экземпляра.
Этот вариант предпочтителен, когда нужно обратиться к статическим свойствам и методам класса.
Другой способ - использовать `static defaultsProperties = {...}`, см. выше.

### initialize(properties, thisProps, options) {} // override

Вызывается сразу после создании экземпляра. Переопределяется в классах потомках

### set(name, value, flags = 0, options = void 0)

Задать значение свойства

* name
* val
* flags	- допустимые флаги:
	* `SGModel.FLAG_OFF_MAY_BE` - если при .set() могут быть .off() то нужно передать этот флаг
	* `SGModel.FLAG_PREV_VALUE_CLONE` - передавать предыдущее значение (делается тяжёлый clone)
	* `SGModel.FLAG_NO_CALLBACKS` - если задано, то колбэки не выполняются
	* `SGModel.FLAG_FORCE_CALLBACKS` - выполнить колбеки даже если нет изменений
	* `SGModel.FLAG_IGNORE_OWN_SETTER` - игнорировать собственные сеттеры (выполняется стандартный)
* options
	* precision - Точность округления чисел
	* previous_value - Если задано, то используется в качестве предыдущего значения

Возвращает true если свойство было изменено.

### get(name)

Получить значение свойства

### on(name, func, context, data, flags = 0)

Задать колбэк на изменение свойства

* name - имя свойства или массив имён свойств
* func - колбэк
* context - если не задано, то передаётся "this" текущего объекта. Для массива имён можно передать массив контекстов
* data	- если задано, то в колбэке в первом arguments[] передаётся это значение (data). Для массива имён можно передать массив данных
* flags - допустимые флаги:
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

* name - имя свойства или массив имён свойств
* func - колбэк

### trigger(name, flags = 0)

Выполнить колбэки, которые выполняются при изменении значения свойства

* name - имя свойства
* flags - допустимые флаги:
	* `SGModel.FLAG_OFF_MAY_BE` - если при .set() могут быть .off() то нужно передать этот флаг

### save()

Сохраняет данные в локальное хранилище localStorage.
Если localStorageProperties не задан, то свойства, начинающиеся с символа "_" не записывается в хранилище.
Если localStorageProperties задан, то в хранилище записываются только те свойства, которые указаны в массиве localStorageProperties.

### destroy()

Очищает список колбэков и присваивает `destroyed = true`

## Собственные сеттеры

Предпочтительнее .on() по скорости работы при большом количестве экземпляров класса.
Также используются, если есть базовый класс и класс потомок, где нужно специфическое поведение при изменении свойств.

### static ownSetters = {...}

Список свойств для которых вначале использовать собственные сеттеры. Пример кода см. ниже.

Пример кода:

```js

class PlayerBase extends SGModel {

	static typeProperties = {
		state: PlayerBase.TYPE_NUMBER
	};
	
	static defaultsProperties = {
		state: 0
	};
	
	//...
}

class Tank extends PlayerBase {

	static typeProperties = Object.assign({
		state_index: PlayerBase.TYPE_NUMBER
	}, PlayerBase.typeProperties);
	
	defaults() {
		return SGModel.defaults({
			state_index: 0
		}, PlayerBase.defaultProperties);
	}
 
	// В Tank указываем собственный сеттер для работы со свойством state
	static ownSetters = Object.assign({
		state: true
	}, PlayerBase.ownSetters);
	
	setState(value, flags = 0, options) {
		if (this.set("state", value, flags | SGModel.FLAG_IGNORE_OWN_SETTER, options)) {
			this.set("state_index", 0);
		}
	}
}
```

## Поддержка Singleton паттерна

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
	
	initialize(properties, thisProps, options) {
		//...
	}
}

new Application();
```

### static getInstance(bIgnoreEmpty=false)

Получить указатель на одиночный экземляр класса. Если bIgnoreEmpty = true, то при пустом экземпляре Singleton ошибка игнорируется и возвращается null.

### static get(...)

Проекция на метод get экземпляра

### static set(...)

Проекция на метод set экземпляра

### static on(...)

Проекция на метод on экземпляра

### static off(...)

Проекция на метод off экземпляра

### static save(...)

Проекция на метод save экземпляра

### static getProperties()

Возвращает объект со свойствами действующего экземпляра класса


## Утилиты, используемые в SGModel

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

# SGModelView

SGModelView - надстройка над SGModel позволяющая связать данные в JavaScript с визуальными элементами HTML-документа, используя MVVM-паттерн. Это очень упрощенный аналог KnockoutJS или VueJS.

## bindHTML(root=void 0)

Связать модель данных (экземпляр класса SGModel->SGModelView) с HTML-документом (его частью, например, с формой). При изменении значений в HTML-элементах автоматически обновляются данные в экземпляре модели и наоборот.

```js
initialize()
	...
	this.bindHTML("#my_form");
	...
}
```

## Атрибуты в HTML-документе

### sg-property

Поддерживаются следующие HTML-элементы ввода данных (и типы):

- INPUT (text, range, checkbox, radio)
- SELECT и OPTION (select-one, select-multiple)
- BUTTON (button)

Также sg-property можно указать на любом другом теге. В этом случае значение будет выводится через innerHTML.

### Атрибуты sg-type, sg-value и sg-dropdown

Для реализации кастомных выпадающих списков выбора значения, реализованных, например, в Bootstrap, нужно задать атрибут sg-type="dropdown". Пример, html-кода:

```html
	<label>Формат сотрудничества:</label>
	<button sg-property="contract" sg-type="dropdown" type="button">Трудовой договор</button>
	<ul class="dropdown-menu dropdown-menu-pointer" aria-labelledby="contract">
		<li sg-value="1" sg-dropdown="contract">Трудовой договор</li>
		<li sg-value="2" sg-dropdown="contract">Самозанятый</li>
		<li sg-value="3" sg-dropdown="contract">Фриланс + Безопасная сделка</li>
		<li sg-value="4" sg-dropdown="contract">Договор услуг</li>
		<li sg-value="5" sg-dropdown="contract">Договор подряда</li>
		<li sg-value="6" sg-dropdown="contract">ИП</li>
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
		this.bindHTML("#my_form");
		...
	}
}
```

### sg-format

Для форматирования значения можно использовать атрибут sg-format в значении которого имя функции обработчика. Пример HTML-кода:

```html
<span sg-property="salary" sg-format="getNumThinsp">1&thinsp;000&thinsp;000</span>&thinsp;руб./год
```

```js
class MyForm extends SGModelView {
	...
	
	getNumThinsp(value) {
		return (''+value.toLocaleString()).replace(/\s/, "&thinsp;");
	}
}
```
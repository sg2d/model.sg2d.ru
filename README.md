# SGModel

Быстрая легковесная библиотека-класс (ES6) для структурирования веб-приложений с помощью биндинг-моделей и пользовательских событий. Это более быстрый и упрощенный аналог Backbone.js!

## Простой пример использования

### Файл ./index.js

```js
"use strict";

import Tile from './tile.js';

let tile1 = new Tile({ position: {x: 10, y: 20}, angle: 180 });

tile1.on("position", (position)=>{
	if (position.x < 0) position.x = 0;
	if (position.y < 0) position.y = 0;
	if (position.x > 100) position.x = 100;
	if (position.y > 100) position.y = 100;
});

tile1.set("angle", 365);

console.log("angle=" + tile1.properties.angle); // "angle=5"

tile1.set("position", {x: 10, y: 110});

console.log("position=(" + tile1.properties.position.x + "," + tile1.properties.position.y + ")"); // "position=(10,100)"

```

### Файл ./tile.js

```js
"use strict";

import SGModel from './libs/sg-model.js';

export default class Tile extends SGModel {

	// Описываем типы данных свойств (не обязательно)
	static typeProperties = { // overriden with Object.assign(...)
		position: SGModel.TYPE_OBJECT_NUMBERS,
		angle: SGModel.TYPE_NUMBER
	};
	
	defaults() {
		return {
			position: {x: 0, y: 0},
			angle: 0
		};
	}
	
	initialize(properties, thisProps, options) {
	
		this.on("angle", (angle, angle_prev)=>{
			if (angle < 0) angle = angle + 360;
			if (angle > 360) angle = angle - 360;
			return angle;
		});
	}
	
	destroy() {
		//...
		super.destroy();
	}
}
```

## Статические свойства и методы SGModel

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
		ammunition1: SGModel.TYPE_NUMBER
		ammunition2: SGModel.TYPE_NUMBER
		ammunition3: SGModel.TYPE_NUMBER
	}, PlayerBase.typeProperties);
	
	//...
}
```

#### Поддерживаемые типы свойств

- SGModel.TYPE_NUMBER
- SGModel.TYPE_STRING
- SGModel.TYPE_BOOL
- SGModel.TYPE_OBJECT - при изменении хотя бы одного свойства объекта выполняются колбэки заданные методом .on().
- SGModel.TYPE_ARRAY_NUMBERS - при изменении хотя бы одного элемента массива выполняются колбэки заданные методом .on().
- SGModel.TYPE_OBJECT_NUMBERS - то же что и SGModel.TYPE_OBJECT, но значения в начале приводятся к числовому типу.

(!) При проверке изменения значения везде применяется строгая проверка (===).

### static defaultsProperties = {...}

Перечень свойств и их значений по умолчанию при создании экземпляра.

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

### static ownSetters = {...}

Список свойств для которых вначале использовать собственные сеттеры.
Пример кода см. в описании метода `setWoOwnSetter`

#### Флаг SGModel.IGNORE_OWN_SETTER = true

Флаг передаваемый в вызове .set(...), что бы не был вызван пользовательский сеттер.
Пример кода см. в описании метода `setWoOwnSetter`

## Свойства и методы экземпляра

### id

Уникальный числовой идентификатор экземпляра. Генерируется автоматически при создании экземпляра, если не был передан вручную.

Если при создании экземпляра нужно заполнить его данными из локального хранилища localStorage (синхронизировать), то id необходимо указать заранее при вызове конструктора (в props). Также в этом случае необходимо задать `localStorageKey`.

### constructor(props, thisProps, options)

* props - свойства
* thisProps - свойства и методы передающиеся в контекст this созданного экземпляра
* options - пользовательские настройки

### initialize(properties, thisProps, options) {} // override

Вызывается сразу после создании экземпляра. Переопределяется в классах потомках

### set(name, val, options, ignoreOwnSetter = false)

Задать значение свойства

* name
* val
* options	- допустимые флаги:
	* off_may_be - если при set могут быть off то нужно передать этот флаг
	* prev_value_clone - передавать пред.значение (делается тяжёлый clone)
	* prev_value - использовать это значение в качестве пред.значения
	* no_triggers - если задано, то колбэки не выполняются
* ignoreOwnSetter=false

Возвращает true если свойство было изменено.

### setWoOwnSetter(name, value, options)

Задать значение без использования own-setter'а, если он задан. При value === void 0 всегда возвращает true
Используется в связке со статическим свойством `ownSetters` в котором перечисляются поля, для которых сначала выполняется пользовательский setter

Пример кода:

```js
 class Tank extends PlayerBase {
 
	static typeProperties = Object.assign({
		state: PlayerBase.TYPE_NUMBER,
		state_index: PlayerBase.TYPE_NUMBER
	}, PlayerBase.typeProperties);
	
	defaults() {
		return PlayerBase.defaults({
			state: 0,
			state_index: 0
		}, PlayerBase.defaultProperties);
	}
	
	static ownSetters = Object.assign({
		state: true
	}, PlayerBase.ownSetters);
	
	//...
	
	setState(value, options) {
		if (this.setWoOwnSetter("state", value, options)) {
			this.set("state_index", 0);
		}
	}
}
```
	 
### setArray(name, aValues, options, ignoreOwnSetter = false)

Задать значение свойства в виде массива (изменяются только элементы). Если хотя бы один элемент массива изменился, то массив считается измененным и выполняются колбэки.

* name - имя свойства
* aValues - массив
* options - допустимые флаги:
	* off_may_be - если при set могут быть off то нужно передать этот флаг
	* prev_value_clone - передавать пред.значение (делается тяжёлый clone)
	* prev_value - использовать этот массив в качестве пред.значения
	* no_triggers - если задано, то колбэки не выполняются
* ignoreOwnSetter=false

Возвращает true если массив был изменён.

### setObject(name, oValues, options, ignoreOwnSetter = false)

Задать значение свойств объекта (изменяются только свойства). Если хотя бы одно свойство объекта изменилось, то объект считается измененным и выполняются колбэки.

* name
* oValues Объект или массив. В случае массива свойства задаются в том порядке в каком они были объявлены ранее.
* options	- допустимые флаги:
	* off_may_be - если при set могут быть off то нужно передать этот флаг
	* prev_value_clone - передавать пред.значение (делается тяжёлый clone)
	* prev_value - использовать этот объект в качестве пред.значения
	* no_triggers - если задано, то колбэки не выполняются
* ignoreOwnSetter=false

Возвращает true если объект (массив) был изменён.

### get(name)

Получить значение свойства

### on(name, func, context, data, bRunNow = false)

Задать колбэк на изменение свойства

* name - имя свойства
* func - колбэк
* context - если не задано, то передаётся this текущего объекта
* data	- если задано, то в колбэке в первом arguments[] передаётся это значение (data)
* bRunNow - если true, то func выполнится сразу

#### Флаг SGModel.RUNNOW = true

Можно использовать при передаче значения bRunNow равного true

### off(name, func)

Удалить колбэки из списка подписчиков на изменение свойства. Если задан func, то из списка удаляется конкретный колбэк

### trigger(name, options)

Выполнить колбэки, которые выполняются при изменении значения свойства

* name - имя свойства
* options	- допустимые флаги:
	* off_may_be - если при set могут быть off то нужно передать этот флаг

### save()

Сохраняет данные в локальное хранилище localStorage

#### static localStorageKey = ""

Если задано не пустое строковое значение, то данные синхронизируются с локальным хранилищем.
Поддержка хранения данных как одного экземпляра класса (single instance), так и нескольких экземпляров: `localStorageKey + "_" + id`

### destroy()

Очищает список колбэков и присваивает destroyed = true

#### destroyed = false

Если true, значит экземпляр прошёл процедуру уничтожения destroy()


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

Получить указатель на одиночный экземляр класса.

### static get(...)

Проекция на метод get экземпляра

### static set(...)

Проекция на метод set экземпляра


## Утилиты, используемые в SGModel

### static defaults(dest, ...sources)

Если какого-то свойства в dest не оказалось, то оно при наличии берётся из объектов sources

### static clone(source)

Полное клонирование объекта с вложенными массивами и объектами (используется рекурсия)

### static revertDefaults(dest, source)

Заполнить значения объекта/массива dest значениями из объекта/массива source (с рекурсией)

### static upperFirstLetter(s)

Сделать первый символ прописным
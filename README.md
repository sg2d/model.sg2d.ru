# SGModel

A fast lightweight library (ES6) for structuring web applications using binding models and custom events. This is a faster and more simplified analogue of Backbone.js!

# Описание на русском языке

Быстрая легковесная библиотека-класс (ЕС6) для структурирования веб-приложений с помощью биндинг-моделей и пользовательских событий. Это более быстрый и упрощенный аналог Backbone.js!

## Пример использования (на ES6)

### ./tile.js

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

### ./index.js

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

## Поддерживаемые типы свойств

- SGModel.TYPE_NUMBER
- SGModel.TYPE_STRING
- SGModel.TYPE_BOOL
- SGModel.TYPE_OBJECT
- SGModel.TYPE_ARRAY_NUMBERS
- SGModel.TYPE_OBJECT_NUMBERS

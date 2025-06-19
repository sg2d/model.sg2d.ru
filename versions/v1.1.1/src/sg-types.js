/**
 * SGTypes - типизация в SGModel
 * @version 1.1.1
 * @requires ES2024+ (ES15+)
 * @link https://github.com/sg2d/model.sg2d.ru
 * @license SGModel may be freely distributed under the MIT license
 * @copyright 2019-2025 © Калашников Илья (https://model.sg2d.ru)
 */

import SGModel from './sg-model.js';
import Utils from './sg-utils.js';

export class SGBaseType {};

export default class SGTypes {
	static TYPES = [];
	static BaseType = SGBaseType;
	static create(typeCode, props) {
		const fType = new Function('defaultValue', `return function TYPE_${typeCode}() { return typeof defaultValue === 'function' ? defaultValue(): defaultValue; }`)(props.defaultValue.value);
		delete props.defaultValue;
		Object.setPrototypeOf(fType, SGBaseType);
		Object.defineProperties(fType, props);
		return fType;
	}
	static isPairValueType = (value) => (Array.isArray(value) && value.length === 2);
	static isBaseTypeProto = (type) => Object.prototype.isPrototypeOf.call(SGBaseType, type);
	static buildValueType = (value) => ({ value: value, type: this.getType(value) });
	static buildDefaultValueType = (value = void 0, type = void 0) => {
		type = type || this.getType(value);
		return { value: type(), type };
	};

	/**
	 * Поддерживаемые типы свойств (код, тип сложности, значение по умолчанию)
	 * @constant {array}
	 */
	static TYPES_DEFAULT_VALUES = {
		'ANY:mixed': null,
		'NUMBER:simple': 0,
		//'INTEGER:simple': 0, // @announcement v1.3+
		//'DECIMAL:simple': 0.0d, // @announcement v1.3+ (TODO: ES2027 точный десятичный тип данных для финансовых и научных расчетов)
		'STRING:simple': '',
		'BOOLEAN:simple': false,
		'FUNCTION:simple': function defaultValueOfFunction() { return null; },
		'XY:complex': function defaultValueOfTypeXY() { return { x: 0, y: 0 }; },
		//'XYZ:complex': function defaultValueOfTypeXYZ() { return { x: 0, y: 0, z: 0 }; },	//@announcement v1.3+
		'OBJECT:complex': function defaultValueOfTypeObject() { return {}; },
		'ARRAY:complex': function defaultValueOfTypeArray() { return []; },
		'ARRAY_NUMBERS:complex': function defaultValueOfTypeArrayNumbers() { return []; }, // @deprecated make? (TODO)
		'SET:complex': function defaultValueOfTypeSet() { return new Set(); },
		'MAP:complex': function defaultValueOfTypeMap() { return new Map(); },
		'MODEL:complex': null, // инстанс SGModel/SGModelView
		'ARRAY_MODEL:complex': function defaultValueOfTypeArrayModels() { return []; }, // коллекция SGModel/SGModelView-инстансов (примеры ключей: ID, UUID, YYYY-MM-DD, $ProjectId[_$TaskId])
		//'DATASET:complex', // набор данных с ключом (примеры ключей: ID, UUID, YYYY-MM-DD, $ProjectId[_$TaskId]), столбцами ->cols[], записями ->rows[] // @announcement v1.2+ or (@canceled и class SGDataSet extends SGModel {...})
	};

	/**
	 * Получить тип свойства в формате SGModel
	 * @param {mixed} value 
	 * @returns {SGBaseType}
	 */
	static getType(value) {
		switch (typeof value) {
			case 'number': return SGModel.TYPES.NUMBER;
			case 'string': return SGModel.TYPES.STRING;
			case 'boolean': return SGModel.TYPES.BOOLEAN;
			case 'function': {
				if (SGModel.isBasedOnModel(value)) return SGModel.TYPES.MODEL;
				return SGModel.TYPES.FUNCTION;
			}
			case 'object': {
				if (value) {
					if (Array.isArray(value)) {
						if (value.length > 0 && SGModel.isBasedOnModel(value[0])) {
							return SGModel.TYPES.ARRAY_MODEL;
						}
						return SGModel.TYPES.ARRAY;
					}
					if (Utils.isSet(value)) return SGModel.TYPES.SET;
					if (Utils.isMap(value)) return SGModel.TYPES.MAP;
					if (value instanceof SGModel) return SGModel.TYPES.MODEL;
					if (Object.keys(value).every(k => ['x', 'y'].includes(k)) && Object.keys(value).length === 2) {
						return SGModel.TYPES.XY;
					}
					return SGModel.TYPES.OBJECT;
				}
			}
		}
		return SGModel.TYPES.ANY;
	}

	static {
		this.TYPES = [];
		let index = 0;
		for (const typeDef in this.TYPES_DEFAULT_VALUES) {
			const [typeCode, complex] = typeDef.split(':');
			const fType = this.create(typeCode, {
				index: { value: index, ...Utils.__enumerableFalse },
				defaultValue: { value: this.TYPES_DEFAULT_VALUES[typeDef], ...Utils.__enumerableFalse},
				isComplex: { value: (complex === 'complex'), ...Utils.__enumerableFalse },
			});
			this.TYPES[index] = fType;
			this.TYPES[typeCode] = fType;
			index++;
		}
	}
}

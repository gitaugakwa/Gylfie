import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { concat, entries, fromPairs, isEmpty, join } from "lodash";
import { DynamoDBValue } from ".";
import { Expression, ExpressionProps } from "./expression.model";

export enum ConditionOptions {
	// Comparators
	equal = "=",
	notEqual = "<>",
	less = "<",
	lessEqual = "<=",
	greater = ">",
	greaterEqual = ">=",
	// Logic
	between = "BETWEEN",
	in = "IN",
	and = "AND",
	or = "OR",
	not = "NOT",
	// Functions
	beginsWith = "begins_with(*,*)",
	contains = "contains(*,*)",
	notContains = "NOT contains(*,*)",
	exists = "attribute_exists(*)",
	notExists = "attribute_not_exists(*)",
	size = "size(*)",
	type = "attribute_type(*,*)",
}

export interface ConditionExpressionProps extends ExpressionProps {
	type: ConditionOptions;
	// key?: string;
	key?: string;
	// add placeholder key so that is is possible to implicitly decare
	// the placeholder key that will be used in the expression
	and?: ConditionExpressionProps[];
	or?: ConditionExpressionProps[];
	value?: DynamoDBValue;
}

// The key of the property should not be required in the comparison
export class Condition extends Expression {
	// This all happens in an individual bracket
	// so if the expression has no and or or,
	// no brackets will be created thus allowing for parent expression to add it into it's bracket
	private type: ConditionOptions;
	// key?: string;
	private key?: string;
	private _and: Condition[] = [];
	private _or: Condition[] = [];
	public value?: DynamoDBValue;
	constructor(props: ConditionExpressionProps) {
		super(props);
		this.type = props.type;
		this.value = props.value;
		// this.key = props.key ? props.key : undefined;
		this.key = props.key;
		// if (props.and) {
		// 	this.and = [];
		// 	for (const and of props.and) {
		// 		this.and.push(
		// 			new Condition({
		// 				...and,
		// 				valueHoldersTaken: this.valueHoldersTaken,
		// 				attributeValues: this.attributeValues,
		// 				lastGeneratedvalueHolder: this.lastGeneratedvalueHolder,
		// 			})
		// 		);
		// 	}
		// }
		// if (props.or) {
		// 	this.or = [];
		// 	for (const or of props.or) {
		// 		this.or.push(
		// 			new Condition({
		// 				...or,
		// 				valueHoldersTaken: this.valueHoldersTaken,
		// 				attributeValues: this.attributeValues,
		// 				lastGeneratedvalueHolder: this.lastGeneratedvalueHolder,
		// 			})
		// 		);
		// 	}
		// }
	}

	public static equal(value: DynamoDBValue, key?: string): Condition {
		return new Condition({ key, type: ConditionOptions.equal, value });
	}
	public static notEqual(value: DynamoDBValue, key?: string): Condition {
		return new Condition({ key, type: ConditionOptions.notEqual, value });
	}
	public static contains(value: DynamoDBValue, key?: string): Condition {
		return new Condition({ key, type: ConditionOptions.contains, value });
	}
	public static notContains(value: DynamoDBValue, key?: string): Condition {
		return new Condition({
			key,
			type: ConditionOptions.notContains,
			value,
		});
	}
	public static exists(key: string): Condition {
		return new Condition({ key, type: ConditionOptions.exists });
	}
	public static notExists(key: string): Condition {
		return new Condition({
			key,
			type: ConditionOptions.notExists,
		});
	}
	public static beginsWith(value: DynamoDBValue, key?: string): Condition {
		return new Condition({
			key,
			type: ConditionOptions.beginsWith,
			value,
		});
	}
	public static between<TType extends string | number>(
		value1: TType,
		value2: TType,
		key?: string
	): Condition {
		return new Condition({
			key,
			type: ConditionOptions.between,
			value: [value1, value2],
		});
	}
	public static lesser(value: DynamoDBValue, key?: string): Condition {
		return new Condition({
			key,
			type: ConditionOptions.less,
			value,
		});
	}
	public static lesserEqual(value: DynamoDBValue, key?: string): Condition {
		return new Condition({
			key,
			type: ConditionOptions.lessEqual,
			value,
		});
	}
	public static greater(value: DynamoDBValue, key?: string): Condition {
		return new Condition({
			key,
			type: ConditionOptions.greater,
			value,
		});
	}
	public static greaterEqual(value: DynamoDBValue, key?: string): Condition {
		return new Condition({
			key,
			type: ConditionOptions.greaterEqual,
			value,
		});
	}

	public and(value: DynamoDBValue, key?: string): Condition;
	public and(comparison: Condition, key?: string): Condition;
	public and(param: DynamoDBValue | Condition, key?: string): Condition {
		if (param instanceof Condition) {
			this._and.push(
				new Condition({
					...param,
					key: key ?? param.key ?? this.key,
					type: param.type,
					value: param.value,
					attributeNames: this.attributeNames,
					attributeValues: this.attributeValues,
					lastGeneratedNameHolder: this.lastGeneratedNameHolder,
					lastGeneratedValueHolder: this.lastGeneratedValueHolder,
				})
			);
			return this;
		}
		this._and.push(
			new Condition({
				attributeNames: this.attributeNames,
				attributeValues: this.attributeValues,
				lastGeneratedNameHolder: this.lastGeneratedNameHolder,
				lastGeneratedValueHolder: this.lastGeneratedValueHolder,
				key:
					((this.type == ConditionOptions.exists ||
						this.type == ConditionOptions.notExists) &&
					!key
						? (param as string)
						: key) ?? this.key,
				type: this.type,
				value: param,
			})
		);
		return this;
	}

	public or(value: DynamoDBValue, key?: string): Condition;
	public or(comparison: Condition, key?: string): Condition;
	public or(param: DynamoDBValue | Condition, key?: string): Condition {
		if (param instanceof Condition) {
			this._or.push(
				new Condition({
					...param,
					key: key ?? param.key,
					type: param.type,
					value: param.value,
					attributeNames: this.attributeNames,
					attributeValues: this.attributeValues,
					lastGeneratedNameHolder: this.lastGeneratedNameHolder,
					lastGeneratedValueHolder: this.lastGeneratedValueHolder,
				})
			);
			return this;
		}
		this._or.push(
			new Condition({
				attributeNames: this.attributeNames,
				attributeValues: this.attributeValues,
				lastGeneratedNameHolder: this.lastGeneratedNameHolder,
				lastGeneratedValueHolder: this.lastGeneratedValueHolder,
				key:
					((this.type == ConditionOptions.exists ||
						this.type == ConditionOptions.notExists) &&
					!key
						? (param as string)
						: key) ?? this.key,
				type: this.type,
				value: param,
			})
		);
		return this;
	}

	public ifKeyUndefined(key: string): Condition {
		this.key ??= key;
		return this;
	}

	// For placekeys, for the ones that are not given,
	// they will be generated starting with the word value, e.g. value1 ... value99

	public generateExpression(props?: {
		key?: string;
		ExpressionAttributeValues?: {
			[key: string]: AttributeValue;
		};
		ExpressionAttributeNames?: {
			[key: string]: string;
		};
	}): {
		ExpressionAttributeValues?: {
			[key: string]: AttributeValue;
		};
		ExpressionAttributeNames?: {
			[key: string]: string;
		};
		KeyConditionExpression?: string;
	} {
		let { ExpressionAttributeValues, ExpressionAttributeNames, key } =
			props ?? {};
		ExpressionAttributeValues &&
			this.setAttributeValues(ExpressionAttributeValues);
		ExpressionAttributeNames &&
			this.setAttributeNames(ExpressionAttributeNames);
		let returnValue = "";
		// if (this.and || this.or) {
		// 	brackets = true;
		// }
		key ??= this.key;
		if (!this.key && !key) {
			throw new Error("No key was provided");
		}
		switch (this.type) {
			case ConditionOptions.equal:
			case ConditionOptions.notEqual: {
				// allow booleans
				if (typeof this.value == "boolean") {
					let placekey = this.setValue(this.value);
					returnValue = `${key} ${this.type} ${placekey}`;
					break;
				}
			}
			case ConditionOptions.less:
			case ConditionOptions.lessEqual:
			case ConditionOptions.greater:
			case ConditionOptions.greaterEqual: {
				// not sure if we should allow for multiple values,
				// such that the different operators are split by and
				// the :value1 should be variable depending on what is available
				// thus, the child expressions should be created before the parent
				// also, the this.attributeValues could be passed from parent to child making it easier.
				if (
					typeof this.value == "string" ||
					typeof this.value == "number"
				) {
					let placekey = this.setValue(this.value);
					returnValue = `${key} ${this.type} ${placekey}`;
				} else if (
					typeof this.value == "object" &&
					this.value != null
				) {
					const entry = entries(this.value)[0];
					let placekey = this.setValue(entry[1], `:${entry[0]}`);
					returnValue = `${key} ${this.type} ${placekey}`;
				}
				// else throw
				break;
			}
			case ConditionOptions.between: {
				if (Array.isArray(this.value)) {
					let placekey1 = this.setValue(this.value[0]);
					let placekey2 = this.setValue(this.value[1]);
					returnValue = `${key} BETWEEN ${placekey1} AND ${placekey2}`;
				}
				break;
			}
			case ConditionOptions.in: {
				if (Array.isArray(this.value)) {
					let arrayValues = "";
					for (let i = 0; i < this.value.length; ++i) {
						let placekey = this.setValue(this.value[i]);
						arrayValues = arrayValues.concat(`${placekey}, `);
					}
					arrayValues = arrayValues.substring(
						0,
						arrayValues.length - 3
					);
					returnValue = `${key} IN (${arrayValues})`;
				}
				break;
			}
			case ConditionOptions.beginsWith: {
				if (typeof this.value == "string") {
					let placekey = this.setValue(this.value);
					returnValue = `begins_with (${key}, ${placekey})`;
				} else if (
					typeof this.value == "object" &&
					this.value != null
				) {
					let entry = entries(this.value)[0];
					if (typeof entry[1] == "string") {
						let placekey = this.setValue(entry[1], `:${entry[0]}`);
						returnValue = `begins_with (${key}, ${placekey})`;
					}
				}
				break;
			}
			case ConditionOptions.notContains:
			case ConditionOptions.contains: {
				if (
					typeof this.value == "string" ||
					typeof this.value == "number"
				) {
					let placekey = this.setValue(this.value);
					returnValue = `contains (${key}, ${placekey})`;
				} else if (
					typeof this.value == "object" &&
					this.value != null
				) {
					let entry = entries(this.value)[0];
					if (
						typeof entry[1] == "string" ||
						typeof entry[1] == "number"
					) {
						let placekey = this.setValue(entry[1], `:${entry[0]}`);
						returnValue = `contains (${key}, ${placekey})`;
					}
				}
				if (this.value == ConditionOptions.notContains) {
					returnValue = `NOT ${returnValue}`;
				}
				break;
			}
			case ConditionOptions.exists: {
				if (typeof key == "string") {
					let placename = this.setName(key ?? "");
					returnValue = `attribute_exists (${placename})`;
				} else if (typeof key == "object" && key != null) {
					let entry = entries(key)[0];
					if (typeof entry[1] == "string") {
						let placename = this.setName(entry[1], `:${entry[0]}`);
						returnValue = `attribute_exists (${placename})`;
					}
				}
				break;
			}
			case ConditionOptions.notExists: {
				if (typeof key == "string") {
					let placename = this.setName(key ?? "");
					returnValue = `attribute_not_exists (${placename})`;
				} else if (typeof key == "object" && key != null) {
					let entry = entries(key)[0];
					if (typeof entry[1] == "string") {
						let placename = this.setName(entry[1], `:${entry[0]}`);
						returnValue = `attribute_not_exists (${placename})`;
					}
				}
				break;
			}
			default: {
				returnValue = "";
			}
		}

		if (this._and.length) {
			const expr = this._and.map((comp) => {
				return comp.generateExpression({
					key: undefined,
					ExpressionAttributeValues: this.getAttributeValues(),
					ExpressionAttributeNames: this.getAttributeNames(),
				});
			});
			returnValue = join(
				concat(
					[returnValue],
					expr.map(
						({ KeyConditionExpression }) => KeyConditionExpression
					)
				),
				" AND "
			);
			this.mergeValues(
				fromPairs(
					expr.flatMap(({ ExpressionAttributeValues }) =>
						entries(ExpressionAttributeValues)
					)
				)
			);
		}

		if (this._or.length) {
			const expr = this._or.map((comp) => {
				return comp.generateExpression({
					key: undefined,
					ExpressionAttributeValues: this.getAttributeValues(),
					ExpressionAttributeNames: this.getAttributeNames(),
				});
			});
			returnValue = join(
				concat(
					[returnValue],
					expr.map(
						({ KeyConditionExpression }) => KeyConditionExpression
					)
				),
				" OR "
			);
			this.mergeValues(
				fromPairs(
					expr.flatMap(({ ExpressionAttributeValues }) =>
						entries(ExpressionAttributeValues)
					)
				)
			);
		}

		return {
			KeyConditionExpression:
				this._or.length || this._and.length
					? `(${returnValue})`
					: returnValue,
			ExpressionAttributeValues: isEmpty(this.getAttributeValues())
				? undefined
				: this.getAttributeValues(),
			ExpressionAttributeNames: isEmpty(this.getAttributeNames())
				? undefined
				: this.getAttributeNames(),
		};
	}
}

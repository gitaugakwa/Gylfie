import {
	AttributeDefinition,
	AttributeValue,
	KeySchemaElement,
} from "@aws-sdk/client-dynamodb";
import { ConditionOptions, Condition } from "./condition.model";
import { Key, PrimaryKeyDefinition } from "./key.model";
import { DynamoDBMap, DynamoDBValue } from "./types";

export class Conversion {
	public static valueToItemObject(object: DynamoDBMap): {
		[key: string]: AttributeValue;
	} {
		return Object.fromEntries(
			Object.entries(object).map(([name, value]) => [
				name,
				this.valueToItem(value),
			])
		);
	}
	// maybe be able to pass a type, if it was already previously known
	public static valueToItem(value: string[]): AttributeValue.SSMember;
	public static valueToItem(value: string): AttributeValue.SMember;
	public static valueToItem(value: number[]): AttributeValue.NSMember;
	public static valueToItem(value: number): AttributeValue.NMember;
	public static valueToItem(value: DynamoDBValue): AttributeValue;
	public static valueToItem(value: DynamoDBValue): AttributeValue {
		switch (typeof value) {
			case "string": {
				return { S: value };
			}
			case "number": {
				return { N: value.toString() };
			}
			case "boolean": {
				return { BOOL: value };
			}
			case "undefined": {
				return { NULL: true };
			}
			case "object": {
				if (Array.isArray(value)) {
					const type: { NS: boolean; SS: boolean; L: boolean } = {
						NS: false,
						SS: false,
						L: false,
					};
					for (const item of value) {
						if (typeof item == "string") {
							if (type.NS) {
								type.L = true;
								break;
							}
							type.SS = true;
						} else if (typeof item == "number") {
							if (type.SS) {
								type.L = true;
								break;
							}
							type.NS = true;
						}
					}
					if (type.L) {
						const list: AttributeValue.LMember = {
							L: value.map((val: string | number) =>
								this.valueToItem(val)
							),
						};
						return list;
					} else if (type.SS) {
						const ss: AttributeValue.SSMember = { SS: [] };
						value.forEach((value: string | number) => {
							if (typeof value == "string") {
								ss.SS.push(value);
							}
						});
						return ss;
					} else {
						const ns: AttributeValue.NSMember = { NS: [] };
						value.forEach((value: number | string) => {
							if (typeof value == "number") {
								ns.NS.push(value.toString());
							}
						});
						return ns;
					}
				} else if (!value) {
					return { NULL: true };
				} else {
					const map: AttributeValue.MMember = {
						M: Object.fromEntries(
							Object.entries(value).map(([name, val]) => [
								name,
								this.valueToItem(val),
							])
						),
					};
					return map;
				}
			}
			default: {
				return { NULL: true };
			}
		}
	}

	public static itemToValueObject(object: {
		[key: string]: AttributeValue;
	}): DynamoDBMap {
		return Object.fromEntries(
			Object.entries(object).map(([name, value]) => [
				name,
				this.itemToValue(value),
			])
		);
	}

	public static itemToValue(item: AttributeValue): DynamoDBValue {
		if (item.BOOL != undefined) {
			return item.BOOL;
		} else if (item.S != undefined) {
			return item.S;
		} else if (item.N != undefined) {
			return parseInt(item.N, 10);
		} else if (item.NULL != undefined) {
			return null;
		} else if (item.L != undefined) {
			const value: (string | number)[] = [];
			item.L.forEach((val) => {
				if (val.S != undefined) {
					value.push(val.S);
				} else if (val.N != undefined) {
					value.push(parseInt(val.N, 10));
				}
			});
			return value;
		} else if (item.SS != undefined) {
			return item.SS;
		} else if (item.NS != undefined) {
			return item.NS.map((val) => parseInt(val, 10));
		} else if (item.M != undefined) {
			return Object.fromEntries(
				Object.entries(item.M).map(([name, val]) => [
					name,
					this.itemToValue(val),
				])
			);
		} else {
			return null;
		}
	}

	public static parseKeyDefinition(
		key: PrimaryKeyDefinition
	): KeySchemaElement[] {
		const keyMap: { [key: string]: string } = {
			partitionKey: "HASH",
			sortKey: "RANGE",
			HASH: "HASH",
			RANGE: "RANGE",
		};
		return Object.entries(key).map(([type, name]): KeySchemaElement => {
			if (!name) {
				throw new Error("GSI Key Name is undefined"); // Fix error
			}
			return { AttributeName: name, KeyType: keyMap[type] };
		});
	}
	public static parseKey(key: Key): Condition {
		// Since all keys are basically coupled,
		// We need to pass the same valueHoldersTaken and lastGeneratedvalueHolder
		let partKeyPossible: boolean = false;
		let currentCondition: Condition | undefined;

		// since we can't restrict the number of key:values, we will have to map
		for (const [name, value] of Object.entries(key)) {
			if (value instanceof Condition) {
				if (currentCondition) {
					currentCondition.and(value, name);
					continue;
				}
				currentCondition ??= value.ifKeyUndefined(name);
				continue;
			}
			switch (typeof value) {
				case "string": {
					partKeyPossible = true;
				}
				case "number": {
					if (currentCondition) {
						currentCondition.and(Condition.equal(value, name));
						break;
					}
					currentCondition ??= Condition.equal(value, name);
					break;
				}
			}
		}

		if (!partKeyPossible) {
			throw new Error("No key provided is a possible PartitionKey");
		}

		if (!currentCondition) {
			throw new Error("Invalid Key");
		}

		return currentCondition;
	}

	public static parseAttributeDefinitions(attributes: {
		[key: string]: "S" | "N";
	}): AttributeDefinition[] {
		return Object.entries(attributes).map(([name, type]) => {
			return { AttributeName: name, AttributeType: type };
		});
	}

	// For this, we will need a table structure
	// So like a map that will define each of the attribute names of the values
	// This also need the table structure so that we're able to map
	// By providing the table structure,
	// we're able to find the attribute names that the values will be mapped to
}

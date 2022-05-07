import {
	AttributeDefinition,
	KeySchemaElement,
} from "@aws-sdk/client-dynamodb";
import { entries } from "lodash";
import { Condition } from "./condition.model";
import { Key, PrimaryKeyDefinition } from "./key.model";

export class Conversion {
	public static parseKeyDefinition(
		key: PrimaryKeyDefinition
	): KeySchemaElement[] {
		const keyMap: { [key: string]: string } = {
			partitionKey: "HASH",
			sortKey: "RANGE",
			HASH: "HASH",
			RANGE: "RANGE",
		};
		return entries(key).map(([type, name]): KeySchemaElement => {
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
		for (const [name, value] of entries(key)) {
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
		return entries(attributes).map(([name, type]) => {
			return { AttributeName: name, AttributeType: type };
		});
	}

	// For this, we will need a table structure
	// So like a map that will define each of the attribute names of the values
	// This also need the table structure so that we're able to map
	// By providing the table structure,
	// we're able to find the attribute names that the values will be mapped to
}

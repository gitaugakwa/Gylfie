// For Basic classes that need to be converted into a dynamo item

import { DateTime } from "luxon";
import { EntityProps, Include } from "../decorators";
import { v1 } from "uuid";
import { TableProps } from "./table.model";
import { DynamoDBMap, DynamoDBValue } from "./types";
import { Update, UpdateMap } from "./update.model";
import { getMetadata } from "../../base/metadata";
import { cloneDeep, mapValues, mergeWith } from "lodash";

type DynamoDBAttributeMap =
	| "PK"
	| "SK"
	| "GSIPK1"
	| "GSISK1"
	| "GSIPK2"
	| "GSISK2"
	| "GSIPK3"
	| "GSISK3"
	| "GSIPK4"
	| "GSISK4";

interface AttributeMap {
	name: DynamoDBAttributeMap | string;
	morph: (value: DynamoDBValue) => DynamoDBValue;
}

interface ValueMap {
	value: DynamoDBValue;
}

interface IncludeMap {
	map: {
		[key: string]: DynamoDBAttributeMap | AttributeMap | ValueMap | string;
	};
	// If the value is defined here, it's imported with it's name as a default
	include?: (string | AttributeMap)[];
}

interface ExcludeMap {
	map: {
		[key: string]: DynamoDBAttributeMap | AttributeMap | ValueMap | string;
	};
	exclude?: string[];
}

type AttributeDynamoMap =
	| {
			[key: string]:
				| DynamoDBAttributeMap
				| AttributeMap
				| ValueMap
				| string;
	  }
	| ExcludeMap
	| IncludeMap;

interface EntityInterface extends TableProps {
	// This should be the names for the params
	map: DynamoDBMap;
}

export type EntityInterfaceProps =
	| EntityInterface
	| { map: DynamoDBMap; complete: true };

export function isEntityInterface(props: any): props is EntityInterfaceProps {
	return props.map && (props.complete || (props.primaryKey && props.name));
}

export type DynamoEntityConstructor<
	TReturn = any,
	TProps = EntityInterfaceProps
> = { new (value: EntityInterfaceProps | TProps): TReturn };

// Have entity props that are different to what would be used
// EntityInterface
// Set cache time with entity
export abstract class RegularItem {
	// [key: string]: DynamoDBValue;
	// So as to allow default conversion of dynamoDBMaps,
	// the props value will be optional this then allows entities to opt into
	// @Include()
	public updatedAt?: string;
	constructor(props?: EntityInterfaceProps) {
		const isComplete = function (
			props: any
		): props is { map: DynamoDBMap; complete: true } {
			return props.complete;
		};
		const entityStructure = (
			this as unknown as {
				_gylfie_entityStructure: EntityProps;
			}
		)._gylfie_entityStructure;
		if (props && entityStructure) {
			// Get values from schema
			// Get table key attribute names
			if (isComplete(props)) {
				Object.assign(this, props.map);
				return;
			}
			const { partitionKey, sortKey } = props.primaryKey;

			const values: [string, DynamoDBValue][] = [];
			const keys: string[] = [partitionKey];

			values.push(
				...Object.entries(
					this.valueFromSchema(
						props.map[partitionKey] as string,
						entityStructure.primaryKey.partitionKey
					)
				)
			);
			if (
				sortKey &&
				typeof entityStructure.primaryKey.sortKey == "string"
			) {
				keys.push(sortKey);
				values.push(
					...Object.entries(
						this.valueFromSchema(
							props.map[sortKey] as string,
							entityStructure.primaryKey.sortKey
						)
					)
				);
			}
			if (props.indexes && entityStructure.indexes) {
				for (const [name, key] of Object.entries(
					entityStructure.indexes
				)) {
					if (!props.indexes[name]) {
						throw new Error(
							"Index provided does not exist in Table"
						);
					}
					const { partitionKey, sortKey } = props.indexes[name];

					keys.push(partitionKey);
					values.push(
						...Object.entries(
							this.valueFromSchema(
								props.map[partitionKey] as string,
								key.partitionKey
							)
						)
					);
					if (sortKey && typeof key.sortKey == "string") {
						keys.push(sortKey);
						values.push(
							...Object.entries(
								this.valueFromSchema(
									props.map[sortKey] as string,
									key.sortKey
								)
							)
						);
					}
				}
			}

			// Any value derived from the schema is placed into the
			Object.assign(this, Object.fromEntries(values));

			// Should also ignore all keys
			// This also prioritizes attributes that are explicitly added
			Object.assign(
				this,
				Object.fromEntries(
					Object.entries(props.map).filter(([name]) => {
						return !keys.includes(name);
					})
				)
			);
			return;
		}
		this.updatedAt = DateTime.utc().toISO();
	}

	public update(modified: { [key: string]: Update | DynamoDBValue }) {
		Object.entries(modified).forEach(([key, value]) => {
			if (!getMetadata(this, "const", key)) {
				(this as unknown as { [key: string]: Update | DynamoDBValue })[
					key
				] = value;
			}
		});
		this.updatedAt = DateTime.utc().toISO();
		return this;
	}

	public toObject<T = any>(): T {
		return Object.fromEntries(
			Object.entries(this).filter(
				([name, value]) => getMetadata(this, "public", name) ?? true
			)
		) as T;
	}

	// If the value is in a schema, it will be returned as a string
	// conversion will pretty much be impossible, unless we provide a converter
	// That will have to be provided to super that then is able to convert each value to type
	protected valueFromSchema(
		value: string,
		schema: string
	): { [key: string]: string } {
		const { regex, placeholders } = this.extractFromSchema(schema);
		// Should have a single match that then the values after are the groups
		// should be in the order of the placeholders
		const valueMatches = value.match(regex);
		if (valueMatches) {
			return Object.fromEntries(
				placeholders.map((val, index) => [val, valueMatches[index + 1]])
			);
		}
		return {};
	}

	// Ensure that the schema provided is easily convertible to a regex
	protected extractFromSchema(schema: string): {
		regex: RegExp;
		placeholders: string[];
	} {
		// values that can possibly be extracted
		const placeholders: string[] = [];
		const regexString = schema.replace(/{{(\w+)}}/g, (match, value) => {
			placeholders.push(value);
			return "(.*)";
		});
		const regex = new RegExp(regexString);
		return {
			regex,
			placeholders,
		};
	}

	protected isExcludeMap(map: any): map is ExcludeMap {
		return map.exclude;
	}
	protected isIncludeMap(map: any): map is IncludeMap {
		return map.include;
	}
	protected isMap(map: any): map is ExcludeMap | IncludeMap {
		return typeof map.map != "string" && !this.isAttributeMap(map);
	}
	protected isAttributeMap(map: any): map is AttributeMap {
		return map.name;
	}
	protected isValueMap(map: any): map is ValueMap {
		return map.value;
	}
	protected validType(val: any): val is DynamoDBValue {
		if (typeof val == "function" || typeof val == "symbol") {
			return false;
		}
		return val;
	}
	// This should be better
	protected isFromDynamo(map: any): map is DynamoDBMap {
		// Some Tables may have a different pk name
		return map.PK;
	}

	protected generateFriendlyID(): string {
		// In my opinion, 10 digits should be the maximum
		// The number should always be 10 digits long hence the padding
		// For that, no number with 11 digits should be generated
		const MAX = 9000000000;
		const PAD = 1000000000;
		// Need to check if the number is valid
		return Math.floor(PAD + Math.random() * MAX).toString();
	}

	protected generateID(): string {
		return v1();
	}
}

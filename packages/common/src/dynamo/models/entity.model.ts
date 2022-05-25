import { Update, UpdateMap } from "./update.model";
import { entries, filter, fromPairs, merge } from "lodash";
import { DateTime } from "luxon";
import { getMetadata } from "../../base";
import { EntityProps } from "../decorators";
import { TableProps } from "./table.model";
import { DynamoDBValue, DynamoDBMap } from "./types";

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

export function isEntity(type: any): type is Entity {
	return type._gylfie_entityStructure;
}

export function isEntityInterface(props: any): props is EntityInterfaceProps {
	return props.map && (props.complete || (props.primaryKey && props.name));
}

export type DynamoEntityConstructor<TReturn = any> = {
	new (...args: any[]): TReturn;
};

// If the value is in a schema, it will be returned as a string
// conversion will pretty much be impossible, unless we provide a converter
// That will have to be provided to super that then is able to convert each value to type
export function valueFromSchema(
	value: string,
	schema: string
): { [key: string]: string } {
	const { regex, placeholders } = extractFromSchema(schema);
	// Should have a single match that then the values after are the groups
	// should be in the order of the placeholders
	const valueMatches = value.match(regex);
	if (valueMatches) {
		return fromPairs(
			placeholders.map((val, index) => [val, valueMatches[index + 1]])
		);
	}
	return {};
}

// Ensure that the schema provided is easily convertible to a regex
export function extractFromSchema(schema: string): {
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

export function isExcludeMap(map: any): map is ExcludeMap {
	return map.exclude;
}
export function isIncludeMap(map: any): map is IncludeMap {
	return map.include;
}
export function isMap(map: any): map is ExcludeMap | IncludeMap {
	return typeof map.map != "string" && !isAttributeMap(map);
}
export function isAttributeMap(map: any): map is AttributeMap {
	return map.name;
}
export function isValueMap(map: any): map is ValueMap {
	return map.value;
}
export function validType(val: any): val is DynamoDBValue {
	if (typeof val == "function" || typeof val == "symbol") {
		return false;
	}
	return val;
}
// This should be better
export function isFromDynamo(map: any): map is DynamoDBMap {
	// Some Tables may have a different pk name
	return map.PK;
}

export interface EntityInstance {
	update(modified: { [key: string]: Update | DynamoDBValue }): any;
	toObject(): any;
}

type Entity = {
	new (props?: EntityInterfaceProps): Entity;
};

export function EntityMixin<T extends { new (...args: any[]): {} }>(
	constructor: T
) {
	return class Entity extends constructor {
		constructor(...args: any[]) {
			const props = args?.[0] ?? null;
			const isComplete = function (
				props: any
			): props is { map: DynamoDBMap; complete: true } {
				return props.complete;
			};
			const entityStructure = (
				constructor as unknown as {
					_gylfie_entityStructure: EntityProps<T>;
				}
			)._gylfie_entityStructure;
			if (props && entityStructure && isEntityInterface(props)) {
				// Get values from schema
				// Get table key attribute names
				if (isComplete(props)) {
					super(props.map);
					// Object.assign(this, props.map);
					return;
				}
				const { partitionKey, sortKey } = props.primaryKey;

				const values: [string, DynamoDBValue][] = [];
				const keys: string[] = [partitionKey];

				values.push(
					...entries(
						valueFromSchema(
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
						...entries(
							valueFromSchema(
								props.map[sortKey] as string,
								entityStructure.primaryKey.sortKey
							)
						)
					);
				}
				if (props.indexes && entityStructure.indexes) {
					for (const [name, key] of entries(
						entityStructure.indexes
					)) {
						if (!props.indexes[name]) {
							throw new Error(
								"Index provided does not exist in Table"
							);
						}
						const { partitionKey, sortKey } = props.indexes[name];

						keys.push(partitionKey);
						if (key.partitionKey == "string") {
							values.push(
								...entries(
									valueFromSchema(
										props.map[partitionKey] as string,
										key.partitionKey
									)
								)
							);
						}
						if (sortKey && typeof key.sortKey == "string") {
							keys.push(sortKey);
							values.push(
								...entries(
									valueFromSchema(
										props.map[sortKey] as string,
										key.sortKey
									)
								)
							);
						}
					}
				}

				// super()
				super(
					merge(
						{},
						// Any value derived from the schema is placed into the instance
						fromPairs(values),
						// Should also ignore all keys
						// This also prioritizes attributes that are explicitly added
						fromPairs(
							filter(entries(props.map), ([name]) => {
								return !keys.includes(name);
							})
						)
					)
				);
				return;
			}
			super(...args);
		}

		public update(modified: { [key: string]: Update | DynamoDBValue }) {
			entries(modified).forEach(([key, value]) => {
				if (!getMetadata(this, "const", key)) {
					(
						this as unknown as {
							[key: string]: Update | DynamoDBValue;
						}
					)[key] = value;
				}
			});
			return this;
		}

		public toObject<T = any>(): T {
			return Object.fromEntries(
				entries(this).filter(
					([name, value]) => getMetadata(this, "public", name) ?? true
				)
			) as T;
		}
	};
}

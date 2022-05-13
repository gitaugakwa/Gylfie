import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { cloneDeep, concat, reduce } from "lodash";
import "reflect-metadata";
import { getMetadata } from "../../base/metadata";
import { EntityProps } from "../decorators";
import { Placeholder } from "../placeholders";
import { Conversion } from "./conversion.model";
import { EntityInterfaceProps } from "./entity.model";
import { IndexType } from "./index.model";
import {
	IndexKeyDefinition,
	Key,
	PartitionPrimaryKeyDefinition,
} from "./key.model";
import { DynamoDBMap, DynamoDBValue } from "./types";
import { Update, UpdateMap, UpdateOptions } from "./update.model";

export interface TableProps {
	name: string;
	primaryKey: PartitionPrimaryKeyDefinition;
	indexes?: {
		[key: string]: IndexKeyDefinition;
	};
	cache?: boolean | { duration?: number };
}

enum TABLE_TYPE {
	BASE = "BASE",
	GSI = "GSI",
	LSI = "LSI",
}

enum ATTRIBUTE_TYPE {
	PARTITION = "HASH",
	SORT = "RANGE",
}

// class Index {
// 	private cache: Cache;
// 	constructor(
// 		private structure: IndexKeyDefinition,
// 		private dynamoDB: DynamoDB,
// 		private baseCache: Cache
// 	) {
// 		this.cache = new Cache();
// 	}

// 	public async put(
// 		access: { partitionKey: string; sortKey?: string | number },
// 		elem: CacheElement
// 	) {
// 		return this.cache.put(access, elem);
// 	}
// 	public async get(partitionKey: string, sortKey?: string | number) {
// 		return this.cache.get(partitionKey, sortKey);
// 	}
// }

// Table is more of a middleman that'll intercepts requests to dynamo
// When an entity is provided that is to be placed in dynamo,
// Table intercepts the entity and converts it into the proper format required for dynamo
// Table should also be able to convert a dynamo map into an entity
// This may be way harder but would greatly simplify everything
// The problem comes when retrieving
// When retrieving an object,
// The DynamoMap provided is transformed into an EntityInterface
// Thus is then able to provided the details required to fill the EntityInterface

export class AccessProperties {
	constructor(
		public values: {
			KeyConditionExpression: string;
			ExpressionAttributeValues: {
				[key: string]: AttributeValue;
			};
			IndexName?: string;
		},
		public key: Key
	) {}
}

export class Table {
	// Base Cache
	constructor(public structure: TableProps) {}

	public getAccessProps(
		key: Key,
		placeholderValues?: DynamoDBMap
	): AccessProperties {
		key = cloneDeep(key);
		if (Object.entries(key).length == 0) {
			throw new Error("Key provided is empty");
		}
		const indexes = Object.keys(key).map((key) => {
			return this.findIndexFromKeyName(key);
		});

		if (placeholderValues) {
			const place = new Placeholder(placeholderValues);
			for (const [name, value] of Object.entries(key)) {
				if (typeof value == "number") {
					continue;
				}
				if (typeof value == "string") {
					key[name] = place.replaceString(value);
					continue;
				}
				if (typeof value.value == "string") {
					value.value = place.replaceString(value.value);
					key[name] = value;
				}
			}
		}

		// Only the PartitionKey was provided
		if (indexes.length == 1 && Object.entries(key).length == 1) {
			const pkIndexes = indexes[0].filter(
				({ attributeType }) => attributeType == ATTRIBUTE_TYPE.PARTITION
			);
			if (pkIndexes.length > 1) {
				throw new Error(
					`Multiple indexes have the same AttributeName as the PartitionKey:${key}`
				);
			}
			if (pkIndexes.length == 0) {
				throw new Error(
					`No indexes match the AttributeName provided:${key}`
				);
			}
			const { ExpressionAttributeValues, KeyConditionExpression } =
				Conversion.parseKey(key).generateExpression();
			switch (pkIndexes[0].type) {
				case TABLE_TYPE.BASE: {
					return new AccessProperties(
						{
							ExpressionAttributeValues,
							KeyConditionExpression,
						},
						key
					);
				}
				case TABLE_TYPE.GSI:
				case TABLE_TYPE.LSI: {
					return new AccessProperties(
						{
							IndexName: pkIndexes[0].name,
							ExpressionAttributeValues,
							KeyConditionExpression,
						},
						key
					);
				}
			}
		}

		// PartitionKey and SortKey
		const commonIndexes = indexes[0].filter((val) =>
			indexes[1].some(
				({ type, name }) => val.type == type && val.name == name
			)
		);

		if (commonIndexes.length > 1) {
			throw new Error(
				`Multiple indexes have the same AttributeNames as the PartitionKey and SortKey:${key}`
			);
		}
		if (commonIndexes.length == 0) {
			throw new Error(
				`No indexes match the AttributeNames provided:${key}`
			);
		}
		const { ExpressionAttributeValues, KeyConditionExpression } =
			Conversion.parseKey(key).generateExpression();
		switch (commonIndexes[0].type) {
			case TABLE_TYPE.BASE: {
				return new AccessProperties(
					{
						ExpressionAttributeValues,
						KeyConditionExpression,
					},
					key
				);
			}
			case TABLE_TYPE.GSI:
			case TABLE_TYPE.LSI: {
				return new AccessProperties(
					{
						IndexName: commonIndexes[0].name,
						ExpressionAttributeValues,
						KeyConditionExpression,
					},
					key
				);
			}
		}
	}

	// Say if an index is the inverse of another, how would that work
	// Our key system doesn't handle that
	// The only way to differentiate PartitionKey from SortKey is by the type
	// We can also send information of what type the name is in the table, that can be used later
	private findIndexFromKeyName(
		name: string
	): { type: TABLE_TYPE; name?: string; attributeType: ATTRIBUTE_TYPE }[] {
		const indexes: {
			type: TABLE_TYPE;
			name?: string;
			attributeType: ATTRIBUTE_TYPE;
		}[] = [];
		if (this.structure.primaryKey.partitionKey == name) {
			indexes.push({
				type: TABLE_TYPE.BASE,
				attributeType: ATTRIBUTE_TYPE.PARTITION,
			});
		}
		if (this.structure.primaryKey.sortKey == name) {
			indexes.push({
				type: TABLE_TYPE.BASE,
				attributeType: ATTRIBUTE_TYPE.SORT,
			});
		}

		if (this.structure.indexes) {
			const secIndexes = Object.entries(this.structure.indexes)
				.filter(([indexName, value]) => {
					const instances = Object.entries(value).filter(
						([indexProp, value]) => {
							if (indexProp == "type") {
								return false;
							}
							return value == name;
						}
					).length;
					// Ensure that Only the PartitionKey or the SortKey has the name
					if (instances > 1) {
						// Should also be checked when creating the table
						throw new Error(
							`Both PartitionKey and SortKey have the same Name:${name}`
						);
					}
					return instances;
				})
				.flatMap(([indexName, value]) => {
					return [
						{
							name: indexName,
							type:
								value.type == IndexType.GSI
									? TABLE_TYPE.GSI
									: TABLE_TYPE.LSI,
							attributeType:
								value.partitionKey == name
									? ATTRIBUTE_TYPE.PARTITION
									: ATTRIBUTE_TYPE.SORT,
						},
					];
				});
			// Multiple Indexes can share Attributes
			// Some can have the same PartitionKey but different SortKeys
			// if (indexes.length > 1) {
			// 	// Should also be checked when creating the table
			// 		throw new Error(`Multiple Indexes have :${name}`)
			// }
			indexes.push(...secIndexes);
		}
		return indexes;
	}

	//#region Parse Methods
	// If a placeholder value is undefined throw
	public parsePrimaryKey(entity: any): [string, string | number][] {
		const {
			primaryKey: { partitionKey: pk, sortKey: sk },
			name,
		} = getMetadata<EntityProps>(entity, "entityStructure");
		const { partitionKey: pkName, sortKey: skName } =
			this.structure.primaryKey;
		const place = new Placeholder(entity);
		const values: [string, string | number][] = [
			[pkName, place.replaceString(pk)],
		];
		if (skName && !sk) {
			throw new Error(
				`Table requires SortKey which is not provided in Entity:${name}`
			);
		}
		if (!skName || !sk) {
			return values;
		}

		values.push([
			skName,
			typeof sk == "number" ? sk : place.replaceString(sk),
		]);
		return values;
	}

	private parseIndexKey(
		indexName: string,
		entity: any
	): [string, string | number][] {
		// primaryKey for LSI indexes
		const { name, indexes } = getMetadata<EntityProps>(
			entity,
			"entityStructure"
		);

		const place = new Placeholder(entity);

		if (indexes && indexes[indexName] && this.structure.indexes) {
			const { partitionKey: indexPk, sortKey: indexSk } =
				indexes[indexName];
			const {
				type,
				partitionKey: indexpkName,
				sortKey: indexskName,
			} = this.structure.indexes[indexName];
			const values: [string, string | number][] = [];

			switch (type) {
				case IndexType.GSI: {
					values.push([indexpkName, place.replaceString(indexPk)]);
					if (indexskName && !indexSk) {
						throw new Error(
							`GSI:${indexName} requires SortKey which is not provided in Entity:${name}`
						);
					}
					if (!indexskName || !indexSk) {
						return values;
					}
					values.push([
						indexskName,
						typeof indexSk == "number"
							? indexSk
							: place.replaceString(indexSk),
					]);
					return values;
				}
				case IndexType.LSI: {
					return values;
				}
			}
		}
		return [];
	}
	private parseUpdateIndexKey(
		indexName: string,
		entity: any
	): [string, string | number][] {
		// primaryKey for LSI indexes
		const { name, indexes } = getMetadata<EntityProps>(
			entity,
			"entityStructure"
		);

		const place = new Placeholder(entity);

		if (indexes && indexes[indexName] && this.structure.indexes) {
			const { partitionKey: indexPk, sortKey: indexSk } =
				indexes[indexName];
			const {
				type,
				partitionKey: indexpkName,
				sortKey: indexskName,
			} = this.structure.indexes[indexName];
			const values: [string, string | number][] = [];

			switch (type) {
				case IndexType.GSI: {
					if (
						!place.getPlaceholders(indexPk).some((value) => {
							return getMetadata<boolean>(entity, "const", value);
						})
					) {
						const val = place.replaceString(indexPk);
						if (val) {
							values.push([indexpkName, val]);
						}
					}
					if (indexskName && !indexSk) {
						throw new Error(
							`GSI:${indexName} requires SortKey which is not provided in Entity:${name}`
						);
					}
					if (!indexskName || !indexSk) {
						return values;
					}
					if (
						!place
							.getPlaceholders(indexSk.toString())
							.some((value) => {
								return getMetadata<boolean>(
									entity,
									"const",
									value
								);
							})
					) {
						if (typeof indexSk == "string") {
							const val = place.replaceString(indexSk);
							if (val) {
								values.push([indexskName, val]);
							}
						} else {
							values.push([indexskName, indexSk]);
						}
					}
					return values;
				}
				case IndexType.LSI: {
					return values;
				}
			}
		}
		return [];
	}

	private parseAttributes(entity: any): [string, DynamoDBValue][] {
		const attributes: [string, DynamoDBValue][] = [];
		const excludeAll = getMetadata<boolean>(entity, "excludeAll");
		if (excludeAll) {
			Object.entries(entity).forEach(([name, value]) => {
				if (
					// Reorder for optimization
					typeof value != "function" &&
					typeof value != "symbol" &&
					getMetadata<boolean>(entity, "include", name)
				) {
					attributes.push([name, value as any]);
				}
			});
		} else {
			Object.entries(entity).forEach(([name, value]) => {
				if (
					// Reorder for optimization
					typeof value != "function" &&
					typeof value != "symbol" &&
					!getMetadata<boolean>(entity, "exclude", name)
				) {
					attributes.push([name, value as any]);
				}
			});
		}
		return attributes;
	}

	// there's a way we can create a regex that can then extract values from the ones given

	private parseKeyObject(key: Key) {
		if (Object.entries(key).length == 0) {
			throw new Error("Key provided is empty");
		}
		const indexes = Object.entries(key).map(([name, value]) => {
			return this.findIndexFromKeyName(name);
		});
		if (indexes.length == 1) {
			return indexes[0];
		}
		const commonIndexes = indexes[0].filter((val) =>
			indexes[1].some(
				({ type, name }) => val.type == type && val.name == name
			)
		);
		if (commonIndexes.length > 1) {
			throw new Error(
				`Multiple indexes have the same AttributeNames as the PartitionKey and SortKey:${key}`
			);
		}
		if (commonIndexes.length == 0) {
			throw new Error(
				`No indexes match the AttributeNames provided:${key}`
			);
		}
		return commonIndexes;
	}

	private parseAllKeys(entity: any) {
		const keys: {
			[key: string]: string | number | { [key: string]: string | number };
		} = {};
		const {
			primaryKey: { partitionKey: pk, sortKey: sk },
			name,
			indexes,
		} = getMetadata<EntityProps>(entity, "entityStructure");
		const { partitionKey: pkName, sortKey: skName } =
			this.structure.primaryKey;
		if (skName && !sk) {
			throw new Error(
				`Table requires SortKey which is not provided in Entity:${name}`
			);
		}
		const place = new Placeholder(entity);
		keys[pkName] = place.replaceString(pk);
		if (skName && sk) {
			keys[skName] = typeof sk == "number" ? sk : place.replaceString(sk);
		}

		if (indexes) {
			const indexesKeys: [string, [string, string | number][]][] =
				Object.entries(indexes)
					.filter(([indexName, indexMap]) => {
						if (
							this.structure.indexes &&
							this.structure.indexes[indexName]
						) {
							return true;
						}
						return false;
					})
					.map(
						([indexName, indexMap]): [
							string,
							[string, string | number][]
						] => {
							const { sortKey: indexSk, partitionKey: indexPk } =
								indexMap;
							if (this.structure.indexes) {
								const {
									type,
									partitionKey: indexPkName,
									sortKey: indexSkName,
								} = this.structure.indexes[indexName];
								switch (type) {
									case IndexType.LSI:
									case IndexType.GSI: {
										if (indexSkName && !indexSk) {
											throw new Error(
												`GSI:${indexName} requires SortKey which is not provided in Entity:${name}`
											);
										}
										const index: [
											string,
											string | number
										][] = [
											[
												"partitionKey",
												place.replaceString(indexPk),
											],
										];
										if (!indexSk || !indexSkName) {
											return [indexName, index];
										}
										index.push([
											"sortKey",
											typeof indexSk == "number"
												? indexSk
												: place.replaceString(indexSk),
										]);
										return [indexName, index];
									}
								}
							}
							throw new Error("Index evaded filtering");
						}
					);
			Object.assign(
				keys,
				Object.fromEntries(
					indexesKeys.map(([name, keys]) => [
						name,
						Object.fromEntries(keys),
					])
				)
			);
		}
		return keys;
	}

	//#endregion

	public toDynamoMap(entity: any): DynamoDBMap {
		// match is the full text including {{}} and value is the actual value between the placeholder markers
		// Currently, there is no blocking of members, thus any member can be used in a placeholder
		const entityStructure = getMetadata(entity, "entityStructure");
		if (entityStructure) {
			const indexes: [string, string | number][] =
				Object.keys(this.structure.indexes ?? {}).flatMap((name) =>
					this.parseIndexKey(name, entity)
				) ?? [];

			// Primary Key > Index Keys > Attributes
			return Object.fromEntries([
				...this.parseAttributes(entity),
				...indexes,
				...this.parsePrimaryKey(entity),
			]);
		}

		return {};
	}

	// Filter out Excluded properties
	// Add Secondary Index Keys
	public toUpdateMap(entity: any): UpdateMap | null {
		const entityStructure = getMetadata(entity, "entityStructure");
		if (entityStructure) {
			const indexes: [string, string | number][] =
				Object.keys(this.structure.indexes ?? {}).flatMap((name) =>
					this.parseUpdateIndexKey(name, entity)
				) ?? [];

			const excludeAll = getMetadata<boolean>(entity, "excludeAll");

			let baseUpdate: Update;
			const entries = Object.entries(entity)
				.filter(([key, value]) => {
					if (excludeAll) {
						if (
							typeof value != "function" &&
							typeof value != "symbol" &&
							getMetadata<boolean>(entity, "include", key)
						) {
							return true;
						}
					} else {
						if (
							// Reorder for optimization
							typeof value != "function" &&
							typeof value != "symbol" &&
							!getMetadata<boolean>(entity, "exclude", key)
						) {
							return true;
						}
					}
					return false;
				})
				.filter(([key, value]) => {
					if (getMetadata<boolean>(entity, "const", key)) {
						return false;
					}
					return true;
				});
			if (!entries.length) {
				if (!indexes.length) {
					return {
						ExpressionAttributeValues: {},
						UpdateExpression: "",
						ExpressionAttributeNames: {},
					};
				}
				if (indexes[0] instanceof Update) {
					baseUpdate = indexes[0];
				} else {
					baseUpdate = new Update({
						type: UpdateOptions.set,
						value: indexes[0][1] as DynamoDBValue,
						key: indexes[0][0],
					});
				}
				indexes.shift();
				const update = reduce(
					indexes,
					(a, b) => {
						if (
							(b[1] as any) instanceof Update ||
							this.isUpdate(b[1])
						) {
							return a.and(b[1] as unknown as Update, b[0]);
						} else {
							return a.and(
								Update.set(b[1] as DynamoDBValue, b[0]),
								b[0]
							);
						}
					},
					baseUpdate
				);
				const {
					ExpressionAttributeValues,
					UpdateExpression,
					ExpressionAttributeNames,
				} = update.generateExpression();
				return {
					ExpressionAttributeValues,
					UpdateExpression,
					ExpressionAttributeNames,
				};
			}
			if (entries[0] instanceof Update) {
				baseUpdate = entries[0];
			} else {
				baseUpdate = new Update({
					type: UpdateOptions.set,
					value: entries[0][1] as DynamoDBValue,
					key: entries[0][0],
				});
			}
			entries.shift();
			const update = reduce(
				concat(entries, indexes),
				(a, b) => {
					if (b[1] instanceof Update || this.isUpdate(b[1])) {
						return a.and(b[1], b[0]);
					} else {
						return a.and(
							Update.set(b[1] as DynamoDBValue, b[0]),
							b[0]
						);
					}
				},
				baseUpdate
			);

			const {
				ExpressionAttributeValues,
				UpdateExpression,
				ExpressionAttributeNames,
			} = update.generateExpression();
			return {
				ExpressionAttributeValues,
				UpdateExpression,
				ExpressionAttributeNames,
			};
		}
		return null;
	}

	public toEntityInterface(
		map: DynamoDBMap,
		complete?: boolean
	): EntityInterfaceProps {
		return complete
			? {
					map,
					complete,
			  }
			: {
					map,
					...this.structure,
			  };
	}

	private isUpdate(update: any): update is Update {
		return (
			Boolean((update as Update).and) &&
			Boolean((update as Update).generateExpression)
		);
	}

	// public dynamoMapToEntity<T>(map: DynamoDBMap): T {

	// }
}

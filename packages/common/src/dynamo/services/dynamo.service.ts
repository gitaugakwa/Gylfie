import { BaseService, BaseServiceProps, State } from "../../base/services";
import {
	DynamoDBClient,
	DeleteTableCommand,
	CreateTableCommand,
	ListTablesCommand,
	ScanCommand,
	QueryCommand,
	PutItemCommand,
	UpdateItemCommand,
	AttributeDefinition,
	GlobalSecondaryIndex,
	LocalSecondaryIndex,
	KeySchemaElement,
	AttributeValue,
	BillingMode,
	DeleteItemCommand,
	ConsumedCapacity,
	ItemCollectionMetrics,
} from "@aws-sdk/client-dynamodb";
import { fromEnv } from "@aws-sdk/credential-providers";
import {
	DynamoDBValue,
	Update,
	Key,
	Conversion,
	UpdateRequestOptions,
	PutRequestOptions,
	GetRequestOptions,
	DynamoEntityConstructor,
	DynamoDBMap,
	TableProps,
	Table,
	IndexDefinition,
	AccessProperties,
	DeleteRequestOptions,
	Condition,
	isEntity,
} from "../models";
import {
	InternalServerError,
	LimitExceededError,
	GylfieError,
	RequestLimitExceededError,
	ResourceInUseError,
	ResourceNotFoundError,
} from "../../base/errors";
import {
	ConditionalCheckFailedError,
	ItemCollectionSizeLimitExceededError,
	ItemNotFoundError,
	ProvisionedThroughputExceededError,
	TransactionConflictError,
} from "../errors";
import { AccessPatternsClass, Entity } from "../decorators";
import {
	capitalize,
	fromPairs,
	isObject,
	map,
	merge,
	some,
	values,
} from "lodash";
import { CacheService, CacheServiceProps } from "../../cache/services";
import { DYNAMO_REGION, LOCAL_DYNAMO_PORT } from "../constants";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

export interface DynamoServiceProps extends BaseServiceProps {
	tables?: TableProps[];
	region?: string;
	port?: number;
	cache?: boolean | { duration?: number };
	cacheService?: CacheService;
}

interface CreateTableProvisionedProps {
	billing: "PROVISIONED";
	RCU: number;
	WCU: number;
}
interface CreateTablePPRProps {
	billing: "PAY_PER_REQUEST";
}

export type CreateTableProps = TableProps & {
	indexes?: {
		[key: string]: IndexDefinition;
	};
	attributes: {
		[keys: string]: "S" | "N";
	};
} & (CreateTableProvisionedProps | CreateTablePPRProps);

/**
 * Gylfie Dynamo Service
 * @decorator `@Injectable`
 * @param props - The properties required to create the service
 * @param configService - ConfigService provided through DI
 * @param logger - LoggerService provided through DI
 */
// @ServiceState(8000, "LOCAL_DYNAMO_PORT")
export class DynamoService extends BaseService {
	public dynamoDB!: DynamoDBClient;
	public dynamoDBDocument!: DynamoDBDocument;
	private port: number;
	public tables: { [key: string]: Table } = {};
	constructor(private props?: DynamoServiceProps) {
		super();
		this.port =
			props?.port ??
			(parseInt(process.env.LOCAL_DYNAMO_PORT ?? "") ||
				LOCAL_DYNAMO_PORT);
		props?.tables?.forEach((val) => {
			this.tables[val.name] = new Table(val);
		});

		if (this.isLocal()) {
			this.state = State.LOCAL;
			this.isLocalActive(this.port).then((active) => {
				if (active) {
					props?.logger?.info({
						message: "Local Is Active",
						state: this.state,
						service: "DynamoService",
					});
					this.dynamoDB = new DynamoDBClient({
						endpoint: `http://localhost:${this.port}`,
						region:
							props?.region ??
							process.env.DYNAMO_REGION ??
							DYNAMO_REGION,
						credentials: props?.credentials ?? fromEnv(),
					});
					props?.logger?.info({
						message: "DynamoDBClient Initialized",
						state: this.state,
						service: "DynamoService",
					});
					this.dynamoDBDocument = DynamoDBDocument.from(
						this.dynamoDB
					);
					props?.logger?.info({
						message: "DynamoDBDocument Initialized",
						state: this.state,
						service: "DynamoService",
					});
				} else {
					props?.logger?.warn({
						message: "Local Is INACTIVE",
						state: this.state,
						service: "DynamoService",
					});
					this.state = State.ONLINE;
					this.dynamoDB = new DynamoDBClient({
						region:
							props?.region ??
							process.env.DYNAMO_REGION ??
							DYNAMO_REGION,
						credentials: props?.credentials ?? fromEnv(),
					});

					props?.logger?.info({
						message: "DynamoDBClient Initialized",
						state: this.state,
						service: "DynamoService",
					});
					this.dynamoDBDocument = DynamoDBDocument.from(
						this.dynamoDB
					);
					props?.logger?.info({
						message: "DynamoDBDocument Initialized",
						state: this.state,
						service: "DynamoService",
					});
				}
			});
			return;
		}

		this.state = State.ONLINE;
		this.dynamoDB = new DynamoDBClient({
			region: props?.region ?? process.env.DYNAMO_REGION ?? DYNAMO_REGION,
			credentials: props?.credentials ?? fromEnv(),
		});

		props?.logger?.info({
			message: "DynamoDBClient Initialized",
			state: this.state,
			service: "DynamoService",
		});
		this.dynamoDBDocument = DynamoDBDocument.from(this.dynamoDB);
		props?.logger?.info({
			message: "DynamoDBDocument Initialized",
			state: this.state,
			service: "DynamoService",
		});
		return;
	}

	//#endregion

	private async tableExist(tableName: string): Promise<boolean> {
		return (await this.listTables()).includes(tableName);
	}

	//#region Service Dynamo Conversion Methods

	//#endregion

	// Developer methods

	/**
	 * Deletes a table
	 * @param {string} TableName - Name of the table to be deleted
	 * @returns Promise
	 */
	// @States(State.Local, State.Online)
	public async deleteTable(tableName: string): Promise<void> {
		try {
			await this.dynamoDB.send(
				new DeleteTableCommand({ TableName: tableName })
			);
		} catch (err) {
			throw this.errorHandler(err);
		}
	}
	/**
	 * Creates a table
	 * @param  {CreateTableProps} props - Properties to create a table
	 * @returns Promise
	 */
	// @States(State.Local, State.Online)
	async createTable(props: CreateTableProps): Promise<void> {
		try {
			let AttributeDefinitions: AttributeDefinition[] = [];
			let KeySchema: KeySchemaElement[] = [];
			let GSIs: GlobalSecondaryIndex[] = [];
			let LSIs: LocalSecondaryIndex[] = [];
			const BillingMode: BillingMode = props.billing ?? "PAY_PER_REQUEST";
			AttributeDefinitions = Conversion.parseAttributeDefinitions(
				props.attributes
			);
			KeySchema = Conversion.parseKeyDefinition(props.primaryKey);
			// Add indexes
			if (props.indexes) {
				GSIs = Object.entries(props.indexes)
					.filter(([name, val]) => val.type == "GSI")
					.flatMap(([name, val]) => {
						return {
							IndexName: name,
							ProvisionedThroughput: {
								ReadCapacityUnits: val.RCU,
								WriteCapacityUnits: val.WCU,
							},
							KeySchema: Conversion.parseKeyDefinition({
								partitionKey: val.partitionKey,
								sortKey: val.sortKey,
							}),
							Projection:
								typeof val.projection == "string"
									? { ProjectionType: val.projection }
									: {
											NonKeyAttributes:
												val.projection.attributes,
											ProjectionType: val.projection.type,
									  },
						};
					});
				LSIs = Object.entries(props.indexes)
					.filter(([name, val]) => val.type == "LSI")
					.flatMap(([name, val]) => {
						return {
							IndexName: name,
							ProvisionedThroughput: {
								ReadCapacityUnits: val.RCU,
								WriteCapacityUnits: val.WCU,
							},
							KeySchema: Conversion.parseKeyDefinition({
								partitionKey: val.partitionKey,
								sortKey: val.sortKey,
							}),
							Projection:
								typeof val.projection == "string"
									? { ProjectionType: val.projection }
									: {
											NonKeyAttributes:
												val.projection.attributes,
											ProjectionType: val.projection.type,
									  },
						};
					});
			}
			console.log({
				tableName: props.name,
				AttributeDefinitions,
				KeySchema,
				BillingMode,
				ProvisionedThroughput: {
					ReadCapacityUnits: (props as any).RCU,
					WriteCapacityUnits: (props as any).WCU,
				},
				GlobalSecondaryIndexes: GSIs.length ? GSIs : undefined,
				LocalSecondaryIndexes: LSIs.length ? LSIs : undefined,
			});
			if (props.billing == "PAY_PER_REQUEST") {
				await this.dynamoDB.send(
					new CreateTableCommand({
						TableName: props.name,
						AttributeDefinitions,
						KeySchema,
						BillingMode,
						GlobalSecondaryIndexes: GSIs.length ? GSIs : undefined,
						LocalSecondaryIndexes: LSIs.length ? LSIs : undefined,
					})
				);
			} else {
				await this.dynamoDB.send(
					new CreateTableCommand({
						TableName: props.name,
						AttributeDefinitions,
						KeySchema,
						BillingMode,
						ProvisionedThroughput: {
							ReadCapacityUnits: props.RCU,
							WriteCapacityUnits: props.WCU,
						},
						GlobalSecondaryIndexes: GSIs.length ? GSIs : undefined,
						LocalSecondaryIndexes: LSIs.length ? LSIs : undefined,
					})
				);
			}
			return;
		} catch (err) {
			throw this.errorHandler(err);
		}
	}
	/**
	 * Lists all tables
	 * @returns Promise
	 */
	// @States(State.Local, State.Hybrid, State.Online)
	async listTables(): Promise<string[]> {
		try {
			const { TableNames } = await this.dynamoDB.send(
				new ListTablesCommand({})
			);
			if (TableNames) {
				return TableNames;
			}
			return [];
		} catch (err) {
			throw this.errorHandler(err);
		}
	}
	/**
	 * Lists items in table
	 * @param  {string} TableName
	 * @returns Promise
	 */
	// @States(State.Local, State.Hybrid, State.Online)
	async listItems(tableName: string): Promise<DynamoDBMap[]> {
		try {
			const response = await this.dynamoDB.send(
				new ScanCommand({ TableName: tableName })
			);

			const items: { [key: string]: any }[] = [];

			if (response.Items) {
				response.Items.forEach((value, i) => {
					items[i] = unmarshall(
						value as {
							[key: string]: AttributeValue;
						}
					);
				});
			}

			return items;
		} catch (err) {
			throw this.errorHandler(err);
		}
	}

	//#region Public Methods
	/**
	 * Get item from Table
	 * @param  {DynamoEntityConstructor<T>} entity - entity to be returned
	 * @param  {string} TableName - Table to retrieve the item
	 * @param  {Key} key - Key to identify the Item being retrieved
	 * @param  {GetRequestOptions} options? - Optional request options
	 * @returns Promise
	 */
	// @States(State.Local, State.Hybrid, State.Online)
	// public async get<TReturn = any, TProps = any>(entity)
	public async get<TReturn = any, TProps = any>(
		props: {
			entity: DynamoEntityConstructor<TReturn> & AccessPatternsClass;
			tableName: string;
			accessPattern: string;
			placeholderValues?: DynamoDBMap;
		},
		options?: GetRequestOptions
	): Promise<{
		data: TReturn[];
		cacheHit?: boolean;
		consumedCapacity?: ConsumedCapacity;
		count?: number;
		lastEvaluatedKey?: DynamoDBMap;
	}>;
	public async get<TReturn = any, TProps = any>(
		props: {
			entity: DynamoEntityConstructor<TReturn>;
			tableName: string;
			key: Key;
			placeholderValues?: DynamoDBMap;
		},
		options?: GetRequestOptions
	): Promise<{
		data: TReturn[];
		cacheHit?: boolean;
		consumedCapacity?: ConsumedCapacity;
		count?: number;
		lastEvaluatedKey?: DynamoDBMap;
	}>;
	public async get<TReturn = any, TProps = any>(
		props: {
			entity: DynamoEntityConstructor<TReturn> & AccessPatternsClass;
			tableName: string;
			key?: Key;
			accessPattern?: string;
			placeholderValues?: DynamoDBMap;
		},
		options?: GetRequestOptions
	): Promise<{
		data: TReturn[];
		cacheHit?: boolean;
		consumedCapacity?: ConsumedCapacity;
		count?: number;
		lastEvaluatedKey?: DynamoDBMap;
	}> {
		let {
			tableName: TableName,
			entity,
			accessPattern,
			key,
			placeholderValues,
		} = props;
		const {
			cache = { ignoreCache: true },
			consistentRead,
			exclusiveStartKey,
			limit,
			returnConsumedCapacity = "TOTAL",
			scanIndexForward,
		} = options ?? {};
		try {
			let accessProps: AccessProperties;

			if (key) {
				accessProps = this.tables[TableName].getAccessProps(
					key,
					placeholderValues
				);
				// key = accessProps.key;
			} else if (accessPattern) {
				key = this.getAccessPatterns({ entity, accessPattern });
				accessProps = this.tables[TableName].getAccessProps(
					key,
					placeholderValues
				);
			} else {
				throw new Error("Access has not been defined");
			}
			key = accessProps.key;

			let rawData =
				!cache.ignoreCache && this.props?.cacheService?.get({ key });
			let response;

			if (!rawData) {
				const {
					ExpressionAttributeValues,
					KeyConditionExpression,
					IndexName,
				} = accessProps.values;

				response = await this.dynamoDB.send(
					new QueryCommand({
						TableName,
						IndexName,
						KeyConditionExpression,
						ExpressionAttributeValues,
						Limit: limit,
						ConsistentRead: consistentRead,
						ExclusiveStartKey: exclusiveStartKey
							? marshall(exclusiveStartKey, {
									removeUndefinedValues: true,
							  })
							: undefined,
						ReturnConsumedCapacity: returnConsumedCapacity,
						ScanIndexForward: scanIndexForward,
					})
				);
				const result = response.Items;
				if (result) {
					rawData = result;
					// Account for last evaluated Key
					await this.cache({
						key,
						value: result,
						tableName: TableName,
						cache,
					});
				}
			}

			let data: TReturn[] = [];
			if (rawData) {
				if (!isEntity(entity)) {
					throw new Error("entity provided is not Entity");
				}
				const entityIsEntity = entity;
				data = map(rawData, (val) => {
					return new entityIsEntity(
						this.tables[TableName].toEntityInterface(
							unmarshall(
								val as {
									[key: string]: AttributeValue;
								}
							)
						)
					) as unknown as TReturn;
				});
			}
			return {
				data,
				cacheHit: response ? false : true,
				consumedCapacity: response?.ConsumedCapacity,
				count: response?.Count,
				lastEvaluatedKey: response?.LastEvaluatedKey
					? unmarshall(response.LastEvaluatedKey)
					: undefined,
			};
		} catch (err) {
			throw this.errorHandler(err);
		}
	}

	public async cache(props: {
		key: Key;
		tableName: string;
		value: {
			[key: string]: AttributeValue;
		}[];
		cache?: boolean | { duration?: number };
	}) {
		const { key, value, cache, tableName } = props;
		const shouldCache = new Boolean(
			cache ?? this.tables[tableName].structure.cache ?? this.props?.cache
		);
		if (!shouldCache) {
			return null;
		}
		const cacheObject: { duration?: number } = merge(
			{},
			isObject(this.props?.cache) || {},
			isObject(this.tables[tableName].structure.cache) || {},
			isObject(cache) || {}
		);
		if (!this.props?.cacheService) {
			this.props?.logger?.warn({
				message: "CacheService has not been initialized",
				state: this.state,
				service: "DynamoService",
			});
		}
		return this.props?.cacheService?.add({
			key,
			value,
			duration: cacheObject.duration,
		});
	}

	/**
	 * Get all items in a Table
	 * @param  {string} TableName - Table from items to be retrived from
	 * @returns Promise
	 */
	// @States(State.Local, State.Online)
	public async scan(tableName: string): Promise<any> {
		try {
			return this.dynamoDB.send(
				new ScanCommand({ TableName: tableName })
			);
		} catch (err) {
			throw this.errorHandler(err);
		}
	}

	// Decorator for Local Or Online Only, no Hybrid
	/**
	 * Put new Item in the table
	 * @param  {DynamoEntityConstructor<T>} entity - entity to be returned
	 * @param  {string} TableName - Table to put the item
	 * @param  {T} item - Item to be put in the Table
	 * @param  {PutRequestOptions} options? - Optional put options
	 * @returns Promise
	 */
	// @States(State.Local, State.Online)
	public async put<TReturn = any>(
		props: {
			entity?: DynamoEntityConstructor<TReturn>;
			tableName: string;
			item: TReturn;
		},
		options?: PutRequestOptions
	): Promise<{
		data: TReturn | null;
		consumedCapacity?: ConsumedCapacity;
		itemCollectionMetrics?: ItemCollectionMetrics;
	}> {
		const {
			tableName: TableName,
			item,
			entity = (item as any).constructor,
		} = props;
		const {
			returnValues,
			returnConsumedCapacity = "TOTAL",
			returnItemCollectionMetrics = "SIZE",
		} = options ?? {};
		const Item = marshall(this.tables[TableName].toDynamoMap(item), {
			removeUndefinedValues: true,
		});

		const {
			// ExpressionAttributeValues,
			KeyConditionExpression: ConditionExpression,
			ExpressionAttributeNames,
		} = options?.condition?.generateExpression() ?? {};

		// Fix condition to be single line
		try {
			const response = await this.dynamoDB.send(
				new PutItemCommand({
					TableName,
					Item,
					ReturnValues: returnValues,
					ExpressionAttributeNames,
					// ExpressionAttributeValues,
					ConditionExpression,
					ReturnConsumedCapacity: returnConsumedCapacity,
					ReturnItemCollectionMetrics: returnItemCollectionMetrics,
				})
			);

			switch (returnValues) {
				default: {
					if (entity) {
						if (!isEntity(entity)) {
							throw new Error("entity provided is not Entity");
						}
						const entityIsEntity = entity;
						return {
							data: new entityIsEntity(
								this.tables[TableName].toEntityInterface(
									unmarshall(Item)
								)
							) as unknown as TReturn,
							consumedCapacity: response.ConsumedCapacity,
							itemCollectionMetrics:
								response.ItemCollectionMetrics,
						};
					}
				}
				case "ALL_OLD": {
					if (entity && response.Attributes) {
						if (!isEntity(entity)) {
							throw new Error("entity provided is not Entity");
						}
						const entityIsEntity = entity;
						return {
							data: new entityIsEntity(
								this.tables[TableName].toEntityInterface(
									unmarshall(response.Attributes)
								)
							) as unknown as TReturn,
							consumedCapacity: response.ConsumedCapacity,
							itemCollectionMetrics:
								response.ItemCollectionMetrics,
						};
					}
				}
				case "NONE": {
					return {
						data: null,
						consumedCapacity: response.ConsumedCapacity,
						itemCollectionMetrics: response.ItemCollectionMetrics,
					};
				}
			}
		} catch (err) {
			throw this.errorHandler(err);
		}
	}

	// Function should be able to take a whole object and only change the different attributes
	// and take an object with PK and SK and the changes and update only the attributes given
	// it would be better if the unction was passed the final object
	// placeholders for the partitionkey should be available
	/**
	 * Update item in table
	 * @param  {DynamoEntityConstructor<T>} entity - entity to be returned
	 * @param  {string} TableName - Table that will have Item updated
	 * @param  {T} item - The modified Item used to update the item
	 * @param  {UpdateRequestOptions} options? - Optional update options
	 * @returns Promise
	 */
	// @States(State.Local, State.Online)
	public async update<TReturn = any, TProps = any>(
		props: {
			entity?: DynamoEntityConstructor<TReturn>;
			tableName: string;
			item: TReturn;
		},
		options?: UpdateRequestOptions
	): Promise<{
		data: TReturn | null;
		consumedCapacity?: ConsumedCapacity;
		itemCollectionMetrics?: ItemCollectionMetrics;
	}> {
		const {
			tableName: TableName,
			item,
			entity = (item as any).constructor,
		} = props;
		// compare update times
		// UpdatedAt should be a base attribute that then can be assigned to a different Attribute

		// This is quite a naive implementation
		// A better way would be to have a property in entity interface for updates only
		// i.e You provide a map with the updated values
		// Then if the update flag is set,
		// The EntityInterface constructor will only set non const i.e !(Const()) attributes
		// This way, when updating, we are able to only set that values that changed
		// Though the problem comes with placeholders where when generating a key,
		// the undefined properties will still generate values that are malformed
		// There needs to be an option for if any of the placeholder values is undefined,
		// the value returned is undefined at least
		const {
			returnValues = "ALL_NEW",
			returnConsumedCapacity = "TOTAL",
			returnItemCollectionMetrics = "SIZE",
		} = options ?? {};
		try {
			const retrievedKey = fromPairs(
				this.tables[TableName].parsePrimaryKey(item)
			);
			const Key = marshall(retrievedKey, { removeUndefinedValues: true });

			const updateMap = this.tables[TableName].toUpdateMap(item);

			if (updateMap) {
				const {
					ExpressionAttributeValues,
					KeyConditionExpression: ConditionExpression,
					ExpressionAttributeNames,
					UpdateExpression,
				} = merge(
					{},
					updateMap,
					options?.condition?.generateExpression({
						ExpressionAttributeValues:
							updateMap.ExpressionAttributeValues,
						ExpressionAttributeNames:
							updateMap.ExpressionAttributeNames,
					})
				);
				// 	?? {
				// 	ExpressionAttributeValues:
				// 		updateMap.ExpressionAttributeValues,
				// };

				const request = this.dynamoDB.send(
					new UpdateItemCommand({
						TableName,
						Key,
						ReturnValues: returnValues,
						UpdateExpression,
						ConditionExpression,
						ExpressionAttributeValues,
						ExpressionAttributeNames,
						ReturnConsumedCapacity: returnConsumedCapacity,
						ReturnItemCollectionMetrics:
							returnItemCollectionMetrics,
					})
				);
				const response = await request;
				switch (returnValues) {
					case "ALL_NEW":
					case "ALL_OLD":
					case "UPDATED_NEW":
					case "UPDATED_OLD":
					default: {
						if (entity && response.Attributes) {
							if (!isEntity(entity)) {
								throw new Error(
									"entity provided is not Entity"
								);
							}
							const entityIsEntity = entity;
							return {
								data: new entityIsEntity(
									this.tables[TableName].toEntityInterface(
										unmarshall(response.Attributes)
									)
								) as unknown as TReturn,
								consumedCapacity: response.ConsumedCapacity,
								itemCollectionMetrics:
									response.ItemCollectionMetrics,
							};
						}
					}
					case "NONE": {
						return {
							data: null,
							consumedCapacity: response.ConsumedCapacity,
							itemCollectionMetrics:
								response.ItemCollectionMetrics,
						};
					}
				}
			}
			return { data: null };
		} catch (err) {
			throw this.errorHandler(err);
		}
	}

	/**
	 * Delete item in table
	 * @param  {DynamoEntityConstructor<T>} entity - entity to be returned
	 * @param  {string} TableName - Table that will have Item deleted
	 * @param  {T} item - The modified Item used to update the item
	 * @param  {DeleteRequestOptions} options? - Optional delete options
	 * @returns Promise
	 */
	// @States(State.Local, State.Online)
	public async delete<TReturn = any, TProps = any>(
		props: {
			entity?: DynamoEntityConstructor<TReturn> & AccessPatternsClass;
			tableName: string;
			key: Key;
			placeholderValues?: DynamoDBMap;
		},
		options?: DeleteRequestOptions
	): Promise<{
		data: TReturn | null;
		consumedCapacity?: ConsumedCapacity;
		itemCollectionMetrics?: ItemCollectionMetrics;
	}>;
	public async delete<TReturn = any, TProps = any>(
		props: {
			entity: DynamoEntityConstructor<TReturn> & AccessPatternsClass;
			tableName: string;
			accessPattern: string;
			placeholderValues?: DynamoDBMap;
		},
		options?: DeleteRequestOptions
	): Promise<{
		data: TReturn | null;
		consumedCapacity?: ConsumedCapacity;
		itemCollectionMetrics?: ItemCollectionMetrics;
	}>;
	public async delete<TReturn = any, TProps = any>(
		props: {
			entity?: DynamoEntityConstructor<TReturn> & AccessPatternsClass;
			tableName: string;
			key?: Key;
			accessPattern?: string;
			placeholderValues?: DynamoDBMap;
		},
		options?: DeleteRequestOptions
	): Promise<{
		data: TReturn | null;
		consumedCapacity?: ConsumedCapacity;
		itemCollectionMetrics?: ItemCollectionMetrics;
	}> {
		let {
			tableName: TableName,
			entity,
			key,
			accessPattern,
			placeholderValues,
		} = props;
		const {
			condition,
			returnValues = "ALL_OLD",
			returnConsumedCapacity = "TOTAL",
			returnItemCollectionMetrics = "SIZE",
		} = options ?? {};
		try {
			let accessProps: AccessProperties;
			if (entity && accessPattern) {
				const key = this.getAccessPatterns({ entity, accessPattern });
				accessProps = this.tables[TableName].getAccessProps(
					key,
					placeholderValues
				);
			} else if (key) {
				accessProps = this.tables[TableName].getAccessProps(
					key,
					placeholderValues
				);
			} else {
				throw new Error("Access has not been defined");
			}
			key = accessProps.key;

			if (some(values(key ?? {}), (val) => val instanceof Condition)) {
				throw new Error(
					"Access provided cannot be used to delete objects"
				);
			}

			const Key = marshall(key as DynamoDBMap, {
				removeUndefinedValues: true,
			});

			const {
				ExpressionAttributeValues,
				KeyConditionExpression: ConditionExpression,
			} = condition?.generateExpression() ?? {};

			const response = await this.dynamoDB.send(
				new DeleteItemCommand({
					TableName,
					Key,
					ReturnValues: returnValues,
					ExpressionAttributeValues,
					ConditionExpression,
					ReturnConsumedCapacity: returnConsumedCapacity,
					ReturnItemCollectionMetrics: returnItemCollectionMetrics,
				})
			);
			switch (returnValues) {
				case "ALL_OLD": {
					if (entity && response.Attributes) {
						if (!isEntity(entity)) {
							throw new Error("entity provided is not Entity");
						}
						const entityIsEntity = entity;
						return {
							data: new entityIsEntity(
								this.tables[TableName].toEntityInterface(
									unmarshall(response.Attributes)
								)
							) as unknown as TReturn,
							consumedCapacity: response.ConsumedCapacity,
							itemCollectionMetrics:
								response.ItemCollectionMetrics,
						};
					}
				}
				case "NONE":
				default: {
					return {
						data: null,
						consumedCapacity: response.ConsumedCapacity,
						itemCollectionMetrics: response.ItemCollectionMetrics,
					};
				}
			}
		} catch (err) {
			throw this.errorHandler(err);
		}
	}

	private getAccessPatterns(props: {
		entity: AccessPatternsClass;
		accessPattern: string;
	}): Key {
		const { entity, accessPattern } = props;
		const key = (entity.accessPatterns ??
			(entity.constructor as any).accessPatterns)?.[accessPattern];
		if (!key) {
			throw new Error("Access Path does not exist");
		}
		return key;
	}

	//#endregion

	protected errorHandler(err: any, inner?: GylfieError): GylfieError {
		switch ((err.name as string).replace("Exception", "")) {
			case "InternalServer": {
				return new InternalServerError(inner, err, "Dynamo");
			}
			case "LimitExceeded": {
				return new LimitExceededError(inner, err, "Dynamo");
			}
			case "ResourceInUse": {
				return new ResourceInUseError(inner, err, "Dynamo");
			}
			case "ResourceNotFound": {
				return new ResourceNotFoundError(inner, err, "Dynamo");
			}
			case "RequestLimitExceeded": {
				return new RequestLimitExceededError(inner, err, "Dynamo");
			}
			case "ProvisionedThroughputExceeded": {
				return new ProvisionedThroughputExceededError(inner, err);
			}
			case "ConditionalCheckFailed": {
				return new ConditionalCheckFailedError(inner, err);
			}
			case "ItemCollectionSizeLimitExceeded": {
				return new ItemCollectionSizeLimitExceededError(inner, err);
			}
			case "TransactionConflict": {
				return new TransactionConflictError(inner, err);
			}
		}
		return err;
	}
}

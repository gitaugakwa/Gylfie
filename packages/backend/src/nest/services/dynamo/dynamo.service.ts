import {
	AttributeDefinition,
	AttributeValue,
	BillingMode,
	ConsumedCapacity,
	CreateTableCommand,
	DeleteItemCommand,
	DeleteTableCommand,
	DynamoDBClient,
	GlobalSecondaryIndex,
	ItemCollectionMetrics,
	KeySchemaElement,
	ListTablesCommand,
	LocalSecondaryIndex,
	PutItemCommand,
	QueryCommand,
	ScanCommand,
	UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { fromEnv } from "@aws-sdk/credential-providers";
import {
	BaseService,
	BaseServiceProps,
	GylfieError,
	InternalServerError,
	LimitExceededError,
	RequestLimitExceededError,
	ResourceInUseError,
	ResourceNotFoundError,
	State,
} from "@gylfie/common/lib/base";
import {
	AccessPatternsClass,
	AccessProperties,
	Condition,
	ConditionalCheckFailedError,
	Conversion,
	DeleteRequestOptions,
	DynamoDBMap,
	DynamoEntityConstructor,
	DynamoServiceProps,
	GetRequestOptions,
	IndexDefinition,
	ItemCollectionSizeLimitExceededError,
	ItemNotFoundError,
	Key,
	ProvisionedThroughputExceededError,
	PutRequestOptions,
	RegularItem,
	Table,
	TableProps,
	TransactionConflictError,
	UpdateRequestOptions,
	LOCAL_DYNAMO_PORT,
} from "@gylfie/common/lib/dynamo";
import { Inject, Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { merge } from "lodash";
import { BaseNestService } from "../../base";
import { DYNAMO_PROPS } from "../../modules/dynamo/dynamo.constants";
import { NestLoggerService } from "../logger";
import { NestCacheService, NestCacheServiceProps } from "./cache.service";

export interface NestDynamoServiceProps extends DynamoServiceProps {
	tables: TableProps[];
	port?: number;
	cache?: NestCacheServiceProps;
}

export interface CreateTableProps extends TableProps {
	indexes?: {
		[key: string]: IndexDefinition;
	};
	attributes: {
		[keys: string]: "S" | "N";
	};
	billing?: "PROVISIONED" | "PAY_PER_REQUEST";
	RCU: number;
	WCU: number;
}

/**
 * Gylfie Dynamo Service
 * @decorator `@Injectable`
 * @param props - The properties required to create the service
 * @param configService - ConfigService provided through DI
 * @param logger - LoggerService provided through DI
 */
@Injectable()
// @ServiceState(8000, "LOCAL_DYNAMO_PORT")
export class NestDynamoService extends BaseNestService {
	public state: State;
	public dynamoDB: DynamoDBClient;
	private port: number;
	public tables: { [key: string]: Table } = {};
	constructor(
		@Inject(DYNAMO_PROPS)
		private readonly props: NestDynamoServiceProps,
		@Optional()
		protected configService?: ConfigService,
		@Optional()
		private logger?: NestLoggerService,
		@Optional()
		private cacheService?: NestCacheService
	) {
		super();
		// console.log(
		// 	this.configService?.get<number>("LOCAL_DYNAMO_PORT") ??
		// 		props.port ??
		// 		8000
		// );
		// console.log(
		// 	this.configService?.get<number>("LOCAL_DYNAMO_PORT") ||
		// 		props.port ||
		// 		8000
		// );
		this.port =
			props.port ??
			this.configService?.get<number>("LOCAL_DYNAMO_PORT") ??
			LOCAL_DYNAMO_PORT;
		props.tables.forEach((val) => {
			this.tables[val.name] = new Table(val);
		});
		if (this.isLocal()) {
			logger?.info("Is Currently in Local Environment");
			// the default local setup is Hybrid
			// Since it's async to determine if the port is in use
			this.dynamoDB = new DynamoDBClient({
				region: "eu-west-1",
				credentials: props.credentials ?? fromEnv(),
			});

			this.state = State.Hybrid;
			logger?.info("Local Instance of DynamoDB is ACTIVE");
			this.dynamoDB = new DynamoDBClient({
				endpoint: `http://localhost:${this.port}`,
				region: "eu-west-1",
				credentials: props.credentials ?? fromEnv(),
			});
			this.state = State.Local;
			return;
			// this.isLocalActive(this.port).then((active) => {
			// 	if (active) {
			// 	}
			// 	logger?.warn("Local Instance of DynamoDB is INACTIVE");
			// 	logger?.warn("Defauting to online instance");
			// 	logger?.warn("Only Read Only Actions will be Passed");
			// 	return;
			// });
			// return;
		}
		logger?.info("Online Instance of DynamoDB is ACTIVE");
		this.dynamoDB = new DynamoDBClient({
			region: "eu-west-1",
			credentials: props.credentials ?? fromEnv(),
		});
		this.state = State.Online;
		return;
	}

	//#endregion

	private async tableExist(TableName: string): Promise<boolean> {
		return (await this.listTables()).includes(TableName);
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
	public async deleteTable(TableName: string): Promise<void> {
		try {
			await this.dynamoDB.send(new DeleteTableCommand({ TableName }));
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
							Projection: {
								NonKeyAttributes: val.projection.attributes,
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
							Projection: {
								NonKeyAttributes: val.projection.attributes,
								ProjectionType: val.projection.type,
							},
						};
					});
			}
			console.log({
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
			});
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
	async listItems(TableName: string): Promise<DynamoDBMap[]> {
		try {
			const response = await this.dynamoDB.send(
				new ScanCommand({ TableName })
			);

			const items: { [key: string]: any }[] = [];

			if (response.Items) {
				response.Items.forEach((value, i) => {
					items[i] = Conversion.itemToValueObject(
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
	 * @param  {DynamoEntityConstructor<T>} Type - Type to be returned
	 * @param  {string} TableName - Table to retrieve the item
	 * @param  {Key} key - Key to identify the Item being retrieved
	 * @param  {GetRequestOptions} options? - Optional request options
	 * @returns Promise
	 */
	// @States(State.Local, State.Hybrid, State.Online)
	// public async get<TReturn extends RegularItem = any, TProps = any>(Type)
	public async get<TReturn extends RegularItem = any, TProps = any>(
		props: {
			Type: DynamoEntityConstructor<TReturn, TProps> &
				AccessPatternsClass;
			TableName: string;
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
	public async get<TReturn extends RegularItem = any, TProps = any>(
		props: {
			Type: DynamoEntityConstructor<TReturn, TProps>;
			TableName: string;
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
	public async get<TReturn extends RegularItem = any, TProps = any>(
		props: {
			Type: DynamoEntityConstructor<TReturn, TProps> &
				AccessPatternsClass;
			TableName: string;
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
		let { TableName, Type, accessPattern, key, placeholderValues } = props;
		try {
			let accessProps: AccessProperties;

			if (key) {
				accessProps = this.tables[TableName].getAccessProps(
					key,
					placeholderValues
				);
				key = accessProps.key;
			} else if (accessPattern) {
				key = this.getAccessPatterns({ Type, accessPattern });
				accessProps = this.tables[TableName].getAccessProps(
					key,
					placeholderValues
				);
				key = accessProps.key;
			} else {
				throw new Error("Access has not been defined");
			}

			let rawData =
				!(options?.cache?.ignoreCache == true) &&
				this.cacheService?.get({ key });
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
						Limit: options?.limit,
						ConsistentRead: options?.consistentRead,
						ExclusiveStartKey: options?.exclusiveStartKey
							? Conversion.valueToItemObject(
									options?.exclusiveStartKey
							  )
							: undefined,
						ReturnConsumedCapacity:
							options?.returnConsumedCapacity ?? "TOTAL",
						ScanIndexForward: options?.scanIndexForward,
					})
				);
				const result = response.Items;
				if (!result) {
					throw new ItemNotFoundError();
				}
				rawData = result;
				// Account for last evaluated Key
				this.cacheService?.add({
					key,
					value: result,
					duration: options?.cache?.duration,
				});
			}

			if (rawData && rawData.length) {
				return {
					data: rawData.map((val) => {
						return new Type(
							this.tables[TableName].toEntityInterface(
								Conversion.itemToValueObject(
									val as {
										[key: string]: AttributeValue;
									}
								)
							)
						);
					}),
					cacheHit: response ? false : true,
					consumedCapacity: response?.ConsumedCapacity,
					count: response?.Count,
					lastEvaluatedKey: response?.LastEvaluatedKey
						? Conversion.itemToValueObject(
								response.LastEvaluatedKey
						  )
						: undefined,
				};
			}
			throw new ItemNotFoundError();
			// return this.table[TableName].get<T>(Type, key);
		} catch (err) {
			throw this.errorHandler(err);
		}
	}
	/**
	 * Get all items in a Table
	 * @param  {string} TableName - Table from items to be retrived from
	 * @returns Promise
	 */
	// @States(State.Local, State.Online)
	public async scan(TableName: string): Promise<any> {
		try {
			return this.dynamoDB.send(new ScanCommand({ TableName }));
		} catch (err) {
			throw this.errorHandler(err);
		}
	}

	// Decorator for Local Or Online Only, no Hybrid
	/**
	 * Put new Item in the table
	 * @param  {DynamoEntityConstructor<T>} Type - Type to be returned
	 * @param  {string} TableName - Table to put the item
	 * @param  {T} item - Item to be put in the Table
	 * @param  {PutRequestOptions} options? - Optional put options
	 * @returns Promise
	 */
	// @States(State.Local, State.Online)
	public async put<TReturn extends RegularItem, TProps = any>(
		props: {
			Type?: DynamoEntityConstructor<TReturn, TProps>;
			TableName: string;
			item: TReturn;
		},
		options?: PutRequestOptions
	): Promise<{
		data: TReturn | null;
		consumedCapacity?: ConsumedCapacity;
		itemCollectionMetrics?: ItemCollectionMetrics;
	}> {
		const { TableName, Type, item } = props;
		// | Partial<T>
		const Item: {
			[key: string]: AttributeValue;
		} = Conversion.valueToItemObject(
			this.tables[TableName].toDynamoMap(item)
		);

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
					ReturnValues: options?.returnValues,
					ExpressionAttributeNames,
					// ExpressionAttributeValues,
					ConditionExpression,
					ReturnConsumedCapacity:
						options?.returnConsumedCapacity ?? "TOTAL",
					ReturnItemCollectionMetrics:
						options?.returnItemCollectionMetrics ?? "SIZE",
				})
			);
			if (!options?.returnValues || options.returnValues == "NONE") {
				return {
					data: null,
					consumedCapacity: response.ConsumedCapacity,
					itemCollectionMetrics: response.ItemCollectionMetrics,
				};
			}

			const result = response.Attributes;
			if (result) {
				// If there was an Item before in place
				if (Type) {
					return {
						data: new Type(
							this.tables[TableName].toEntityInterface(
								Conversion.itemToValueObject(
									result as { [key: string]: AttributeValue }
								)
							)
						),
						consumedCapacity: response.ConsumedCapacity,
						itemCollectionMetrics: response.ItemCollectionMetrics,
					};
				}
			}
			return {
				data: null,
				consumedCapacity: response.ConsumedCapacity,
				itemCollectionMetrics: response.ItemCollectionMetrics,
			};
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
	 * @param  {DynamoEntityConstructor<T>} Type - Type to be returned
	 * @param  {string} TableName - Table that will have Item updated
	 * @param  {T} item - The modified Item used to update the item
	 * @param  {UpdateRequestOptions} options? - Optional update options
	 * @returns Promise
	 */
	// @States(State.Local, State.Online)
	public async update<TReturn extends RegularItem = any, TProps = any>(
		props: {
			Type?: DynamoEntityConstructor<TReturn, TProps>;
			TableName: string;
			item: TReturn;
		},
		options?: UpdateRequestOptions
	): Promise<{
		data: TReturn | null;
		consumedCapacity?: ConsumedCapacity;
		itemCollectionMetrics?: ItemCollectionMetrics;
	}> {
		const { TableName, Type, item } = props;
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
		const ReturnValues = options?.returnValues || "ALL_NEW";
		try {
			const retrievedKey = Object.fromEntries(
				this.tables[TableName].parsePrimaryKey(item)
			);
			const Key: {
				[key: string]: AttributeValue;
			} = Conversion.valueToItemObject(retrievedKey);

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
						ReturnValues,
						UpdateExpression,
						ConditionExpression,
						ExpressionAttributeValues,
						ExpressionAttributeNames,
						ReturnConsumedCapacity:
							options?.returnConsumedCapacity ?? "TOTAL",
						ReturnItemCollectionMetrics:
							options?.returnItemCollectionMetrics ?? "SIZE",
					})
				);
				const response = await request;
				if (options?.returnValues == "NONE") {
					return {
						data: null,
						consumedCapacity: response.ConsumedCapacity,
						itemCollectionMetrics: response.ItemCollectionMetrics,
					};
				}
				// this is not the best example for this
				if (response.Attributes) {
					if (Type) {
						return {
							data: new Type(
								this.tables[TableName].toEntityInterface(
									Conversion.itemToValueObject(
										response.Attributes as {
											[key: string]: AttributeValue;
										}
									)
								)
							),
							consumedCapacity: response.ConsumedCapacity,
							itemCollectionMetrics:
								response.ItemCollectionMetrics,
						};
					}
				}
				return {
					data: null,
					consumedCapacity: response.ConsumedCapacity,
					itemCollectionMetrics: response.ItemCollectionMetrics,
				};
			}
			return { data: null };
		} catch (err) {
			throw this.errorHandler(err);
		}
	}

	/**
	 * Delete item in table
	 * @param  {DynamoEntityConstructor<T>} Type - Type to be returned
	 * @param  {string} TableName - Table that will have Item deleted
	 * @param  {T} item - The modified Item used to update the item
	 * @param  {DeleteRequestOptions} options? - Optional delete options
	 * @returns Promise
	 */
	// @States(State.Local, State.Online)
	public async delete<TReturn extends RegularItem = any, TProps = any>(
		props: {
			Type?: DynamoEntityConstructor<TReturn, TProps> &
				AccessPatternsClass;
			TableName: string;
			key: Key;
			placeholderValues?: DynamoDBMap;
		},
		options?: DeleteRequestOptions
	): Promise<{
		data: TReturn | null;
		consumedCapacity?: ConsumedCapacity;
		itemCollectionMetrics?: ItemCollectionMetrics;
	}>;
	public async delete<TReturn extends RegularItem = any, TProps = any>(
		props: {
			Type: DynamoEntityConstructor<TReturn, TProps> &
				AccessPatternsClass;
			TableName: string;
			accessPattern: string;
			placeholderValues?: DynamoDBMap;
		},
		options?: DeleteRequestOptions
	): Promise<{
		data: TReturn | null;
		consumedCapacity?: ConsumedCapacity;
		itemCollectionMetrics?: ItemCollectionMetrics;
	}>;
	public async delete<TReturn extends RegularItem = any, TProps = any>(
		props: {
			Type?: DynamoEntityConstructor<TReturn, TProps> &
				AccessPatternsClass;
			TableName: string;
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
		const { TableName, Type, key, accessPattern, placeholderValues } =
			props;
		try {
			let accessProps: AccessProperties;
			if (Type && accessPattern) {
				const key = this.getAccessPatterns({ Type, accessPattern });
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

			if (
				Object.values(accessProps.key ?? {}).some(
					(val) => val instanceof Condition
				)
			) {
				throw new Error(
					"Access provided cannot be used to delete objects"
				);
			}

			const Key = Conversion.valueToItemObject(
				accessProps.key as DynamoDBMap
			);

			const {
				ExpressionAttributeValues,
				KeyConditionExpression: ConditionExpression,
			} = options?.condition?.generateExpression() ?? {};

			const response = await this.dynamoDB.send(
				new DeleteItemCommand({
					TableName,
					Key,
					ReturnValues: options?.returnValues,
					ExpressionAttributeValues,
					ConditionExpression,
					ReturnConsumedCapacity:
						options?.returnConsumedCapacity ?? "TOTAL",
					ReturnItemCollectionMetrics:
						options?.returnItemCollectionMetrics ?? "SIZE",
				})
			);
			if (options?.returnValues == "NONE") {
				return {
					data: null,
					consumedCapacity: response.ConsumedCapacity,
					itemCollectionMetrics: response.ItemCollectionMetrics,
				};
			}
			// this is not the best example for this
			if (response.Attributes) {
				if (Type) {
					return {
						data: new Type(
							this.tables[TableName].toEntityInterface(
								Conversion.itemToValueObject(
									response.Attributes as {
										[key: string]: AttributeValue;
									}
								)
							)
						),
						consumedCapacity: response.ConsumedCapacity,
						itemCollectionMetrics: response.ItemCollectionMetrics,
					};
				}
			}
			return {
				data: null,
				consumedCapacity: response.ConsumedCapacity,
				itemCollectionMetrics: response.ItemCollectionMetrics,
			};
		} catch (err) {
			throw this.errorHandler(err);
		}
	}

	private getAccessPatterns(props: {
		Type: AccessPatternsClass;
		accessPattern: string;
	}): Key {
		const { Type, accessPattern } = props;
		const key = Type.accessPatterns?.[accessPattern];
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

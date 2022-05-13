import { Duration, DateTime } from "luxon";
import { EntityProps } from "../../dynamo/decorators";
import { DynamoDBMap } from "../../dynamo/models";

// CACHING IS AN OPTIMIZATION WE CURRENTLY DO NOT NEED

interface CacheElementProps {}

export class CacheElement {
	refreshedAt: DateTime;
	updatedAt?: DateTime;
	cacheTime?: Duration;
	private _data: any;

	constructor(initialData: any, props?: CacheElementProps) {
		this.updatedAt = initialData.updatedAt
			? DateTime.fromISO(initialData.updatedAt)
			: undefined;
		this.refreshedAt = DateTime.utc();
		const entityStructure = (initialData as any)
			._gylfie_entityStructure as EntityProps;
		// if (entityStructure.cacheTime) {
		// 	if (typeof entityStructure.cacheTime == "number") {
		// 		this.cacheTime = Duration.fromObject({
		// 			seconds: entityStructure.cacheTime,
		// 		});
		// 	} else {
		// 		this.cacheTime = entityStructure.cacheTime;
		// 	}
		// }
		if (props) {
		}
		this._data = initialData;
	}

	public async getData(): Promise<DynamoDBMap | { _cache_expired: true }> {
		if (this.cacheTime) {
			const isValid =
				this.refreshedAt.diffNow().as("seconds") <=
				this.cacheTime.as("seconds");
			if (isValid) {
				return this._data;
			}
			return { _cache_expired: true };
			// Refresh cache
		}
		return this._data;
	}

	public async setData(newData: DynamoDBMap): Promise<DynamoDBMap> {
		this._data = newData;
		this.refreshedAt = DateTime.utc();
		this.updatedAt = newData.updatedAt
			? DateTime.fromISO(newData["updatedAt"] as string)
			: undefined;
		return this._data;
	}
}

interface GetOptions {}
interface PutOptions {
	getNew?(): Promise<any>;
}

export class Cache {
	private access: {
		[key: string]: CacheElement | { [key: string]: CacheElement };
	} = {};
	// The thing is,
	// imagine we request a bunch of stuff from dynamo,through a query, e.g a whole pk like Items
	// This will return all items and if we were replicating the Dynamodb style,
	// we would be storing duplicate data for different requests, e.g
	// 		Item - ItemID
	// 		ItemID - item
	// 		These all store the same data
	// so the data being stored would best be replicating the Primary Table
	// so it's up to the cache to interpret requests

	// Now we come to the problem that is similar to DynamoDB
	// In Dynamo, we could have different access patterns for no additional cost.
	// But in aws Lambda, we pay for the memory.
	// This is thus going to be a problem.
	// If someone goes to the items page, they will be met with a long load time
	// since the request will have to be cached before returning
	// and if subsequent requests aren't using this cache, then why have it
	// I would argue that the cache would be best for queries that are the most accessed
	//
	// Since js is a reference
	// we can not assign with = for full objects
	private items: { [key: string]: CacheElement } = {};

	constructor(
		private cacheTime?: number | Duration // Time in seconds
	) {}

	// Will store the value after it has been parsed into a DynamoDBMap
	private isCacheElement(elem: any): elem is CacheElement {
		return elem.refreshedAt;
	}
	// private isExpired(elem: any): boolean {
	// 	return elem._cache_expired;
	// }
	public async get(
		partitionKey: string,
		sortKey?: string | number,
		options?: GetOptions
	): Promise<
		(
			| DynamoDBMap
			| {
					_cache_expired: true;
					partitionKey: string;
					sortKey?: string | number;
			  }
		)[]
	> {
		const partition = this.access[partitionKey];
		if (partition) {
			if (sortKey) {
				if (this.isCacheElement(partition)) {
					throw new Error("Partition does not have a sortKey");
				}
				const sort =
					partition[
						typeof sortKey == "number"
							? sortKey.toString()
							: sortKey
					];
				if (sort) {
					const data = await sort.getData();
					if (data._cache_expired) {
						return [
							{ _cache_expired: true, partitionKey, sortKey },
						];
					}
					return [data];
					return Promise.all([sort.getData()]);
				}
				return [];
			}
			if (this.isCacheElement(partition)) {
				const data = await partition.getData();
				if (data._cache_expired) {
					return [
						{
							_cache_expired: true,
							partitionKey,
						},
					];
				}
				return [data];
			}
			return Promise.all(
				Object.entries(partition).map(async ([name, value]) => {
					const data = await value.getData();
					if (data._cache_expired) {
						return {
							_cache_expired: true,
							partitionKey,
							sortKey: name,
						};
					}
					return data;
				})
			);
		}
		return [];
	}

	public async put(
		access: { partitionKey: string; sortKey?: string | number },
		item: DynamoDBMap | CacheElement,
		options?: PutOptions
	): Promise<CacheElement> {
		if (this.isCacheElement(item)) {
			return item;
		}

		if (access.sortKey) {
			if (this.access[access.partitionKey]) {
				if (this.isCacheElement(this.access[access.partitionKey])) {
					throw new Error(
						"Partition is CacheElement yet is provided Key"
					);
				}
			} else {
				this.access[access.partitionKey] = {};
			}
			return ((
				this.access[access.partitionKey] as {
					[key: string]: CacheElement;
				}
			)[access.sortKey] = new CacheElement(item));
		}
		return (this.access[access.partitionKey] = new CacheElement(item));
	}

	// This should also take into consideration the tables structure
	// So with the index keys, each of the

	// the get
	// public get() {}
}

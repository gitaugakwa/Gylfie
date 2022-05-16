import { CacheGetProps } from "../../cache/services";
import { Condition } from "./condition.model";
import { DynamoDBMap } from "./types";

interface RequestOptions {
	returnValues?:
		| "NONE"
		| "ALL_OLD"
		| "ALL_NEW"
		| "UPDATED_OLD"
		| "UPDATED_NEW";
	returnConsumedCapacity?: "INDEXES" | "TOTAL" | "NONE";
	// fullObject?: boolean;
}

export interface PutRequestOptions extends RequestOptions {
	returnValues?: "NONE" | "ALL_OLD";
	returnItemCollectionMetrics?: "SIZE" | "NONE";
	condition?: Condition;
}
export interface QueryRequestOptions
	extends Omit<RequestOptions, "returnValues"> {
	limit?: number;
	consistentRead?: boolean;
	exclusiveStartKey?: { [key: string]: string | number };
	scanIndexForward?: boolean;
	cache?: CacheGetProps & { ignoreCache: boolean };
	filter?: Condition;
	// placeholderValues?: DynamoDBMap;
}
export interface UpdateRequestOptions extends RequestOptions {
	returnItemCollectionMetrics?: "SIZE" | "NONE";
	condition?: Condition;
}

export interface DeleteRequestOptions extends RequestOptions {
	returnValues?: "NONE" | "ALL_OLD";
	returnItemCollectionMetrics?: "SIZE" | "NONE";
	condition?: Condition;
	// placeholderValues?: DynamoDBMap;
}

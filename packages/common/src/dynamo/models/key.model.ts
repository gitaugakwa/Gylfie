import { Condition } from "./condition.model";
import { INDEX_TYPE } from "./index.model";
import { DynamoDBValue } from "./types";

// Definition

export type PrimaryKeyDefinition =
	| HashPrimaryKeyDefinition
	| PartitionPrimaryKeyDefinition;

export interface HashPrimaryKeyDefinition {
	HASH: string;
	RANGE?: string;
}
export interface PartitionPrimaryKeyDefinition {
	partitionKey: string;
	sortKey?: string;
}

export interface IndexKeyDefinition extends PartitionPrimaryKeyDefinition {
	type: INDEX_TYPE;
}

//

type SortKeyValue = string | number | Condition;

// Key: Name of the Attribute for the Table
// Value: The value of the attribute
// Should at least have one value -> PartitionKey
// Optionally can have a second that will be the SortKey
export interface Key {
	[key: string]: string | number | Condition;
}

// export interface Key {
// 	HASH: { [key: string]: string | number } ;
// 	SORT?: { [key: string]: SortKeyValue };
// }

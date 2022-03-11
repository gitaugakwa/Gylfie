// Binary Related attributes are ignored
export type DynamoDBValue =
	| string
	| number
	| boolean
	| null
	| undefined
	| string[]
	| number[]
	| (string | number)[]
	| { [key: string]: DynamoDBValue };

export type DynamoDBMap = {
	[key: string]: DynamoDBValue;
	// This should be fine especially since most dynamoDBMaps are generated from convert
	// this will require a lot of rewriting;
	// isDynamoDBMap: true;
};

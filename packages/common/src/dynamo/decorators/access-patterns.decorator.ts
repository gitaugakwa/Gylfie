import { Condition, DynamoDBMap, IndexType, Key } from "../models";
import { Duration } from "luxon";
import { ClassDecorator } from "../../base/decorators";

// export interface IndexValue {
// 	type: INDEX_TYPE;
// 	partitionKey: string;
// 	sortKey?: string | number;
// }

export interface AccessPatternKey {
	[key: string]:
		| string
		| number
		| Condition
		| ((placeholderValues: DynamoDBMap) => string | number | Condition);
}

export interface AccessPatternsProps {
	[path: string]: AccessPatternKey;
}

export type AccessPatternsClass = { accessPatterns?: AccessPatternsProps };

export function AccessPatterns<T extends { new (...args: any[]): any }>(
	props?: AccessPatternsProps
) {
	return (constructor: T) => {
		return class extends constructor implements AccessPatternsClass {
			static accessPatterns = props;
		};
	};

	// return ClassDecorator("accessPathsStructure", props, {
	// 	enumerable: false,
	// 	configurable: false,
	// 	writable: false,
	// });
}

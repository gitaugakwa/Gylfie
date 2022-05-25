import { Condition, DynamoDBMap, DynamoDBValue, IndexType } from "../models";
import { Duration } from "luxon";
import { ClassDecorator } from "../../base/decorators";
import { entries } from "lodash";
import {
	EntityInstance,
	EntityInterfaceProps,
	EntityMixin,
} from "../models/entity.model";

interface IndexValuePartitionKeyResult {
	value: string;
	shouldUpdate?: boolean;
}
interface IndexValueSortKeyResult {
	value: string | number;
	shouldUpdate?: boolean;
}

export interface IndexValue<T extends any> {
	type: IndexType;
	partitionKey:
		| string
		| IndexValuePartitionKeyResult
		| ((instance: T) => string | IndexValuePartitionKeyResult);
	sortKey?:
		| string
		| number
		| IndexValueSortKeyResult
		| ((instance: T) => string | number | IndexValueSortKeyResult);
}

export interface EntityProps<T extends any> {
	name: string;
	primaryKey: {
		partitionKey: string;
		sortKey?: string;
	};
	condition?: Condition;
	indexes?: {
		[key: string]: IndexValue<T>;
	};
	attributes?: {
		[key: string]: {
			name?: string;
			type: string; // fix
		};
	};
	table?: string;
}

// We could also technically make this static thus is not instantiated every construction
export function Entity<T extends any>(props?: EntityProps<T>) {
	return function DecoratorFunction<T extends { new (...args: any[]): {} }>(
		constructor: T
	) {
		return EntityMixin(
			ClassDecorator("entityStructure", props, {
				enumerable: false,
				configurable: false,
				writable: false,
				static: true,
			})(constructor)
		);
	};
}

import { Condition, DynamoDBMap, DynamoDBValue, IndexType } from "../models";
import { Duration } from "luxon";
import { ClassDecorator } from "../../base/decorators";
import { entries } from "lodash";
import {
	EntityInstance,
	EntityInterfaceProps,
	EntityMixin,
} from "../models/entity.model";

export interface IndexValue {
	type: IndexType;
	partitionKey: string;
	sortKey?: string | number;
}

export interface EntityProps {
	name: string;
	primaryKey: {
		partitionKey: string;
		sortKey?: string | number;
	};
	condition?: Condition;
	indexes?: {
		[key: string]: IndexValue;
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
export function Entity(props?: EntityProps) {
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

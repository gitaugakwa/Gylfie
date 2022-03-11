import { Condition, INDEX_TYPE } from "../models";
import { Duration } from "luxon";
import { ClassDecorator } from "../../base/decorators";

export interface IndexValue {
	type: INDEX_TYPE;
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
	return ClassDecorator("entityStructure", props, {
		enumerable: false,
		configurable: false,
		writable: false,
	});
}

import "reflect-metadata";
import { omit } from "lodash";
import { isEntityInterface } from "../../dynamo";

export function ClassDecorator(
	metadataName: string,
	metadataValue: any,
	options?: {
		enumerable?: boolean;
		configurable?: boolean;
		writable?: boolean;
		get?(): any;
		set?(): any;
		static?: boolean;
	}
) {
	return function DecoratorFunction<T extends { new (...args: any[]): {} }>(
		constructor: T
	) {
		if (options?.static) {
			return class extends constructor {
				static _gylfie_entityStructure = metadataValue;
			};
		}
		// The scope for this is larger
		Object.defineProperty(
			constructor.prototype,
			`_gylfie_${metadataName}`,
			{
				value: metadataValue,
				...omit(options, "static"),
			}
		);
		return constructor;
	};
}

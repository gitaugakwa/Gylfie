import "reflect-metadata";
export function ClassDecorator(
	metadataName: string,
	metadataValue: any | Promise<any>,
	options?: {
		enumerable?: boolean;
		configurable?: boolean;
		writable?: boolean;
		get?(): any;
		set?(): any;
	}
) {
	return function <T extends { new (...args: any[]): {} }>(constructor: T) {
		// return class extends constructor {
		// 	_gylfie_entityStructure = props;
		// }
		// The scope for this is larger
		Promise.resolve(metadataValue).then((value) => {
			Object.defineProperty(
				constructor.prototype,
				`_gylfie_${metadataName}`,
				{
					value,
					...options,
				}
			);
		});
	};
}

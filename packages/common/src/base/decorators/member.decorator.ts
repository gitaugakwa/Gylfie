import "reflect-metadata";
export function MemberDecorator(
	metadata: { [key: string]: any },
	...decorators: PropertyDecorator[]
) {
	return function (target: any, name: string) {
		// Other Decorators
		for (const decorator of decorators) {
			decorator(target, name);
		}
		Object.entries(metadata).forEach(([metadataName, metadataValue]) => {
			Reflect.defineMetadata(
				`_gylfie_${metadataName}`,
				metadataValue,
				target,
				name
			);
		});
	};
}

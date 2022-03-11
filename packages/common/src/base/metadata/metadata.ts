import "reflect-metadata";
export function getMetadata<T = any>(
	entity: any,
	property: string,
	name?: string
): T {
	if (name) {
		return Reflect.getMetadata(`_gylfie_${property}`, entity, name);
	}
	return entity[`_gylfie_${property}`];
}

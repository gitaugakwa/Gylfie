export interface FlagProperties {
	flag: string;
	alias?: string;
	properties?: { name: string; required?: boolean }[];
}

export abstract class Factory {
	protected parseProperty(prop: {
		name: string;
		required?: boolean;
	}): string {
		if (prop.required) {
			return `<${prop.name}>`;
		}
		return `[${prop.name}]`;
	}
}

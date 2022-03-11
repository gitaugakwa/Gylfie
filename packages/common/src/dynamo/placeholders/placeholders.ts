import { merge, cloneDeep } from "lodash";
import { DynamoDBMap, DynamoDBValue, Update } from "../models";

export enum UndefinedBehavior {
	BLANK = "blank",
	PLACEHOLDER = "placeholder",
	UNDEFINED = "undefined",
}

interface ReplacePlaceholdersOptions {
	undefinedBehavior?: UndefinedBehavior;
}

const defaultReplacePlaceholdersOptions: ReplacePlaceholdersOptions = {
	undefinedBehavior: UndefinedBehavior.BLANK,
};

export class Placeholder {
	constructor(
		private values: { [key: string]: DynamoDBValue | Update },
		private options?: ReplacePlaceholdersOptions
	) {
		const def = cloneDeep(defaultReplacePlaceholdersOptions);
		options = merge(def, options ?? defaultReplacePlaceholdersOptions);
	}
	public static hasPlaceholder(value: string): boolean {
		return RegExp(/{{(\w+)}}/g).test(value);
	}
	public hasPlaceholder(value: string) {
		return Placeholder.hasPlaceholder(value);
	}
	public static getPlaceholders(value: string): string[] {
		return [...value.matchAll(RegExp(/{{(\w+)}}/g))].flatMap((val) => val);
		// return .matchAll(value) ?? [];
	}
	public getPlaceholders(value: string) {
		return Placeholder.getPlaceholders(value);
	}

	public replace(newValues?: DynamoDBMap): {
		[key: string]: DynamoDBValue | Update;
	} {
		Object.keys(this.values).forEach((name) => {
			this.replaceOne(name);
		});
		return this.values;
	}

	public static replace(
		values: DynamoDBMap,
		options?: ReplacePlaceholdersOptions
	) {
		return new Placeholder(values, options).replace();
	}

	// this method makes it that the placeholder value can be a placeholder
	// Thus if the value provided is actually a placeholder
	// this could be a point of attack
	// Say the api call one of the values is a placeholder value
	// e.g. name = "{{secretValue}}" e.g. bank details like credit card number
	// this would allow someone to update the value of name to a value that should no be exposed
	// we need a way to mark a value as non-placeholder-able
	// We can have 3 levels
	// NONE - this value cannot be used in a placeholder
	// NESTED - this value cannot be used in a nested placeholder i.e. val => name => firstName will not be allowed
	// ALL - this value can be used
	// Also, a filter or class validator that filters api data to ensure it does not include a placeholder
	//
	// I would essentially put this to the implementation to handle it
	public replaceOne(name: string) {
		const value = this.values[name];
		if (typeof value == "string" && this.hasPlaceholder(value)) {
			const placeValues = Object.fromEntries(
				this.getPlaceholders(value)
					.filter((valueHolder) => valueHolder != name)
					.map((valueHolder) => [
						valueHolder,
						this.replaceOne(valueHolder),
					])
			);
			value.replace(/{{(\w+)}}/g, (match, val) => {
				const placeValue = placeValues[val];
				if (placeValue instanceof Update) {
					const value = placeValue.value;
					switch (typeof value) {
						case "string": {
							return value;
						}
						case "number": {
							return value.toString();
						}
						case "undefined":
						default: {
							return this.handleUndefined(match);
						}
					}
				}
				if (placeValue) {
					switch (typeof placeValue) {
						case "string": {
							return placeValue;
						}
						case "number": {
							return placeValue.toString();
						}
						case "undefined":
						default: {
							return this.handleUndefined(match);
						}
					}
				}
				return this.handleUndefined(match);
			});

			this.values[name] = value;
		}
		return value;
	}

	public static replaceOne(
		name: string,
		values: DynamoDBMap,
		options?: ReplacePlaceholdersOptions
	) {
		return new Placeholder(values, options).replaceOne(name);
	}

	public replaceString(value: string): string {
		if (this.hasPlaceholder(value)) {
			const placeValues = Object.fromEntries(
				this.getPlaceholders(value).map((valueHolder) => [
					valueHolder,
					this.replaceOne(valueHolder),
				])
			);
			return value.replace(/{{(\w+)}}/g, (match, val) => {
				const placeValue = placeValues[val];
				if (placeValue) {
					switch (typeof placeValue) {
						case "string": {
							return placeValue;
						}
						case "number": {
							return placeValue.toString();
						}
						case "undefined":
						default: {
							return this.handleUndefined(match);
						}
					}
				}
				return this.handleUndefined(match);
			});
		}
		// console.log(value);
		return value;
	}

	public static replaceString(
		value: string,
		values: DynamoDBMap,
		options?: ReplacePlaceholdersOptions
	) {
		return new Placeholder(values, options).replaceString(value);
	}

	private handleUndefined(match: string): string {
		switch (this.options?.undefinedBehavior) {
			default:
			case UndefinedBehavior.BLANK: {
				return "";
			}
			case UndefinedBehavior.PLACEHOLDER: {
				return match;
			}
			case UndefinedBehavior.UNDEFINED: {
				return "undefined";
			}
		}
	}

	// private replace
}

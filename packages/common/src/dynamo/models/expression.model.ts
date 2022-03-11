import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { merge } from "lodash";
import { Conversion } from "./conversion.model";

export interface ExpressionProps {
	attributeValues?: {
		[key: string]: AttributeValue;
	};
	attributeNames?: {
		[key: string]: string;
	};
	lastGeneratedValueHolder?: string;
	lastGeneratedNameHolder?: string;
}

export class Expression {
	protected attributeValues: {
		[key: string]: AttributeValue;
	};
	protected attributeNames: {
		[key: string]: string;
	};
	protected lastGeneratedValueHolder?: string;
	protected lastGeneratedNameHolder?: string;

	constructor(props: ExpressionProps) {
		this.attributeValues = props.attributeValues
			? props.attributeValues
			: {};
		this.attributeNames = props.attributeNames ? props.attributeNames : {};
		this.lastGeneratedValueHolder = props.lastGeneratedValueHolder;
		this.lastGeneratedNameHolder = props.lastGeneratedNameHolder;
	}

	mergeValues(attributeValues: { [key: string]: AttributeValue }) {
		merge(this.attributeValues, attributeValues);
	}
	mergeNames(attributeNames: { [key: string]: string }) {
		merge(this.attributeNames, attributeNames);
	}

	setAttributeValues(attributeValues: { [key: string]: AttributeValue }) {
		return (this.attributeValues = attributeValues);
	}
	setAttributeNames(attributeNames: { [key: string]: string }) {
		return (this.attributeNames = attributeNames);
	}

	getAttributeValues() {
		return this.attributeValues;
	}
	getAttributeNames() {
		return this.attributeNames;
	}

	setValue(value: AttributeValue, valueHolder?: string) {
		if (valueHolder) {
			valueHolder = this.getNextValueHolder(valueHolder);
		} else {
			valueHolder = this.getValueHolder();
		}
		this.attributeValues[valueHolder] = value;
		return valueHolder;
	}

	setName(name: string, nameHolder?: string) {
		if (nameHolder) {
			nameHolder = this.getNextNameHolder(nameHolder);
		} else {
			nameHolder = this.getNameHolder();
		}
		this.attributeNames[nameHolder] = name;
		return nameHolder;
	}

	private getNextValueHolder(valueHolder: string, instance?: number): string {
		if (this.isValueHolderTaken(`${valueHolder}${instance || ""}`)) {
			return this.getNextValueHolder(
				valueHolder,
				instance ? ++instance : 1
			);
		}
		return `${valueHolder}${instance || ""}`;
	}

	private isValueHolderTaken(valueHolder: string): boolean {
		return Boolean(this.attributeValues[valueHolder]);
	}

	private getValueHolder(): string {
		if (this.lastGeneratedValueHolder) {
			let previousValue = parseInt(
				this.lastGeneratedValueHolder.split(":value")[1]
			);
			let nextValue = previousValue + 1;
			if (this.isValueHolderTaken(`:value${nextValue || ""}`)) {
				this.lastGeneratedValueHolder = `:value${nextValue || ""}`;
				return this.getValueHolder();
			}
			this.lastGeneratedValueHolder = `:value${nextValue || ""}`;
			return this.lastGeneratedValueHolder;
		} else {
			if (this.isValueHolderTaken(":value1")) {
				this.lastGeneratedValueHolder = ":value1";
				return this.getValueHolder();
			}
			this.lastGeneratedValueHolder = ":value1";
			return this.lastGeneratedValueHolder;
		}
	}

	private getNextNameHolder(nameHolder: string, instance?: number): string {
		if (this.isNameHolderTaken(`${nameHolder}${instance || ""}`)) {
			return this.getNextNameHolder(
				nameHolder,
				instance ? ++instance : 1
			);
		}
		return `${nameHolder}${instance || ""}`;
	}

	private isNameHolderTaken(nameHolder: string): boolean {
		return Boolean(this.attributeNames[nameHolder]);
	}

	private getNameHolder(): string {
		if (this.lastGeneratedNameHolder) {
			let previousName = parseInt(
				this.lastGeneratedNameHolder.split("#name")[1]
			);
			let nextName = previousName + 1;
			if (this.isNameHolderTaken(`#name${nextName || ""}`)) {
				this.lastGeneratedNameHolder = `#name${nextName || ""}`;
				return this.getNameHolder();
			}
			this.lastGeneratedNameHolder = `#name${nextName || ""}`;
			return this.lastGeneratedNameHolder;
		} else {
			if (this.isNameHolderTaken("#name1")) {
				this.lastGeneratedNameHolder = "#name1";
				return this.getNameHolder();
			}
			this.lastGeneratedNameHolder = "#name1";
			return this.lastGeneratedNameHolder;
		}
	}
}

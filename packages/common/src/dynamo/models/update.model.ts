import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { UpdateEventSourceMappingCommand } from "@aws-sdk/client-lambda";
import { compact, concat, merge, remove } from "lodash";
import { eventNames } from "process";
import { Conversion } from "./conversion.model";
import { Expression, ExpressionProps } from "./expression.model";
import { DynamoDBValue, DynamoDBMap } from "./types";

interface UpdateItem {
	path: string;
	beforeValue: any;
	afterValue: any;
}

export interface UpdateMap {
	UpdateExpression: string;
	// ConditionExpression: string;
	ExpressionAttributeValues: {
		[key: string]: AttributeValue;
	};
	ExpressionAttributeNames: { [key: string]: string };
}

export enum UpdateOptions {
	add = "ADD",
	delete = "DELETE",
	set = "SET",
	remove = "REMOVE",
	list_append = "SET * = list_append(*,*)",
	if_not_exists = "SET * = if_not_exists(*,*)",
}

const priorityOrder = [
	UpdateOptions.add,
	UpdateOptions.set,
	UpdateOptions.list_append,
	UpdateOptions.if_not_exists,
	UpdateOptions.delete,
	UpdateOptions.remove,
];

export interface UpdateExpressionProps extends ExpressionProps {
	type: UpdateOptions;
	// key?: string;
	key?: string;
	// add placeholder key so that is is possible to implicitly decare
	// the placeholder key that will be used in the expression
	and?: UpdateExpressionProps[];
	or?: UpdateExpressionProps[];
	value: DynamoDBValue;
}

export class Update extends Expression {
	private type: UpdateOptions;
	// key?: string;
	private key?: string;
	private _and: Update[] = [];
	public value: DynamoDBValue;

	static add(value: number | string[] | number[], key?: string): Update {
		return new Update({ type: UpdateOptions.add, value });
	}
	static delete(value: string[] | number[], key?: string): Update {
		return new Update({ type: UpdateOptions.delete, value });
	}
	static set(value: DynamoDBValue, key?: string): Update {
		return new Update({ type: UpdateOptions.set, value });
	}
	static appendToList(value: (string | number)[], key?: string): Update {
		return new Update({ type: UpdateOptions.list_append, value });
	}
	static ifNotExists(value: (string | number)[], key?: string): Update {
		return new Update({ type: UpdateOptions.if_not_exists, value });
	}
	static remove(value: string, key?: string): Update {
		return new Update({ type: UpdateOptions.remove, value });
	}

	constructor(props: UpdateExpressionProps) {
		super(props);
		this.type = props.type;
		this.value = props.value;
		// this.key = props.key ? props.key : undefined;
		this.key = props.key;
	}

	public and(update: Update, key?: string): Update {
		this._and.push(
			new Update({
				...update,
				...this,
				key: key ?? update.key,
				type: update.type,
				value: update.value,
			})
		);
		return this;
	}

	public ifKeyUndefined(key: string): Update {
		this.key ??= key;
		return this;
	}

	public generateExpression(key?: string): {
		ExpressionAttributeValues: {
			[key: string]: AttributeValue;
		};
		ExpressionAttributeNames: {
			[key: string]: string;
		};
		UpdateExpression: string;
	} {
		let brackets = false;
		let returnValue = "";
		// if (this.and || this.or) {
		// 	brackets = true;
		// }
		key ??= this.key;
		if (!this.key && !key) {
			throw new Error("No key was provided");
		}
		key ??= "";
		switch (this.type) {
			case UpdateOptions.delete:
			case UpdateOptions.add: {
				let valueHolder = this.setValue(this.value);
				let name = this.setName(key);
				returnValue = `${this.type} ${name} ${valueHolder}`;
				break;
			}
			case UpdateOptions.remove: {
				let name = this.setName(key);
				returnValue = `${this.type} ${name}`;
				break;
			}
			case UpdateOptions.set: {
				let valueHolder = this.setValue(this.value);
				let name = this.setName(key);
				returnValue = `${this.type} ${name} = ${valueHolder}`;
				break;
			}
			case UpdateOptions.if_not_exists: {
				let valueHolder = this.setValue(this.value);
				let name = this.setName(key);
				returnValue = `${UpdateOptions.set} ${name} = if_not_exists(${name},${valueHolder})`;

				break;
			}
			case UpdateOptions.list_append: {
				let valueHolder = this.setValue(this.value);
				let name = this.setName(key);
				returnValue = `${UpdateOptions.set} ${name} = list_append(${eventNames},${valueHolder})`;

				break;
			}
		}

		if (this._and.length) {
			const expressions = this._and.map((update) =>
				update.generateExpression()
			);

			const sortedUpdates = this._and.reduce<{
				[key: string]: {
					ExpressionAttributeValues: {
						[key: string]: AttributeValue;
					};
					ExpressionAttributeNames: {
						[key: string]: string;
					};
					UpdateExpression: string;
				}[];
			}>((a, b, index) => {
				a[b.type] = compact(
					concat(a[b.type] ?? [], [expressions[index]])
				);
				return a;
			}, {});
			sortedUpdates[this.type] = sortedUpdates[this.type]
				? [
						{
							ExpressionAttributeValues: {},
							ExpressionAttributeNames: {},
							UpdateExpression: returnValue,
						},
						...sortedUpdates[this.type],
				  ]
				: [
						{
							ExpressionAttributeValues: {},
							ExpressionAttributeNames: {},
							UpdateExpression: returnValue,
						},
				  ];
			const setUpdates = compact(
				concat(
					sortedUpdates[UpdateOptions.set],
					sortedUpdates[UpdateOptions.if_not_exists],
					sortedUpdates[UpdateOptions.list_append]
				)
			);
			const addUpdates = compact(sortedUpdates[UpdateOptions.add]);
			const deleteUpdates = compact(sortedUpdates[UpdateOptions.delete]);
			const removeUpdates = compact(sortedUpdates[UpdateOptions.remove]);

			const setUpdateExpression = setUpdates.length
				? `SET ${setUpdates
						.map((update) =>
							update.UpdateExpression.replace("SET", "")
						)
						.join(",")}`
				: "";
			const addUpdateExpression = addUpdates.length
				? `ADD ${addUpdates
						.map((update) =>
							update.UpdateExpression.replace("ADD", "")
						)
						.join(",")}`
				: "";
			const deleteUpdateExpression = deleteUpdates.length
				? `DELETE ${deleteUpdates
						.map((update) =>
							update.UpdateExpression.replace("DELETE", "")
						)
						.join(",")}`
				: "";
			const removeUpdateExpression = removeUpdates.length
				? `REMOVE ${removeUpdates
						.map((update) =>
							update.UpdateExpression.replace("REMOVE", "")
						)
						.join(",")}`
				: "";

			returnValue = [
				addUpdateExpression,
				setUpdateExpression,
				deleteUpdateExpression,
				,
				removeUpdateExpression,
			].join(" ");
			this.mergeValues(
				Object.fromEntries(
					expressions.flatMap(({ ExpressionAttributeValues }) =>
						Object.entries(ExpressionAttributeValues)
					)
				)
			);
			this.mergeNames(
				Object.fromEntries(
					expressions.flatMap(({ ExpressionAttributeNames }) =>
						Object.entries(ExpressionAttributeNames)
					)
				)
			);
		}

		return {
			UpdateExpression: this._and.length ? `${returnValue}` : returnValue,
			ExpressionAttributeValues: this.getAttributeValues(),
			ExpressionAttributeNames: this.getAttributeNames(),
		};
	}
}

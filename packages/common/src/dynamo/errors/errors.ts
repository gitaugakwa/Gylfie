import { GylfieError, ErrorProps } from "../../base/errors";

export class DynamoError extends GylfieError {
	constructor(props: ErrorProps, context?: any, innerError?: GylfieError) {
		super(
			{
				...props,
				target: props.target ?? "Dynamo",
			},
			context,

			innerError
		);
	}
}

export class ItemNotFoundError extends DynamoError {
	constructor(innerError?: GylfieError, context?: any) {
		super(
			{
				code: "ItemNotFound",
				message: "The item being queried does not exist.",
				name: "ItemDoesNotExist",
				status: 404,
			},
			context,
			innerError
		);
	}
}

export class ProvisionedThroughputExceededError extends DynamoError {
	constructor(innerError?: GylfieError, context?: any) {
		super(
			{
				code: "ProvisionedThroughputExceeded",
				message:
					"The provisioned throughput of the table has been exceeded.",
				name: "ProvisionedThroughputExceeded",
				status: 404,
			},
			context,
			innerError
		);
	}
}

export class ConditionalCheckFailedError extends DynamoError {
	constructor(innerError?: GylfieError, context?: any) {
		super(
			{
				code: "ConditionalCheckFailed",
				message: "Condition failed during mutable operation.",
				name: "ConditionalCheckFailed",
				status: 404,
			},
			context,
			innerError
		);
	}
}

export class ItemCollectionSizeLimitExceededError extends DynamoError {
	constructor(innerError?: GylfieError, context?: any) {
		super(
			{
				code: "ItemCollectionSizeLimitExceeded",
				message:
					"An item collection is too large." +
					" This exception is only returned for tables that have one or more local secondary indexes.",
				name: "ItemCollectionSizeLimitExceeded",
				status: 404,
			},
			context,
			innerError
		);
	}
}
export class TransactionConflictError extends DynamoError {
	constructor(innerError?: GylfieError, context?: any) {
		super(
			{
				code: "TransactionConflict",
				message:
					"There is currently another transaction ongoing on the item.",
				name: "OngoingTransactionOnItem",
				status: 404,
			},
			context,
			innerError
		);
	}
}

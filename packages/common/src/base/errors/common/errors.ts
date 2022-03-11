import { GylfieError } from "../error.model";

export class MalformedQueryError extends GylfieError {
	constructor(innerError?: GylfieError, context?: any, target?: string) {
		super(
			{
				code: "MalformedQuery",
				message: "The query provided is incorrect.",
				name: "IncorrectQuery",
				status: 404,
				target,
			},
			context,
			innerError
		);
	}
}

export class InternalServerError extends GylfieError {
	constructor(innerError?: GylfieError, context?: any, target?: string) {
		super(
			{
				code: "InternalServer",
				message: "Unexpected error occurred.",
				name: "InternalServer",
				status: 500,
				target,
			},
			context,
			innerError
		);
	}
}

export class InvalidQueryParameterError extends GylfieError {
	constructor(innerError?: GylfieError, context?: any, target?: string) {
		super(
			{
				code: "InvalidQueryParameter",
				message: "Parameter provided in query is incorrect.",
				name: "IncorrectQueryParameter",
				status: 400,
				target,
			},
			context,
			innerError
		);
	}
}

export class LimitExceededError extends GylfieError {
	constructor(innerError?: GylfieError, context?: any, target?: string) {
		super(
			{
				code: "LimitExceeded",
				message:
					"The limit of the resource requested has been exceeded.",
				name: "ResourceLimitExceeded",
				status: 400,
				target,
			},
			context,
			innerError
		);
	}
}

export class ResourceNotFoundError extends GylfieError {
	constructor(innerError?: GylfieError, context?: any, target?: string) {
		super(
			{
				code: "ResourceNotFound",
				message: "The resource being queried does not exist.",
				name: "ResourceDoesNotExist",
				status: 400,
				target,
			},
			context,
			innerError
		);
	}
}

export class ResourceInUseError extends GylfieError {
	constructor(innerError?: GylfieError, context?: any, target?: string) {
		super(
			{
				code: "ResourceInUse",
				message: "The resource is currently in use.",
				name: "ResourceInUse",
				status: 400,
				target,
			},
			context,
			innerError
		);
	}
}

export class InvalidParameterValueError extends GylfieError {
	constructor(innerError?: GylfieError, context?: any, target?: string) {
		super(
			{
				code: "InvalidParameterValue",
				message: "Parameter provided is incorrect.",
				name: "IncorrectParameterValue",
				status: 400,
				target,
			},
			context,
			innerError
		);
	}
}
export class ThrottlingError extends GylfieError {
	constructor(innerError?: GylfieError, context?: any, target?: string) {
		super(
			{
				code: "Throttling",
				message: "Request was dropped due to throttling.",
				name: "RequestDropped",
				status: 400,
				target,
			},
			context,
			innerError
		);
	}
}
export class RequestExpiredError extends GylfieError {
	constructor(innerError?: GylfieError, context?: any, target?: string) {
		super(
			{
				code: "RequestExpired",
				message:
					"Request expired due to taking an extended period of time to complete.",
				name: "RequestExpired",
				status: 400,
				target,
			},
			context,
			innerError
		);
	}
}

export class RequestLimitExceededError extends GylfieError {
	constructor(innerError?: GylfieError, context?: any, target?: string) {
		super(
			{
				code: "RequestLimitExceeded",
				message: "The AWS quota has been exceeded.",
				name: "RequestLimitExceeded",
				status: 400,
				target,
			},
			context,
			innerError
		);
	}
}

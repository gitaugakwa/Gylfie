import { GylfieError, ErrorProps } from "../../base/errors";

export class S3Error extends GylfieError {
	constructor(props: ErrorProps, context?: any, innerError?: GylfieError) {
		super(
			{
				...props,
				target: props.target ?? "S3",
			},
			context,
			innerError
		);
	}
}

export class PutError extends S3Error {
	constructor(innerError?: GylfieError, context?: any) {
		super(
			{
				code: "Put",
				message: "Error occurred during put method.",
				name: "PutError",
				status: 422,
			},
			context,
			innerError
		);
	}
}

export class AccessDeniedError extends S3Error {
	constructor(innerError?: GylfieError, context?: any) {
		super(
			{
				code: "AccessDenied",
				message: "Access has been denied for the previous request.",
				name: "AccessDenied",
				status: 403,
			},
			context,
			innerError
		);
	}
}

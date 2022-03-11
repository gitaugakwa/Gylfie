import { DateTime } from "luxon";

export interface ErrorProps {
	name: string;
	code: string;
	message: string;
	target?: string;
	status?: number;
}

interface DetailsErrorProps extends ErrorProps {
	details: GylfieError[];
}
interface InnerErrorProps extends ErrorProps {
	innerError: GylfieError;
}

interface FullErrorProps
	extends ErrorProps,
		DetailsErrorProps,
		InnerErrorProps {}

// There really is no need for statusCode
// If the error has not been handled,
// default to 500
// Since once it's thrown as an HttpError,
// that's the end of the GylfieError stack
// for that reason,
// it would be recommended that any error that would result in an GylfieError
// to not be caught since then the ErrorFilter would be able to properly handle
// GylfieErrors that would lead to http 500

// Cascaded Errors
// In a situation where one service calls another
// Such as Cognito Calling dynamo
// The error that dynamo returns should be included in the cognito error
// I would consider it an internal error
// Then any other errors would be in the details
// So, through services, the errors should be added as internal
// When it reaches a controller, the error should be converted to a http error

// Should also be able to accept raw error context

export class GylfieError {
	public name: string;
	public code: string;
	public message: string;
	public time: DateTime;
	public context?: any;
	public status?: number;
	public target?: string;
	public details?: GylfieError[];
	public innerError?: GylfieError;

	constructor(props: FullErrorProps, context?: any);
	constructor(
		props: DetailsErrorProps,
		context?: any,
		innerError?: GylfieError
	);
	constructor(
		props: ErrorProps,
		context?: any,
		innerError?: GylfieError,
		...details: GylfieError[]
	);
	constructor(
		props: FullErrorProps | DetailsErrorProps | ErrorProps,
		context?: any,
		innerError?: GylfieError,
		...details: GylfieError[]
	) {
		this.name = props.name;
		this.code = props.code;
		this.message = props.message;
		this.target = props.target;
		this.status = props.status;
		this.context = context;
		this.time = DateTime.utc();
		if (this.isFullErrorProps(props)) {
			Object.assign(this, props);
			this.details = props.details;
			this.innerError = props.innerError;
			return;
		}
		if (this.isDetailsErrorProps(props)) {
			Object.assign(this, props);
			this.details = props.details;
			this.innerError = innerError;
			return;
		}
		if (this.isErrorProps(props)) {
			Object.assign(this, props);
			this.details = details;
			this.innerError = innerError;
			return;
		}
	}

	private isFullErrorProps(props: any): props is FullErrorProps {
		return props.details && props.innerError;
	}

	private isDetailsErrorProps(props: any): props is DetailsErrorProps {
		return props.details;
	}

	private isErrorProps(props: any): props is ErrorProps {
		return props.message && props.code && props.name;
	}

	public addDetails(...errors: ErrorProps[]): GylfieError {
		if (this.details) {
			this.details.push(...errors.map((error) => new GylfieError(error)));
		} else {
			this.details = errors.map((error) => new GylfieError(error));
		}
		return this;
	}

	public addInnerError(error: ErrorProps): GylfieError {
		if (this.innerError) {
			console.log(
				"GylfieError already has an innerError.\n" +
					"Overwriting innerError"
			);
		}
		this.innerError = new GylfieError(error);
		return this;
	}

	public display() {
		const { message, code, name, time } = this;
		return { message, code, name, time };
	}
}

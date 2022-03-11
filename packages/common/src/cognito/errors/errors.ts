import { GylfieError, ErrorProps } from "../../base/errors";

export class CognitoError extends GylfieError {
	constructor(props: ErrorProps, context?: any, innerError?: GylfieError) {
		super(
			{
				...props,
				target: props.target ?? "Cognito",
			},
			context,
			innerError
		);
	}
}

export class InvalidIdentifierError extends CognitoError {
	constructor(innerError?: GylfieError, context?: any) {
		super(
			{
				code: "InvalidIdentifier",
				message: "The identifier provided is invalid.",
				name: "InvalidIdentifier",
				status: 422,
			},
			context,
			innerError
		);
	}
}

export class AccessPatternNotProvidedError extends CognitoError {
	constructor(innerError?: GylfieError, context?: any) {
		super(
			{
				code: "AccessPatternNotProvided",
				message:
					"An access pattern required for the request is not provided.",
				name: "AccessPatternNotProvided",
				status: 500,
			},
			context,
			innerError
		);
	}
}

export class InvalidAccessPatternError extends CognitoError {
	constructor(innerError?: GylfieError, context?: any) {
		super(
			{
				code: "InvalidAccessPattern",
				message: "The access pattern provided is invalid.",
				name: "InvalidAccessPattern",
				status: 500,
			},
			context,
			innerError
		);
	}
}

export class InvalidAccessPatternValuesError extends CognitoError {
	constructor(innerError?: GylfieError, context?: any) {
		super(
			{
				code: "InvalidAccessPatternValues",
				message:
					"The values provided to the access pattern are invalid." +
					" This is determined by the parse method.",
				name: "InvalidAccessPatternValues",
				status: 500,
			},
			context,
			innerError
		);
	}
}

export class InvalidUserPoolConfigurationError extends CognitoError {
	constructor(innerError?: GylfieError, context?: any) {
		super(
			{
				code: "InvalidUserPoolConfiguration",
				message: "The user pool configuration is invalid.",
				name: "InvalidUserPoolConfiguration",
				status: 422,
			},
			context,
			innerError
		);
	}
}

export class UserNotFoundError extends CognitoError {
	constructor(innerError?: GylfieError, context?: any) {
		super(
			{
				code: "UserNotFound",
				message: "The user queried has not been found.",
				name: "UserDoesNotExist",
				status: 404,
			},
			context,
			innerError
		);
	}
}

export class InvalidUserDataError extends CognitoError {
	constructor(innerError?: GylfieError, context?: any) {
		super(
			{
				code: "InvalidUserData",
				message: "The retrieved user data is invalid.",
				name: "InvalidUserData",
				status: 422,
			},
			context,
			innerError
		);
	}
}

export class InvalidPasswordError extends CognitoError {
	constructor(innerError?: GylfieError, context?: any) {
		super(
			{
				code: "InvalidPassword",
				message: "The password provided is invalid.",
				name: "InvalidPassword",
				status: 422,
			},
			context,
			innerError
		);
	}
}
export class InvalidParameterError extends CognitoError {
	constructor(innerError?: GylfieError, context?: any) {
		super(
			{
				code: "InvalidParameter",
				message: "A parameter provided is invalid.",
				name: "InvalidParameter",
				status: 422,
			},
			context,
			innerError
		);
	}
}

export class IncompleteDetailsError extends CognitoError {
	constructor(innerError?: GylfieError, context?: any) {
		super(
			{
				code: "IncompleteDetails",
				message: "The details provided are incomplete.",
				name: "IncompleteDetailsProvided",
				status: 422,
			},
			context,
			innerError
		);
	}
}

export class NotAuthorizedError extends CognitoError {
	constructor(innerError?: GylfieError, context?: any) {
		super(
			{
				code: "NotAuthorized",
				message: "The user is not authorized.",
				name: "Unauthorized",
				status: 422,
			},
			context,
			innerError
		);
	}
}

export class CodeDeliveryFailureError extends CognitoError {
	constructor(innerError?: GylfieError, context?: any) {
		super(
			{
				code: "CodeDeliveryFailure",
				message: "Delivery of the verification failed.",
				name: "CodeDeliveryFailure",
				status: 400,
			},
			context,
			innerError
		);
	}
}

export class TooManyRequestsError extends CognitoError {
	constructor(innerError?: GylfieError, context?: any) {
		super(
			{
				code: "TooManyRequests",
				message: "Too many requests to a certain operation.",
				name: "TooManyRequests",
				status: 400,
			},
			context,
			innerError
		);
	}
}
export class UserNotConfirmedError extends CognitoError {
	constructor(innerError?: GylfieError, context?: any) {
		super(
			{
				code: "UserNotConfirmed",
				message: "User needs to confirm their account.",
				name: "UserUnconfirmed",
				status: 400,
			},
			context,
			innerError
		);
	}
}
export class PasswordResetRequiredError extends CognitoError {
	constructor(innerError?: GylfieError, context?: any) {
		super(
			{
				code: "PasswordResetRequired",
				message: "User needs to reset their password.",
				name: "PasswordResetRequired",
				status: 400,
			},
			context,
			innerError
		);
	}
}
export class GroupExistsError extends CognitoError {
	constructor(innerError?: GylfieError, context?: any) {
		super(
			{
				code: "GroupExists",
				message: "The group already exists.",
				name: "GroupAlreadyExists",
				status: 400,
			},
			context,
			innerError
		);
	}
}

export class UsernameExistsError extends CognitoError {
	constructor(innerError?: GylfieError, context?: any) {
		super(
			{
				code: "UsernameExists",
				message: "The username already exists.",
				name: "UsernameAlreadyExists",
				status: 400,
			},
			context,
			innerError
		);
	}
}

export class InternalErrorError extends CognitoError {
	constructor(innerError?: GylfieError, context?: any) {
		super(
			{
				code: "InternalError",
				message: "Unexpected error occurred.",
				name: "InternalError",
				status: 500,
			},
			context,
			innerError
		);
	}
}

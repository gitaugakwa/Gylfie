export const CommonErrors = {
	"AccessDeniedException": {
		name: "AccessDeniedException",
		description:
			"You do not have sufficient access to perform this action.",
		statusCode: 400,
	},
	"IncompleteSignature": {
		name: "IncompleteSignature",
		description: "The request signature does not conform to AWS standards.",
		statusCode: 400,
	},
	"InternalFailure": {
		name: "InternalFailure",
		description:
			"The request processing has failed because of an unknown error, exception or failure.",
		statusCode: 500,
	},
	"InvalidAction": {
		name: "InvalidAction",
		description:
			"The action or operation requested is invalid. Verify that the action is typed correctly.",
		statusCode: 400,
	},
	"InvalidClientTokenId": {
		name: "InvalidClientTokenId",
		description:
			"The X.509 certificate or AWS access key ID provided does not exist in our records.",
		statusCode: 403,
	},
	"InvalidParameterCombination": {
		name: "InvalidParameterCombination",
		description:
			"Parameters that must not be used together were used together.",
		statusCode: 400,
	},
	"InvalidParameterValue": {
		name: "InvalidParameterValue",
		description:
			"An invalid or out-of-range value was supplied for the input parameter.",
		statusCode: 400,
	},
	"InvalidQueryParameter": {
		name: "InvalidQueryParameter",
		description:
			"The AWS query string is malformed or does not adhere to AWS standards.",
		statusCode: 400,
	},
	"MalformedQueryString": {
		name: "MalformedQueryString",
		description: "The query string contains a syntax error.",
		statusCode: 404,
	},
	"MissingAction": {
		name: "MissingAction",
		description:
			"The request is missing an action or a required parameter.",
		statusCode: 400,
	},
	"MissingParameter": {
		name: "MissingParameter",
		description:
			"A required parameter for the specified action is not supplied.",
		statusCode: 400,
	},
	"NotAuthorized": {
		name: "NotAuthorized",
		description: "You do not have permission to perform this action.",
		statusCode: 400,
	},
	"OptInRequired": {
		name: "OptInRequired",
		description:
			"The AWS access key ID needs a subscription for the service.",
		statusCode: 403,
	},
	"RequestExpired": {
		name: "RequestExpired",
		description:
			"The request reached the service more than 15 minutes after the date stamp on the request or more than 15 minutes after the request expiration date (such as for pre-signed URLs), or the date stamp on the request is more than 15 minutes in the future.",
		statusCode: 400,
	},
	"ServiceUnavailable": {
		name: "ServiceUnavailable",
		description:
			"The request has failed due to a temporary failure of the server.",
		statusCode: 503,
	},
	"ThrottlingException": {
		name: "ThrottlingException",
		description: "The request was denied due to request throttling.",
		statusCode: 400,
	},
	"ValidationError": {
		name: "ValidationError",
		description:
			"The input fails to satisfy the constraints specified by an AWS service.",
		statusCode: 400,
	},
};

import {
	CognitoIdentityProviderClient,
	SignUpCommand,
	InitiateAuthCommand,
	ForgotPasswordCommand,
	GetGroupCommand,
	ListGroupsCommand,
	CreateGroupCommand,
	UpdateGroupCommand,
	DeleteGroupCommand,
	AuthenticationResultType,
	CodeDeliveryDetailsType,
	AuthFlowType,
	AttributeType,
} from "@aws-sdk/client-cognito-identity-provider";
import { BaseService, BaseServiceProps, State } from "../../base";
import { GroupResponse } from "../models";
// import {
// 	Condition,
// 	ConditionExpressionProps,
// 	DynamoDBMap,
// 	DynamoDBValue,
// 	DynamoEntityConstructor,
// 	Key,
// } from "../../../models/dynamo";
import { DateTime } from "luxon";
import { v1 } from "uuid";
import {
	InternalServerError,
	LimitExceededError,
	GylfieError,
	RequestLimitExceededError,
	ResourceInUseError,
	ResourceNotFoundError,
} from "../../base/errors";
import {
	CodeDeliveryFailureError,
	CognitoError,
	GroupExistsError,
	IncompleteDetailsError,
	InternalErrorError,
	InvalidIdentifierError,
	NotAuthorizedError,
	InvalidPasswordError,
	TooManyRequestsError,
	InvalidUserDataError,
	UsernameExistsError,
	UserNotFoundError,
	InvalidParameterError,
	InvalidUserPoolConfigurationError,
	PasswordResetRequiredError,
	UserNotConfirmedError,
	AccessPatternNotProvidedError,
	InvalidAccessPatternError,
	InvalidAccessPatternValuesError,
} from "../errors";
import { Placeholder } from "../../dynamo/placeholders";
import { fromEnv } from "@aws-sdk/credential-providers";
import { omitBy, isUndefined, isNull, isNil } from "lodash";
import { LOCAL_COGNITO_PORT, COGNITO_REGION } from "../constants";

// Should we have friendly ids for users?
// I don't think it would be advised
// It would add another problem
// Though for other users trying to access the data, like for friends
// Though this would be possible in dynamo, but not cognito
// There is no reason for cognito to use it
// email can be used only for password reset

export const UserPoolStandardAttributes = [
	"address",
	"birthdate",
	"email",
	"family_name",
	"gender",
	"given_name",
	"locale",
	"middle_name",
	"name",
	"nickname",
	"phone_number",
	"picture",
	"preferred_username",
	"profile",
	"updated_at",
	"website",
	"zoneinfo",
];

export interface UserPoolStandardAttributesProperties {
	"address"?: string;
	"birthdate"?: string;
	"email"?: string;
	"family_name"?: string;
	"gender"?: string;
	"given_name"?: string;
	"locale"?: string;
	"middle_name"?: string;
	"name"?: string;
	"nickname"?: string;
	"phone_number"?: string;
	"picture"?: string;
	"preferred_username"?: string;
	"profile"?: string;
	"updated_at"?: string;
	"website"?: string;
	"zoneinfo"?: string;
}

export interface CognitoServiceProps extends BaseServiceProps {
	// provide different access patterns for each of the access types
	// Email
	// ID
	// user: DynamoEntityConstructor<RegularUser, RegularUserProps>;
	// table: string;
	// In the future allow for table to be determined by the access pattern
	// access: CognitoAccessPatterns;
	// email?: string;
	port?: number;
	region?: string;
	clientID?: string;
	userPoolID?: string;
}

// Maybe have Cognito service instantiated after DynamoService
// These access patterns are for cognito to access a database
// So what would happen in the situation that there is no database
// some things will throw
// also, in the case of a database
//

// add table to key
// We'll use the actual name for the placeholder

// Should also be able to support object for multiple placeholders
// type ValidatorFunction = (values: DynamoDBMap) => boolean;

// The Parse Function can throw
// In case the text provided does not match the requirements

// interface CognitoAccessPattern {
// 	key: Key;
// 	validator?: ValidatorFunction;
// }
// interface CognitoAccessPatterns {
// 	[key: string]: CognitoAccessPattern | undefined;
// 	id: CognitoAccessPattern;
// 	email?: CognitoAccessPattern;

// 	// identifier: string;
// }

// consider that also emails can be used as ids
// so restricting to a named pattern would not help
// we can actually provide parse functions
// so the text is called with the parse function that returns a bool
// const accessExample: CognitoAccessPatterns = {
// 	email: {
// 		key: {
// 			GSI1PK: `{{email}}`,
// 			GSI1SK: Condition.beginsWith("USER"),
// 		},
// 	},
// 	id: {
// 		key: {
// 			PK: `USER#{{id}}`,
// 			SK: "user",
// 		},
// 	},
// };

// function EmailParser(text: string): boolean {

// }

// This service is far from generalized
// For now, this will be cakeworld only
/**
 * Gylfie Cognito Service
 * @decorator `@Injectable`
 * @decorator `// @ServiceState`
 * @param props - The properties required to create the service
 * @param dynamoService - DynamoService provided through DI
 * @param configService - ConfigService provided through DI
 * @param logger - LoggerService provided through DI
 */

export interface CognitoServiceProps extends BaseServiceProps {
	clientId?: string;
	userPoolId?: string;
	port?: number;
	region?: string;
}

// @ServiceState(9229, "LOCAL_COGNITO_PORT")
export class CognitoService extends BaseService {
	public cognitoIdentityProvider: CognitoIdentityProviderClient;
	// private accessPattern: AccessPattern;
	public clientID: string;
	public userPoolID: string;
	public port: number;
	// private groups
	constructor(props?: CognitoServiceProps) {
		super();
		// const { port, clientID, userPoolID, credentials } = props;
		this.port =
			props?.port ??
			(parseInt(process.env.LOCAL_COGNITO_PORT ?? "") ||
				LOCAL_COGNITO_PORT);
		// // this.accessPattern = new AccessPattern(props.access);
		this.clientID =
			props?.clientID ?? process.env.COGNITO_APP_CLIENT_ID ?? "";
		this.userPoolID =
			props?.userPoolID ?? process.env.COGNITO_APP_USERPOOL_ID ?? "";

		this.state = State.ONLINE;
		this.cognitoIdentityProvider = new CognitoIdentityProviderClient({
			region:
				props?.region ?? process.env.COGNITO_REGION ?? COGNITO_REGION,
			credentials: props?.credentials ?? fromEnv(),
		});

		props?.logger?.info({
			message: "CognitoIdentityProviderClient Initialized",
			state: this.state,
			service: "CognitoService",
		});
		if (this.isLocal()) {
			this.isLocalActive(this.port).then((active) => {
				if (active) {
					this.state = State.LOCAL;
					props?.logger?.info({
						message: "Local Is ACTIVE",
						state: this.state,
						service: "CognitoService",
					});
					this.cognitoIdentityProvider =
						new CognitoIdentityProviderClient({
							endpoint: `http://localhost:${this.port}`,
							region:
								props?.region ??
								process.env.COGNITO_REGION ??
								COGNITO_REGION,
							credentials: props?.credentials ?? fromEnv(),
						});
					props?.logger?.info({
						message: "CognitoIdentityProviderClient Initialized",
						state: this.state,
						service: "CognitoService",
					});
				} else {
					props?.logger?.warn({
						message: "Local Is INACTIVE",
						state: this.state,
						service: "CognitoService",
					});
				}
			});
			return;
		}
	}

	//#region Basic Cognito Chores
	private toAttribute(obj: { [key: string]: string }): AttributeType[] {
		return Object.entries(obj).map(([name, Value]) => {
			return {
				Name: UserPoolStandardAttributes.includes(
					this.fromCamelCase(name)
				)
					? this.fromCamelCase(name)
					: `custom:${this.fromCamelCase(name)}`,
				Value,
			};
		});
	}

	private fromCamelCase(text: string): string {
		if (text[0] == text[0].toUpperCase()) {
			text = text[0].toLowerCase().concat(text.substr(1));
		}
		return `${text.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)}`;
	}
	//#endregion

	//#region  User Methods

	// create a dynamoService function to check if something exists
	// @States(State.Local, State.Hybrid, State.Online)
	// public async checkUser(props: AccessValues): Promise<boolean> {
	// 	try {
	// 		const [access, values] = Object.entries(props)[0];
	// 		const key = this.accessPattern.getKey(access, values);
	// 		const request = this.dynamoService.get(
	// 			this.props.user,
	// 			this.props.table,
	// 			key
	// 		);
	// 		return (await request) ? true : false;
	// 	} catch (err) {
	// 		if (err instanceof CognitoError) {
	// 			throw err;
	// 		}
	// 		if (err instanceof GylfieError) {
	// 			throw new UserNotFoundError(err);
	// 		}

	// 		throw this.errorHandler(err);
	// 	}
	// }

	// @States(State.Local, State.Online)
	// private async createUserDynamo(user: RegularUserProps) {
	// 	try {
	// 		const newUser = new this.props.user({ ...user });
	// 		// Should not return
	// 		await this.dynamoService.put(this.props.user, "Cakeworld", newUser);
	// 		return newUser;
	// 	} catch (err) {
	// 		throw err; // fix
	// 	}
	// }

	// @States(State.Local, State.Hybrid, State.Online)
	// public async getUser(props: AccessValues): Promise<RegularUser> {
	// 	try {
	// 		const [access, values] = Object.entries(props)[0];
	// 		const key = this.accessPattern.getKey(access, values);
	// 		const request = this.dynamoService.get(
	// 			this.props.user,
	// 			this.props.table,
	// 			key
	// 		);
	// 		const response = await request;
	// 		if (response) {
	// 			return response[0];
	// 		}
	// 		throw new UserNotFoundError();
	// 	} catch (err) {
	// 		// Dynamo Errors
	// 		// Identifier Errors
	// 		if (err instanceof CognitoError) {
	// 			throw err;
	// 		}
	// 		if (err instanceof GylfieError) {
	// 			throw new UserNotFoundError(err);
	// 		}
	// 		throw this.errorHandler(err);
	// 	}
	// }
	//#endregion

	//#region  Cognito Methods

	// @States(State.Local, State.Online)
	public async createUser(props: {
		user: UserPoolStandardAttributesProperties & {
			[key: string]: string | undefined;
		};
	}): Promise<CreateUserResponse> {
		const {
			user: { username, password, ...attributes },
		} = props;
		const ClientId = this.clientID;
		// Formats to the DateTime allowed as a cognito data type
		// "custom:creation_date_time": dateTime.toFormat(
		// 	"yyyy-MM-dd HH:mm:ss ZZZZ"
		// ),
		const UserAttributes = this.toAttribute(
			omitBy(attributes, isUndefined) as { [key: string]: string }
		);
		// console.log(UserAttributes);
		// ClientMetadata, include fingerprint or something

		try {
			// currently, creating a user has the email as the Username
			// this should preferably be a uuid
			// the cognito uuid will be useless and could possibly be used for hashing
			const { UserConfirmed, UserSub, CodeDeliveryDetails } =
				await this.cognitoIdentityProvider.send(
					new SignUpCommand({
						ClientId,
						Password: password,
						Username: username ?? attributes.email,
						UserAttributes,
					})
				);

			if (UserSub) {
				return {
					userConfirmed: UserConfirmed ?? false,
					codeDeliveryDetails: CodeDeliveryDetails,
					userID: UserSub,
				};
			}
			throw new IncompleteDetailsError(); // fix
			// For more sign up stuff like 2fa i think
		} catch (err: any) {
			console.log(err);
			if (err instanceof CognitoError) {
				throw err;
			}
			if (err instanceof GylfieError) {
				throw new UserNotFoundError(err);
			}
			throw this.errorHandler(err);
		}
		// return {
		// 	name: "NO RETURN",
		// 	code: "SIGN_UP",
		// 	message: "No Response or Error returned",
		// };
	}

	// @States(State.Local, State.Hybrid, State.Online)
	public async authenticateUser(props: {
		username: string;
		password: string;
	}): Promise<SignInResponse> {
		const { password, username } = props;
		const ClientId = this.clientID;
		const AuthParameters = {
			USERNAME: username,
			PASSWORD: password,
		};
		const AuthFlow: AuthFlowType = AuthFlowType.USER_PASSWORD_AUTH;

		try {
			const {
				AuthenticationResult,
				ChallengeName,
				ChallengeParameters,
				Session,
			} = await this.cognitoIdentityProvider.send(
				new InitiateAuthCommand({
					AuthFlow,
					ClientId,
					AuthParameters,
				})
			);

			return new SignInResponse({
				challengeName: ChallengeName,
				session: Session,
				challengeParameters: ChallengeParameters,
				authenticationResult: AuthenticationResult,
			});
			// return {
			// 	name: "NO RETURN",
			// 	code: "SIGN_IN",
			// 	message: "No Response or Error returned",
			// };
		} catch (err) {
			throw this.errorHandler(err);
		}
	}

	// @States(State.Local, State.Hybrid, State.Online)
	// public async forgotPassword(props: AccessValues): Promise<ResetResponse> {
	// 	// since the email is not the id,
	// 	// we have to retrieve it from dynamo

	// 	const ClientId = this.clientID;
	// 	try {
	// 		// Add functionality
	// 		const request = this.getUser(props);
	// 		const response = await request;

	// 		if (response.id) {
	// 			const cognitoRequest = this.cognitoIdentityProvider.send(
	// 				new ForgotPasswordCommand({
	// 					ClientId,
	// 					Username: response.id,
	// 				})
	// 			);

	// 			const cognitoResponse = await cognitoRequest;

	// 			return new ResetResponse({
	// 				deliveryMedium:
	// 					cognitoResponse.CodeDeliveryDetails?.DeliveryMedium,
	// 				destination:
	// 					cognitoResponse.CodeDeliveryDetails?.Destination,
	// 				attributeName:
	// 					cognitoResponse.CodeDeliveryDetails?.AttributeName,
	// 			});
	// 		}
	// 		throw new InvalidUserDataError();
	// 	} catch (err) {
	// 		throw this.errorHandler(err);
	// 	}
	// }

	// @States(State.Hybrid, State.Online)
	public async refreshTokens(props: {
		refreshToken: string;
	}): Promise<RefreshResponse> {
		const { refreshToken } = props;
		const ClientId = this.clientID;
		const AuthParameters = {
			REFRESH_TOKEN: refreshToken,
		};

		try {
			const {
				AuthenticationResult,
				ChallengeName,
				ChallengeParameters,
				Session,
			} = await this.cognitoIdentityProvider.send(
				new InitiateAuthCommand({
					AuthFlow: "REFRESH_TOKEN_AUTH",
					ClientId,
					AuthParameters,
				})
			);

			return new RefreshResponse({
				challengeName: ChallengeName,
				session: Session,
				challengeParameters: ChallengeParameters,
				authenticationResult: AuthenticationResult,
			});
			// return {
			// 	name: "NO RETURN",
			// 	code: "SIGN_IN",
			// 	message: "No Response or Error returned",
			// };
		} catch (err) {
			throw this.errorHandler(err);
		}
	}

	// @States(State.Local, State.Hybrid, State.Online)
	public async createGroup(props: {
		groupName: string;
		description?: string;
		precedence?: number;
	}): Promise<GroupResponse> {
		const { groupName, description, precedence } = props;
		const userPoolID = this.userPoolID;
		try {
			const { Group } = await this.cognitoIdentityProvider.send(
				new CreateGroupCommand({
					GroupName: groupName,
					UserPoolId: userPoolID,
					Description: description,
					Precedence: precedence,
				})
			);
			const {
				CreationDate,
				Description,
				GroupName,
				LastModifiedDate,
				Precedence,
				RoleArn,
				UserPoolId,
			} = Group ?? {};

			return new GroupResponse({
				groupName: GroupName,
				userPoolID: UserPoolId,
				description: Description,
				precedence: Precedence,
				creationDate: CreationDate,
				lastModifiedDate: LastModifiedDate,
				roleArn: RoleArn,
			});
		} catch (err) {
			throw this.errorHandler(err);
		}
	}

	// @States(State.Local, State.Online)
	public async deleteGroup(props: { groupName: string }): Promise<boolean> {
		const { groupName } = props;
		const userPoolID = this.userPoolID;
		try {
			const request = this.cognitoIdentityProvider.send(
				new DeleteGroupCommand({
					GroupName: groupName,
					UserPoolId: userPoolID,
				})
			);
			const response = await request;

			return response ? true : false;
		} catch (err) {
			throw this.errorHandler(err);
		}
	}

	// @States(State.Local, State.Hybrid, State.Online)
	public async getGroup(props: {
		groupName: string;
	}): Promise<GroupResponse> {
		const { groupName } = props;
		const userPoolID = this.userPoolID;
		try {
			const { Group } = await this.cognitoIdentityProvider.send(
				new GetGroupCommand({
					GroupName: groupName,
					UserPoolId: userPoolID,
				})
			);

			const {
				CreationDate,
				Description,
				GroupName,
				LastModifiedDate,
				Precedence,
				RoleArn,
				UserPoolId,
			} = Group ?? {};
			return new GroupResponse({
				groupName: GroupName,
				userPoolID: UserPoolId,
				description: Description,
				precedence: Precedence,
				creationDate: CreationDate,
				lastModifiedDate: LastModifiedDate,
				roleArn: RoleArn,
			});
		} catch (err) {
			throw this.errorHandler(err);
		}
	}

	// @States(State.Local, State.Hybrid, State.Online)
	public async listGroups(): Promise<GroupResponse[]> {
		const userPoolID = this.userPoolID;
		try {
			const { Groups } = await this.cognitoIdentityProvider.send(
				new ListGroupsCommand({
					UserPoolId: userPoolID,
				})
			);
			if (Groups) {
				return Groups.map((group) => {
					return new GroupResponse({
						groupName: group.GroupName,
						userPoolID: group.UserPoolId,
						description: group.Description,
						precedence: group.Precedence,
						creationDate: group.CreationDate,
						lastModifiedDate: group.LastModifiedDate,
						roleArn: group.RoleArn,
					});
				});
			}
			return [];
		} catch (err) {
			throw this.errorHandler(err);
		}
	}

	// @States(State.Local, State.Online)
	public async updateGroup(props: {
		groupName: string;
		description?: string;
		precedence?: number;
	}): Promise<GroupResponse> {
		const { groupName, description, precedence } = props;
		const userPoolID = this.userPoolID;
		try {
			const { Group } = await this.cognitoIdentityProvider.send(
				new UpdateGroupCommand({
					GroupName: groupName,
					UserPoolId: userPoolID,
					Description: description,
					Precedence: precedence,
				})
			);

			const {
				CreationDate,
				Description,
				GroupName,
				LastModifiedDate,
				Precedence,
				RoleArn,
				UserPoolId,
			} = Group ?? {};

			return new GroupResponse({
				groupName: GroupName,
				userPoolID: UserPoolId,
				description: Description,
				precedence: Precedence,
				creationDate: CreationDate,
				lastModifiedDate: LastModifiedDate,
				roleArn: RoleArn,
			});
		} catch (err) {
			throw this.errorHandler(err);
		}
	}
	protected errorHandler(err: any, inner?: GylfieError): GylfieError {
		switch ((err.name as string).replace("Exception", "")) {
			case "InternalServer": {
				return new InternalServerError(inner, err, "Cognito");
			}
			case "LimitExceeded": {
				return new LimitExceededError(inner, err, "Cognito");
			}
			case "ResourceInUse": {
				return new ResourceInUseError(inner, err, "Cognito");
			}
			case "ResourceNotFound": {
				return new ResourceNotFoundError(inner, err, "Cognito");
			}
			case "RequestLimitExceeded": {
				return new RequestLimitExceededError(inner, err, "Cognito");
			}
			case "InternalError": {
				return new InternalErrorError(inner, err);
			}
			case "InvalidUserPoolConfiguration": {
				return new InvalidUserPoolConfigurationError(inner, err);
			}
			case "PasswordResetRequired": {
				return new PasswordResetRequiredError(inner, err);
			}
			case "GroupExists": {
				return new GroupExistsError(inner, err);
			}
			case "CodeDeliveryFailure": {
				return new CodeDeliveryFailureError(inner, err);
			}
			case "NotAuthorized": {
				return new NotAuthorizedError(inner, err);
			}
			case "TooManyRequests": {
				return new TooManyRequestsError(inner, err);
			}
			case "UsernameExists": {
				return new UsernameExistsError(inner, err);
			}
			case "InvalidPassword": {
				return new InvalidPasswordError(inner, err);
			}
			case "InvalidParameter": {
				return new InvalidParameterError(inner, err);
			}
			case "UserNotConfirmed": {
				return new UserNotConfirmedError(inner, err);
			}
			case "UserNotFound": {
				return new UserNotFoundError(inner, err);
			}
		}
		return err;
	}
	//#endregion
}

export interface CreateUserResponse {
	userConfirmed: boolean;
	codeDeliveryDetails?: CodeDeliveryDetailsType;
	userID: string;
}
export class SignInResponse {
	// This is the most likely value returned
	authenticationResult?: AuthenticationResultType;

	// Here to account for aws use
	challengeName?: string;
	session?: string;
	challengeParameters?: {
		[key: string]: string;
	};

	constructor(props: Partial<SignInResponse>) {
		Object.assign(this, props);
	}
}

export class ResetResponse {
	destination?: string;
	deliveryMedium?: string;
	attributeName?: string;
	constructor(props: Partial<ResetResponse>) {
		Object.assign(this, props);
	}
}
export class RefreshResponse {
	// This is the most likely value returned
	authenticationResult?: AuthenticationResultType;

	// Here to account for aws use
	challengeName?: string;
	session?: string;
	challengeParameters?: {
		[key: string]: string;
	};

	constructor(props: Partial<RefreshResponse>) {
		Object.assign(this, props);
	}
}

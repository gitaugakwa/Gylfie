import { GylfieError, State } from "@gylfie/common/lib/base";
import {
	CognitoService,
	CognitoServiceProps,
	CreateUserResponse,
	GroupResponse,
	RefreshResponse,
	SignInResponse,
	UserPoolStandardAttributesProperties,
} from "@gylfie/common/lib/cognito";
// import { DynamoDBMap, Key } from "@gylfie/common/lib/dynamo";
import { Inject, Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BaseNestService } from "../../base";
import { COGNITO_PROPS } from "../../modules/cognito/cognito.constants";
import { NestLoggerService } from "../logger";

// Should we have friendly ids for users?
// I don't think it would be advised
// It would add another problem
// Though for other users trying to access the data, like for friends
// Though this would be possible in dynamo, but not cognito
// There is no reason for cognito to use it
// email can be used only for password reset

export interface NestCognitoServiceProps extends CognitoServiceProps {
	// provide different access patterns for each of the access types
	// Email
	// ID
	// user: DynamoEntityConstructor<RegularUser, RegularUserProps>;
	// table: string;
	// In the future allow for table to be determined by the access pattern
	// access: CognitoAccessPatterns;
	// email?: string;
	port?: number;
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

interface CognitoAccessPattern {
	// key: Key;
	// validator?: ValidatorFunction;
}
interface CognitoAccessPatterns {
	[key: string]: CognitoAccessPattern | undefined;
	id: CognitoAccessPattern;
	email?: CognitoAccessPattern;

	// identifier: string;
}

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

@Injectable()
// @ServiceState(9229, "LOCAL_COGNITO_PORT")
export class NestCognitoService extends BaseNestService {
	// private accessPattern: AccessPattern;
	private service: CognitoService;
	// private groups
	constructor(
		// Will practically need dynamo for account retrieval
		// Or a form of database service
		// Currently Dynamo
		@Inject(COGNITO_PROPS)
		private readonly props: NestCognitoServiceProps,
		// private dynamoService: DynamoService,
		@Optional()
		protected configService?: ConfigService,
		@Optional()
		private logger?: NestLoggerService
	) {
		super();
		this.service = new CognitoService(props);
		const { port, clientID, userPoolID, credentials } = props;
		// this.port =
		// 	port ??
		// 	this.configService?.get<number>("LOCAL_COGNITO_PORT") ??
		// 	9229;
		// this.accessPattern = new AccessPattern(props.access);

		if (this.isLocal()) {
			// Since this is mostly port stuff,
			// We can make a decorator that can take the port to check if it's active
			// Have the isLocal and isLocalActive on static.
			// This will allow to pass a name, port and default port
			logger?.info("Is Currently in Local Environment");
			// the default local setup is Hybrid
			// Since it's async to determine if the port is in use
			this.state = State.Hybrid;
			this.isLocalActive(this.service.port).then((active) => {
				if (active) {
					logger?.info("Local Instance of Cognito is ACTIVE");

					this.state = State.Local;
					return;
				}
				logger?.warn("Local Instance of Cognito is INACTIVE");
				logger?.warn("Defauting to online instance");
				logger?.warn("Only Read Only Actions will be Passed");
				return;
			});
			return;
		}
		logger?.info("Online Instance of Cognito is ACTIVE");
		this.state = State.Online;
	}

	//#region Basic Cognito Chores
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
		return this.service.createUser(props);
	}

	// @States(State.Local, State.Hybrid, State.Online)
	public async authenticateUser(props: {
		username: string;
		password: string;
	}): Promise<SignInResponse> {
		return this.service.authenticateUser(props);
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
		return this.service.refreshTokens(props);
	}

	// @States(State.Local, State.Hybrid, State.Online)
	public async createGroup(props: {
		groupName: string;
		description?: string;
		precedence?: number;
	}): Promise<GroupResponse> {
		return this.service.createGroup(props);
	}

	// @States(State.Local, State.Online)
	public async deleteGroup(props: { groupName: string }): Promise<boolean> {
		return this.service.deleteGroup(props);
	}

	// @States(State.Local, State.Hybrid, State.Online)
	public async getGroup(props: {
		groupName: string;
	}): Promise<GroupResponse> {
		return this.service.getGroup(props);
	}

	// @States(State.Local, State.Hybrid, State.Online)
	public async listGroups(): Promise<GroupResponse[]> {
		return this.service.listGroups();
	}

	// @States(State.Local, State.Online)
	public async updateGroup(props: {
		groupName: string;
		description?: string;
		precedence?: number;
	}): Promise<GroupResponse> {
		return this.service.updateGroup(props);
	}
	//#endregion
}

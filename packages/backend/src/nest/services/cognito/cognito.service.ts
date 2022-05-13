import {
	CognitoService,
	CognitoServiceProps,
} from "@gylfie/common/lib/cognito";
// import { DynamoDBMap, Key } from "@gylfie/common/lib/dynamo";
import { Inject, Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { COGNITO_PROPS } from "../../modules/cognito/cognito.constants";
import { NestLoggerService } from "../logger";

export interface NestCognitoServiceProps extends CognitoServiceProps {
	port?: number;
	clientID?: string;
	userPoolID?: string;
}

/**
 * Gylfie Nestjs Cognito Service
 * @decorator `@Injectable`
 * @decorator `// @ServiceState`
 * @param props - The properties required to create the service
 * @param dynamoService - DynamoService provided through DI
 * @param configService - ConfigService provided through DI
 * @param logger - LoggerService provided through DI
 */

@Injectable()
// @ServiceState(9229, "LOCAL_COGNITO_PORT")
export class NestCognitoService extends CognitoService {
	constructor(
		// Will practically need dynamo for account retrieval
		// Or a form of database service
		// Currently Dynamo
		@Inject(COGNITO_PROPS)
		props: NestCognitoServiceProps,
		// private dynamoService: DynamoService,
		@Optional()
		configService?: ConfigService,
		@Optional()
		logger?: NestLoggerService
	) {
		super({
			...props,
			port:
				props.port ?? configService?.get<number>("LOCAL_COGNITO_PORT"),
			region:
				props.region ?? configService?.get<string>("COGNITO_REGION"),
			logger,
		});
	}
}

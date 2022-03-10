import {
	LambdaClient,
	InvokeCommand,
	LogType,
	InvocationType,
} from "@aws-sdk/client-lambda";
import { Injectable, Inject, Optional, forwardRef } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestLoggerService } from "../logger/logger.service";
import {
	BaseService,
	BaseServiceProps,
	GylfieError,
	State,
} from "@gylfie/common/lib/base";
import { LAMBDA_PROPS } from "../../modules/lambda";
import { LambdaFunction } from "@gylfie/common/lib/lambda";
import { fromEnv } from "@aws-sdk/credential-providers";
import { BaseNestService } from "../../base";

export interface NestLambdaServiceProps extends BaseServiceProps {}

@Injectable()
export class NestLambdaService extends BaseNestService {
	public state: State;
	private lambda: LambdaClient;
	private functions: { [key: string]: LambdaFunction } = {};
	// private port: number;
	constructor(
		@Inject(LAMBDA_PROPS)
		private readonly props: NestLambdaServiceProps,
		@Optional()
		protected configService?: ConfigService,
		// @Optional()
		@Inject(forwardRef(() => NestLoggerService))
		private logger?: NestLoggerService
	) {
		super();
		// The local state of this will have to use
		// https://github.com/ashiina/lambda-local

		this.lambda = new LambdaClient({
			region: "eu-west-1",
			credentials: props.credentials ?? fromEnv(),
		});
		this.state = State.Online;
	}

	public async invokeLambda(
		FunctionName: string,
		options?: {
			payload?: any;
			qualifier?: string;
			logType?: keyof typeof LogType;
			invocationType?: keyof typeof InvocationType;
		}
	) {
		const logType: LogType = LogType[options?.logType ?? "Tail"];
		const invokeType: InvocationType =
			InvocationType[options?.invocationType ?? "RequestResponse"];
		try {
			const { Payload } = await this.lambda.send(
				new InvokeCommand({
					FunctionName,
					Payload: options?.payload,
					Qualifier: options?.qualifier,
					LogType: logType,
					InvocationType: invokeType,
					// ClientContext -> Might pass the current function and stuff like that
				})
			);
			if (Payload) {
				return JSON.parse(JSON.stringify(Payload));
			}
		} catch (err) {
			// throw new GylfieError(err);
			throw new Error(err as any); //Fix
		}
	}

	public getFunction(functionName: string) {
		return this.functions[functionName];
	}

	protected errorHandler(err?: any, inner?: GylfieError): GylfieError {
		throw new Error("Method not implemented.");
	}
}

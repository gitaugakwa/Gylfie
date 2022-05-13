import {
	LambdaClient,
	InvokeCommand,
	LogType,
	InvocationType,
} from "@aws-sdk/client-lambda";
import { BaseService, BaseServiceProps, State } from "../../base/services";
import { LambdaFunction } from "../models";
import { GylfieError } from "../../base/errors";
import { fromEnv } from "@aws-sdk/credential-providers";
import { LAMBDA_REGION, LOCAL_LAMBDA_PORT } from "../constants";

export interface LambdaServiceProps extends BaseServiceProps {
	region?: string;
	port?: number;
}

export class LambdaService extends BaseService {
	private lambda!: LambdaClient;
	private port: number;
	private functions: { [key: string]: LambdaFunction } = {};
	// private port: number;
	constructor(props?: LambdaServiceProps) {
		super();
		// The local state of this will have to use
		// https://github.com/ashiina/lambda-local
		this.port =
			props?.port ??
			(parseInt(process.env.LOCAL_LAMBDA_PORT ?? "") ||
				LOCAL_LAMBDA_PORT);

		if (this.isLocal()) {
			this.state = State.LOCAL;
			this.isLocalActive(this.port).then((active) => {
				if (active) {
					props?.logger?.info(
						`LambdaService (${this.state}): Local Is ACTIVE`
					);
				} else {
					props?.logger?.warn(
						`LambdaService (${this.state}): Local Is INACTIVE`
					);
				}
				this.lambda = new LambdaClient({
					endpoint: `http://localhost:${this.port}`,
					region: props?.region ?? LAMBDA_REGION,
					credentials: props?.credentials ?? fromEnv(),
				});
				props?.logger?.info(
					`LambdaService (${this.state}): LambdaClient Initialized`
				);
			});
			return;
		}

		this.state = State.ONLINE;
		this.lambda = new LambdaClient({
			region: props?.region ?? LAMBDA_REGION,
			credentials: props?.credentials ?? fromEnv(),
		});
		props?.logger?.info(
			`LambdaService (${this.state}): LambdaClient Initialized`
		);
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

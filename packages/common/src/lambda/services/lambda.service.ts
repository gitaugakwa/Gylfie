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
	private lambda: LambdaClient;
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

		this.lambda = new LambdaClient({
			region: props?.region ?? LAMBDA_REGION,
			credentials: props?.credentials ?? fromEnv(),
		});
		this.state = State.ONLINE;
		props?.logger?.info({
			message: "LambdaClient Initialized",
			state: this.state,
			service: "LambdaService",
		});
		const initializeLocalClient = () => {
			props?.logger?.info({
				message: "Local Is ACTIVE",
				state: this.state,
				service: "LambdaService",
			});
			this.lambda = new LambdaClient({
				endpoint: `http://localhost:${this.port}`,
				region: props?.region ?? LAMBDA_REGION,
				credentials: props?.credentials ?? fromEnv(),
			});
			this.state = State.LOCAL;
			props?.logger?.info({
				message: "LambdaClient Initialized",
				state: this.state,
				service: "LambdaService",
			});
		};
		if (this.isLocal()) {
			if (props?.local?.isActive) {
				initializeLocalClient();
			} else if (props?.local?.checkIfActive ?? true) {
				this.isLocalActive(this.port).then((active) => {
					if (active) {
						initializeLocalClient();
					} else {
						props?.logger?.warn({
							message: "Local Is INACTIVE",
							state: this.state,
							service: "LambdaService",
						});
					}
				});
			} else {
				props?.logger?.warn({
					message: "Local Is INACTIVE",
					state: this.state,
					service: "LambdaService",
				});
			}
			return;
		}
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

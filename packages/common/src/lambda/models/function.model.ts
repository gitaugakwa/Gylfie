import {
	InvocationType,
	InvokeCommand,
	LambdaClient,
} from "@aws-sdk/client-lambda";
import { GylfieError } from "../../base/errors";

export interface LambdaFunctionProps {
	functionName: string;
}

interface StatusReturn {
	StatusCode?: number;
}

interface ResponseReturn extends StatusReturn {
	ExecutedVersion?: string;
	FunctionError?: string;
	LogResult?: string;
	Payload?: any;
}

type InvokeReturnType = StatusReturn | ResponseReturn;

export class LambdaFunction {
	constructor(
		private client: LambdaClient,
		private props: LambdaFunctionProps
	) {}

	public async invoke(
		Payload: any,
		invocationType: InvocationType.Event
	): Promise<StatusReturn>;
	public async invoke(
		Payload: any,
		invocationType: InvocationType.DryRun
	): Promise<StatusReturn>;
	public async invoke(
		Payload: any,
		invocationType: InvocationType.RequestResponse
	): Promise<ResponseReturn>;
	public async invoke(
		requestPayload: any,
		invocationType: InvocationType = InvocationType.RequestResponse
	): Promise<InvokeReturnType> {
		try {
			const {
				ExecutedVersion,
				FunctionError,
				LogResult,
				Payload,
				StatusCode,
			} = await this.client.send(
				new InvokeCommand({
					FunctionName: this.props.functionName,
					Payload: requestPayload,
					InvocationType: invocationType,
				})
			);
			console.log({
				ExecutedVersion,
				FunctionError,
				LogResult,
				Payload,
				StatusCode,
			});
			switch (invocationType) {
				case InvocationType.Event: {
					return { StatusCode };
				}
				case InvocationType.DryRun: {
					return { StatusCode };
				}
				case InvocationType.RequestResponse: {
					return {
						ExecutedVersion,
						FunctionError,
						LogResult,
						Payload,
						StatusCode,
					};
				}
			}
		} catch (err) {
			// throw new GylfieError(err);
			throw new Error(err as any); // Fix
		}
	}
}

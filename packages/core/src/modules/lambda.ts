import { Context } from "aws-lambda";
import { GylfieEvent } from "../events";
import { GylfieModule, GylfieModuleProps } from "./module";

export interface LambdaModuleProps extends GylfieModuleProps {
	// ignoreStage?: boolean;
	// cors?: CorsOptions;
}

export interface QueryProps {
	ignoreStage: boolean;
}

// We will add Callback support later if required
// LambdaModule does not necessarily need a server
// Say I want to use the library to create a function to trigger the pipeline
export abstract class LambdaModule<
	TEvent extends GylfieEvent,
	TResult
	// TCallback,
> extends GylfieModule {
	constructor(props?: LambdaModuleProps) {
		super(props);
	}
	// Lambda only requirement maybe
	// could call it request
	abstract query(
		event: TEvent,
		context: Context,
		props?: QueryProps
	): Promise<TResult>;
}

// const lambdaModule = new LambdaModule<ExpressServer>({}, ExpressServer);
// lambdaModule;

// export const handler = lambdaModule.handler;

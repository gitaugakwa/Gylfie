import {
	APIGatewayProxyCallbackV2,
	APIGatewayProxyEventV2,
	APIGatewayProxyResultV2,
	Context,
} from "aws-lambda";
// import { CorsOptions, CorsOptionsDelegate } from "cors";
// import express, { Express } from "express";
import { GylfieEvent } from "../events";
import { ExpressServer, GylfieServer } from "../servers";
import { RequestOptions, IncomingMessage, request } from "http";
import { LambdaModule, LambdaModuleProps, QueryProps } from "./lambda";
import isType from "type-is";
import { GylfieServerModule } from "./server";
// import { clone } from "lodash";

export interface LambdaServerModuleProps extends LambdaModuleProps {
	// ignoreStage?: boolean;
	// cors?: CorsOptions;
}

interface LambdaServerEvent extends GylfieEvent {
	httpMethod?: string;
}

// This will essentially allow us to have a server in the lambda
// This should be like a lambda server
// There should be a method to make a call now with the different entry values
// We will use LambdaModule as a base class then explode it into
// APIGatewayV2Module<TServer>

// We will add Callback support later if required
// LambdaModule does not necessarily need a server
// Say I want to use the library to create a function to trigger the pipeline
export abstract class LambdaServerModule<
	TEvent extends GylfieEvent,
	TResult,
	// TCallback,
	TServer extends GylfieServer = ExpressServer
> extends LambdaModule<TEvent, TResult> {
	public abstract server: TServer;
	// Fix errors
	protected resolve: (value: TResult | PromiseLike<TResult>) => void = (
		value
	) => {
		throw new Error("Resolve called before Promise creation");
	};
	protected reject: (reason?: Error) => void = () => {
		throw new Error("Reject called before Promise creation");
	};

	constructor(props?: LambdaServerModuleProps) {
		super(props);
	}
	protected abstract mapEventToHttpRequest(
		event: TEvent,
		context: Context,
		props?: QueryProps
	): RequestOptions;
	protected abstract forwardResponse(response: IncomingMessage): void;
	protected abstract forwardConnectionErrorResponse(error: Error): void;
	protected abstract forwardLibraryErrorResponse(error: any): void;
	// Lambda only requirement maybe
	protected abstract getRequestMethod(event: TEvent): string;
	protected abstract getPathWithQueryStringParams(
		event: TEvent,
		props: QueryProps
	): string;

	// Lambda only requirement maybe
	protected getEventBody(event: TEvent) {
		if (event.body) {
			return Buffer.from(
				event.body,
				event.isBase64Encoded ? "base64" : "utf8"
			);
		}
		return Buffer.from("Empty Body");
	}

	protected getContentType(params: {
		contentTypeHeader: string | undefined;
	}): string {
		// only compare mime type; ignore encoding part
		return params.contentTypeHeader
			? params.contentTypeHeader.split(";")[0]
			: "";
	}

	protected isContentTypeBinaryMimeType(params: {
		binaryMimeTypes: string;
		contentType: string;
	}) {
		return (
			params.binaryMimeTypes.length > 0 &&
			!!isType.is(params.contentType, params.binaryMimeTypes)
		);
	}

	// Lambda only requirement maybe
	protected async forwardRequestToServer(
		event: TEvent,
		context: Context,
		props?: QueryProps
	): Promise<void> {
		try {
			const requestOptions = this.mapEventToHttpRequest(
				event,
				context,
				props
			);
			console.log(requestOptions);
			const req = request(requestOptions, (response: IncomingMessage) =>
				this.forwardResponse(response)
			);
			// We can handle this better
			// But most requests to a server include a body
			if (event.body) {
				const body = this.getEventBody(event);
				req.write(body);
			}
			req.on("error", (error) =>
				this.forwardConnectionErrorResponse(error)
			).end();
			return;
		} catch (error) {
			this.forwardLibraryErrorResponse(error);
			return;
		}
	}

	// Lambda only requirement maybe
	// could call it request
	public async query(
		event: TEvent,
		context: Context,
		props?: QueryProps
		// callback?: TCallback
	): Promise<TResult> {
		return new Promise<TResult>((resolve, reject) => {
			// move the exits to the Module scope
			this.reject = reject;
			this.resolve = resolve;
			if (this.server._isListening) {
				this.forwardRequestToServer(event, context, props);
			} else {
				this.server
					.start()
					.server.on("listening", () =>
						this.forwardRequestToServer(event, context, props)
					);
			}
		});
	}
}

// const lambdaModule = new LambdaModule<ExpressServer>({}, ExpressServer);
// lambdaModule;

// export const handler = lambdaModule.handler;

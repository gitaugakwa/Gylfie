import { INestApplication, NestApplicationOptions } from "@nestjs/common";
import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import {
	ExpressServer,
	LambdaServerModule,
	LambdaServerModuleProps,
	GylfieEvent,
	GylfieModule,
	GylfieModuleProps,
	GylfieServer,
	QueryProps,
} from "@gylfie/core";
import { Context } from "aws-lambda";
// import { CorsOptions } from "cors";

export enum GylfieNestMode {
	Local,
	Serverless,
	Hybrid,
}

interface Serverless<T> {
	module: new (props?: LambdaServerModuleProps) => T;
	props?: LambdaServerModuleProps;
}

export interface GylfieNestModuleProps<T>
	extends GylfieModuleProps,
		NestApplicationOptions {
	module: any;

	mode?: GylfieNestMode;

	cors?: CorsOptions;

	serverless?: Serverless<T>;
}

interface GylfieNestModuleServerlessProps<T> extends GylfieNestModuleProps<T> {
	serverless: Serverless<T>;
}

// Should be able to support both Serverless and on Server
export class GylfieNestModule<
	TEvent extends GylfieEvent,
	TResult,
	TServerless extends LambdaServerModule<
		TEvent,
		TResult,
		// TCallback,
		TServer
	>,
	TServer extends GylfieServer = ExpressServer
> extends GylfieModule {
	localApp?: INestApplication;
	serverlessApp?: INestApplication;
	serverlessModule?: TServerless;
	private initialization: Promise<INestApplication>;
	constructor(props: GylfieNestModuleProps<TServerless>) {
		super(props);
		this.initialization = this.init(props);
	}

	private async init(
		props: GylfieNestModuleProps<TServerless>
	): Promise<INestApplication> {
		switch (props.mode) {
			case GylfieNestMode.Local: {
				return this.initLocal(props);
			}
			case GylfieNestMode.Serverless: {
				if (props.serverless) {
					return this.initServerless(
						props as GylfieNestModuleServerlessProps<TServerless>
					);
				}
				throw new Error();
			}
			case GylfieNestMode.Hybrid: {
				if (props.serverless) {
					this.initLocal(props);
					return this.initServerless(
						props as GylfieNestModuleServerlessProps<TServerless>
					);
				}
				return this.initLocal(props);
			}
			default: {
				if (props.serverless?.module) {
					this.serverlessModule = new props.serverless.module(
						props.serverless.props
					);
					this.serverlessApp = await NestFactory.create(
						props.module,
						new ExpressAdapter(
							this.serverlessModule.server.requestListener
						),
						props
					);
					// this.app.init();
					return this.serverlessApp;
				}
				console.log("Local Default");
				this.localApp = await NestFactory.create(props.module);
				return this.localApp;
			}
		}
	}

	private async initServerless(
		props: GylfieNestModuleServerlessProps<TServerless>
	): Promise<INestApplication> {
		this.serverlessModule = new props.serverless.module(
			props.serverless?.props
		);
		this.serverlessApp = await NestFactory.create(
			props.module,
			new ExpressAdapter(this.serverlessModule.server.requestListener),
			props
		);
		// this.app.init();
		return this.serverlessApp;
	}

	private async initLocal(
		props: GylfieNestModuleProps<TServerless>
	): Promise<INestApplication> {
		this.localApp = await NestFactory.create(props.module);
		return this.localApp;
	}

	public async query(
		event: TEvent,
		context: Context,
		props?: QueryProps
		// callback?: TCallback
	): Promise<TResult> {
		// Wait for the module to be initialized
		await this.initialization;
		if (this.serverlessModule) {
			return this.serverlessModule.query(event, context, props);
		}
		throw new Error(
			"Module has not been configured for to be queried." +
				" Ensure that you have provided a serverless module."
		);
	}

	public async listen(
		port: string | number,
		callback?: (() => void) | undefined
	): Promise<any> {
		await this.initialization;
		if (this.localApp) {
			return this.localApp.listen(port, callback);
		}
		return;
	}
}

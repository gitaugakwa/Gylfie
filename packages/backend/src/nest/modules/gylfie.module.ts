import { DynamicModule, Module, Provider, Type } from "@nestjs/common";
import { BaseModule, BaseModuleProps } from "@gylfie/common/lib/base";
import { LoggerServiceModuleProps } from "./logger";
import { LambdaServiceModuleProps } from "./lambda";
import { DynamoServiceModuleProps } from "./dynamo";
import { CognitoServiceModuleProps } from "./cognito";
import { S3ServiceModuleProps } from "./s3";
import { AuthenticationServiceModuleProps } from "./authentication";
import { CacheServiceModuleProps } from "./cache";

export interface GylfieModuleProps extends BaseModuleProps {
	dynamo?: DynamoServiceModuleProps;
	cache?: CacheServiceModuleProps;
	cognito?: CognitoServiceModuleProps;
	s3?: S3ServiceModuleProps;
	logger?: LoggerServiceModuleProps;
	lambda?: LambdaServiceModuleProps;
	authentication?: AuthenticationServiceModuleProps;
}

@Module({})
export class GylfieModule extends BaseModule {
	static async forRoot(props?: GylfieModuleProps): Promise<DynamicModule> {
		// Will set all nested Modules to global
		const modules: { [key: string]: DynamicModule } = {};
		const providers: Provider<any>[] = [];
		const controllers: Type<any>[] = [];
		if (props) {
			const {
				cognito,
				dynamo,
				logger,
				s3,
				lambda,
				authentication,
				cache,
				...baseModuleProps
			} = props;
			this.mergeEnv();
			// console.log("Inside Gylfie Module ForRoot");
			// const baseProps = this.parseBaseProps(props);
			const baseProps = this.parseBaseProps(baseModuleProps);
			const modulePromises: Promise<void>[] = [];
			// console.log("Pre dynamo");
			if (cache) {
				// console.log("Inside cache");
				modulePromises.push(
					new Promise(async (res) => {
						modules["cache"] = (
							await import("./cache")
						).CacheModule.forRoot(cache, baseProps);
						if (modules["cache"].providers) {
							providers.push(...modules["cache"].providers);
						}
						if (modules["cache"].controllers) {
							controllers.push(...modules["cache"].controllers);
						}
						res();
						return;
					})
				);
			}
			if (dynamo) {
				// console.log("Inside dynamo");
				modulePromises.push(
					new Promise(async (res) => {
						modules["dynamo"] = (
							await import("./dynamo")
						).DynamoModule.forRoot(dynamo, baseProps);
						if (modules["dynamo"].providers) {
							providers.push(...modules["dynamo"].providers);
						}
						if (modules["dynamo"].controllers) {
							controllers.push(...modules["dynamo"].controllers);
						}
						res();
						return;
					})
				);
			}
			// console.log("Pre cognito");
			if (cognito) {
				// console.log("Inside Cognito");
				modulePromises.push(
					new Promise(async (res) => {
						modules["cognito"] = (
							await import("./cognito")
						).CognitoModule.forRoot(cognito, baseProps);
						if (modules["cognito"].providers) {
							providers.push(...modules["cognito"].providers);
						}
						if (modules["cognito"].controllers) {
							controllers.push(...modules["cognito"].controllers);
						}
						res();
						return;
					})
				);
			}
			// console.log("Pre S3");
			if (s3) {
				// console.log("Inside S3");
				modulePromises.push(
					new Promise(async (res) => {
						modules["s3"] = (await import("./s3")).S3Module.forRoot(
							s3,
							baseProps
						);
						if (modules["s3"].providers) {
							providers.push(...modules["s3"].providers);
						}
						if (modules["s3"].controllers) {
							controllers.push(...modules["s3"].controllers);
						}
						res();
					})
				);
			}
			// console.log("Pre Logger");
			if (logger) {
				// console.log("Inside Logger");
				modulePromises.push(
					new Promise(async (res) => {
						modules["logger"] = (
							await import("./logger")
						).LoggerModule.forRoot(logger, baseProps);
						if (modules["logger"].providers) {
							providers.push(...modules["logger"].providers);
						}
						if (modules["logger"].controllers) {
							controllers.push(...modules["logger"].controllers);
						}
						res();
						return;
					})
				);
			}
			// 	console.log("pre Lambda");
			// 	if (logger?.serviceProps.lambda || lambda) {
			// 		console.log("Inside Lambda");
			// 		modules["lambda"] = LambdaModule.forRoot(
			// 			lambda ?? {
			// 				serviceProps: { ...logger?.serviceProps },
			// 			},
			// 			baseProps
			// 		);
			// 		if (modules["lambda"].providers) {
			// 			providers.push(...modules["lambda"].providers);
			// 		}
			// 		if (modules["lambda"].controllers) {
			// 			controllers.push(...modules["lambda"].controllers);
			// 		}
			// 	}
			// 	if (signer && decoder) {
			// 		console.log(
			// 			"Both the Token Signer and the Token Decoder should not be in the same app."
			// 		);
			// 		console.log(
			// 			"We recommend you move the Signer to a separate independent app."
			// 		);
			// 	}
			// 	console.log("pre signer");
			// 	if (signer) {
			// 		console.log("Inside signer");
			// 		modules["signer"] = SignerModule.forRoot(signer, baseProps);
			// 		if (modules["signer"].providers) {
			// 			providers.push(...modules["signer"].providers);
			// 		}
			// 		if (modules["signer"].controllers) {
			// 			controllers.push(...modules["signer"].controllers);
			// 		}
			// 	}
			// 	console.log("pre decoder");
			// 	if (decoder) {
			// 		console.log("Inside decoder");
			// 		modules["decoder"] = DecoderModule.forRoot(decoder, baseProps);
			// 		if (modules["decoder"].providers) {
			// 			providers.push(...modules["decoder"].providers);
			// 		}
			// 		if (modules["decoder"].controllers) {
			// 			controllers.push(...modules["decoder"].controllers);
			// 		}
			// 	}
			// 	console.log("ForRoot complete");
			await Promise.all(modulePromises);
		}

		return {
			module: GylfieModule,
			global: props?.isGlobal,
			providers,
			controllers,
			exports: providers,
		};
	}
}

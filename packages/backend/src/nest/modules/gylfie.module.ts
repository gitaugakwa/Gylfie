import { DynamicModule, Module, Provider, Type } from "@nestjs/common";
import { BaseModule, BaseModuleProps } from "@gylfie/common/lib/base";
import { LoggerServiceModuleProps } from "./logger";
import { LambdaServiceModuleProps } from "./lambda";
import { DynamoServiceModuleProps } from "./dynamo";
import { CognitoServiceModuleProps } from "./cognito";
import { S3ServiceModuleProps } from "./s3";
import { AuthenticationServiceModuleProps } from "./authentication";
import { CacheServiceModuleProps } from "./cache";
import { map, values } from "lodash";

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
		try {
			const imports: { [key: string]: DynamicModule } = {};
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
				if (logger) {
					// console.log("Inside Logger");
					modulePromises.push(
						import("./logger/logger.module")
							.then(({ LoggerModule }) => {
								imports["logger"] = LoggerModule.forRoot(
									logger,
									baseProps
								);
								if (imports["logger"].providers) {
									providers.push(
										...imports["logger"].providers
									);
								}
								if (imports["logger"].controllers) {
									controllers.push(
										...imports["logger"].controllers
									);
								}
								return;
							})
							.catch((err) => {
								console.log(err);
							})
					);
				}

				if (cache) {
					// console.log("Inside cache");

					modulePromises.push(
						import("./cache/cache.module")
							.then(({ CacheModule }) => {
								imports["cache"] = CacheModule.forRoot(
									cache,
									baseProps
								);
								if (imports["cache"].providers) {
									providers.push(
										...imports["cache"].providers
									);
								}
								if (imports["cache"].controllers) {
									controllers.push(
										...imports["cache"].controllers
									);
								}
								return;
							})
							.catch((err) => {
								console.log(err);
							})
					);
				}
				if (dynamo) {
					// console.log("Inside dynamo");
					modulePromises.push(
						import("./dynamo/dynamo.module")
							.then(async ({ DynamoModule }) => {
								imports["dynamo"] = await DynamoModule.forRoot(
									dynamo,
									baseProps
								);
								if (imports["dynamo"].providers) {
									providers.push(
										...imports["dynamo"].providers
									);
								}
								if (imports["dynamo"].controllers) {
									controllers.push(
										...imports["dynamo"].controllers
									);
								}
							})
							.catch((err) => {
								console.log(err);
							})
					);
				}
				// console.log("Pre cognito");
				if (cognito) {
					// console.log("Inside Cognito");
					modulePromises.push(
						import("./cognito/cognito.module")
							.then(async ({ CognitoModule }) => {
								imports["cognito"] =
									await CognitoModule.forRoot(
										cognito,
										baseProps
									);
								if (imports["cognito"].providers) {
									providers.push(
										...imports["cognito"].providers
									);
								}
								if (imports["cognito"].controllers) {
									controllers.push(
										...imports["cognito"].controllers
									);
								}
							})
							.catch((err) => {
								console.log(err);
							})
					);
				}
				// console.log("Pre S3");
				if (s3) {
					// console.log("Inside S3");
					modulePromises.push(
						import("./s3/s3.module")
							.then(async ({ S3Module }) => {
								imports["s3"] = await S3Module.forRoot(
									s3,
									baseProps
								);
								if (imports["s3"].providers) {
									providers.push(...imports["s3"].providers);
								}
								if (imports["s3"].controllers) {
									controllers.push(
										...imports["s3"].controllers
									);
								}
							})
							.catch((err) => {
								console.log(err);
							})
					);
				}
				// console.log("Pre Logger");

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
				await Promise.all(modulePromises).catch((err) => {
					console.log(err);
				});
			}

			return {
				module: GylfieModule,
				global: props?.isGlobal,
				// imports: values(imports),
				providers,
				controllers,
				exports: providers,
			};
		} catch (err) {
			console.log(err);
			throw err;
		}
	}
}

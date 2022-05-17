import { LOCAL_LAMBDA_PORT } from "@gylfie/common";
import {
	BaseModule,
	BaseModuleProps,
	BaseServiceModuleProps,
} from "@gylfie/common/lib/base";
import { DynamicModule, Module } from "@nestjs/common";
import { LambdaController } from "../../controllers/lambda/lambda.controller";
import {
	NestLambdaService,
	NestLambdaServiceProps,
} from "../../services/lambda/lambda.service";
import { LAMBDA_PROPS } from "./lambda.constants";

export interface LambdaServiceModuleProps
	extends BaseServiceModuleProps<NestLambdaServiceProps> {}

export interface LambdaModuleProps
	extends BaseModuleProps,
		LambdaServiceModuleProps {}

@Module({
	controllers: [LambdaController],
	providers: [NestLambdaService],
	exports: [NestLambdaService],
})
export class LambdaModule extends BaseModule {
	static async forRoot(
		props: LambdaServiceModuleProps,
		base: BaseModuleProps
	): Promise<DynamicModule>;
	static async forRoot(props: LambdaModuleProps): Promise<DynamicModule>;
	static async forRoot(
		props: LambdaModuleProps | LambdaServiceModuleProps,
		base?: BaseModuleProps
	): Promise<DynamicModule> {
		// It should be able to read values in a dotenv
		// Such as Account ID, Service, and maybe the version of the sdk being run
		//
		const lambdaProps = this.getProps<
			NestLambdaServiceProps,
			LambdaServiceModuleProps,
			LambdaModuleProps
		>(props, base);

		if (
			NestLambdaService.isLocal() &&
			(lambdaProps.local?.checkIfActive ?? true) &&
			!lambdaProps.local?.isActive
		) {
			(lambdaProps.local ??= {}).isActive =
				await NestLambdaService.isLocalActive(
					lambdaProps.port ??
						(parseInt(process.env.LOCAL_LAMBDA_PORT ?? "") ||
							LOCAL_LAMBDA_PORT)
				);
		}

		const controllers = props.controller ? [LambdaController] : undefined;

		return {
			module: LambdaModule,
			global: base?.isGlobal,
			controllers,
			providers: [
				{ provide: LAMBDA_PROPS, useValue: lambdaProps },
				NestLambdaService,
			],
			exports: [NestLambdaService],
		};
	}
}

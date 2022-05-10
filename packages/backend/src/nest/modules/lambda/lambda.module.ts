import { DynamicModule, Module } from "@nestjs/common";
import { LambdaController } from "../../controllers/lambda/lambda.controller";
import {
	BaseModuleProps,
	BaseModule,
	BaseServiceProps,
	BaseServiceModuleProps,
} from "@gylfie/common/lib/base";
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
	static forRoot(
		props: LambdaServiceModuleProps,
		base: BaseModuleProps
	): DynamicModule;
	static forRoot(props: LambdaModuleProps): DynamicModule;
	static forRoot(
		props: LambdaModuleProps | LambdaServiceModuleProps,
		base?: BaseModuleProps
	): DynamicModule {
		// It should be able to read values in a dotenv
		// Such as Account ID, Service, and maybe the version of the sdk being run
		//
		const lambdaProps = this.getProps<
			NestLambdaServiceProps,
			LambdaServiceModuleProps,
			LambdaModuleProps
		>(props, base);

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

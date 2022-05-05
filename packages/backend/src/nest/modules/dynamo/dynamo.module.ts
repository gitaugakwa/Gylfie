import { DynamicModule, Module } from "@nestjs/common";
import { DynamoController } from "../../controllers/dynamo/dynamo.controller";
import {
	BaseModuleProps,
	BaseModule,
	BaseServiceProps,
	BaseServiceModuleProps,
} from "@gylfie/common/lib/base";
import { ConfigService } from "@nestjs/config";
import { NestDynamoService, NestDynamoServiceProps } from "../../services";
import { DYNAMO_PROPS } from "./dynamo.constants";

export interface DynamoServiceModuleProps
	extends BaseServiceModuleProps<NestDynamoServiceProps> {}

export interface DynamoModuleProps
	extends BaseModuleProps,
		DynamoServiceModuleProps {}

@Module({
	controllers: [DynamoController],
	providers: [NestDynamoService],
	exports: [NestDynamoService],
})
export class DynamoModule extends BaseModule {
	static forRoot(
		props: DynamoServiceModuleProps,
		base: BaseModuleProps
	): DynamicModule;
	static forRoot(props: DynamoModuleProps): DynamicModule;
	static forRoot(
		props: DynamoModuleProps | DynamoServiceModuleProps,
		base?: BaseModuleProps
	): DynamicModule {
		// It should be able to read values in a dotenv
		// Such as Account ID, Service, and maybe the version of the sdk being run
		//
		const dynamoProps = this.getProps<
			NestDynamoServiceProps,
			DynamoServiceModuleProps,
			DynamoModuleProps
		>(props, base);

		const controllers = props.controller ? [DynamoController] : undefined;

		return {
			module: DynamoModule,
			global: base?.isGlobal,
			controllers,
			providers: [
				{ provide: DYNAMO_PROPS, useValue: dynamoProps },
				NestDynamoService,
				ConfigService,
			],
			exports: [NestDynamoService],
		};
	}
}

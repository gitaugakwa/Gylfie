import { DynamicModule, Module } from "@nestjs/common";
import { CognitoController } from "../../controllers/cognito/cognito.controller";
import {
	BaseModule,
	BaseModuleProps,
	BaseServiceModuleProps,
	BaseServiceProps,
} from "@gylfie/common/lib/base";
import { ConfigService } from "@nestjs/config";
import {
	NestCognitoService,
	NestCognitoServiceProps,
} from "../../services/cognito";
import { COGNITO_PROPS } from "./cognito.constants";

export interface CognitoServiceModuleProps
	extends BaseServiceModuleProps<NestCognitoServiceProps> {}

export interface CognitoModuleProps
	extends BaseModuleProps,
		CognitoServiceModuleProps {}

@Module({
	controllers: [CognitoController],
	providers: [NestCognitoService],
	exports: [NestCognitoService],
})
export class CognitoModule extends BaseModule {
	static forRoot(
		props: CognitoServiceModuleProps,
		base: BaseModuleProps
	): DynamicModule;
	static forRoot(props: CognitoModuleProps): DynamicModule;
	static forRoot(
		props: CognitoModuleProps | CognitoServiceModuleProps,
		base?: BaseModuleProps
	): DynamicModule {
		// It should be able to read values in a dotenv
		// Such as Account ID, Service, and maybe the version of the sdk being run
		//

		const cognitoProps = this.getProps<
			NestCognitoServiceProps,
			CognitoServiceModuleProps,
			CognitoModuleProps
		>(props, base);

		const controllers = props.controller ? [CognitoController] : undefined;

		return {
			module: CognitoModule,
			global: base?.isGlobal,
			controllers,
			providers: [
				{ provide: COGNITO_PROPS, useValue: cognitoProps },
				NestCognitoService,
				ConfigService,
			],
			exports: [NestCognitoService],
		};
	}
}

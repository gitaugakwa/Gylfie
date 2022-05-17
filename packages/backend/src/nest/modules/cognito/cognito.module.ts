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
} from "../../services/cognito/cognito.service";
import { COGNITO_PROPS } from "./cognito.constants";
import { LOCAL_COGNITO_PORT } from "@gylfie/common";

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
	static async forRoot(
		props: CognitoServiceModuleProps,
		base: BaseModuleProps
	): Promise<DynamicModule>;
	static async forRoot(props: CognitoModuleProps): Promise<DynamicModule>;
	static async forRoot(
		props: CognitoModuleProps | CognitoServiceModuleProps,
		base?: BaseModuleProps
	): Promise<DynamicModule> {
		// It should be able to read values in a dotenv
		// Such as Account ID, Service, and maybe the version of the sdk being run
		//

		const cognitoProps = this.getProps<
			NestCognitoServiceProps,
			CognitoServiceModuleProps,
			CognitoModuleProps
		>(props, base);

		if (
			NestCognitoService.isLocal() &&
			(cognitoProps.local?.checkIfActive ?? true) &&
			!cognitoProps.local?.isActive
		) {
			(cognitoProps.local ??= {}).isActive =
				await NestCognitoService.isLocalActive(
					cognitoProps.port ??
						(parseInt(process.env.LOCAL_COGNITO_PORT ?? "") ||
							LOCAL_COGNITO_PORT)
				);
		}

		const controllers = props.controller ? [CognitoController] : undefined;

		return {
			module: CognitoModule,
			global: base?.isGlobal,
			controllers,
			providers: [
				{ provide: COGNITO_PROPS, useValue: cognitoProps },
				NestCognitoService,
				// ConfigService,
			],
			exports: [NestCognitoService],
		};
	}
}

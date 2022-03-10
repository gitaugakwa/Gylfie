import { DynamicModule, Module, Provider, Type } from "@nestjs/common";
import {
	BaseModuleProps,
	BaseModule,
	BaseServiceProps,
	BaseServiceModuleProps,
} from "@gylfie/common/lib/base";
import {
	NestJwkService,
	NestJwkServiceProps,
	NestJwtService,
	NestJwtServiceProps,
} from "../../services/authentication";
import { JWK_PROPS, JWT_PROPS } from "./authentication.constants";

export interface AuthenticationServiceModuleProps {
	jwt: BaseServiceModuleProps<NestJwtServiceProps>;
	jwk: BaseServiceModuleProps<NestJwkServiceProps>;
}
export interface AuthenticationModuleProps
	extends BaseModuleProps,
		AuthenticationServiceModuleProps {}

@Module({
	imports: [],
	controllers: [],
	providers: [NestJwkService, NestJwtService],
	exports: [NestJwkService, NestJwtService],
})
export class AuthenticationModule extends BaseModule {
	static forRoot(
		props: AuthenticationServiceModuleProps,
		base: BaseModuleProps
	): DynamicModule;
	static forRoot(props: AuthenticationModuleProps): DynamicModule;
	static forRoot(
		props: AuthenticationModuleProps | AuthenticationServiceModuleProps,
		base?: BaseModuleProps
	): DynamicModule {
		// It should be able to read values in a dotenv
		// Such as Account ID, Service, and maybe the version of the sdk being run
		//

		const controllers: Type<any>[] = [];

		const jwtProps = this.getProps<
			NestJwtServiceProps,
			BaseServiceModuleProps<NestJwtServiceProps>,
			BaseServiceModuleProps<NestJwtServiceProps>
		>(props.jwt, base);
		const jwkProps = this.getProps<
			NestJwkServiceProps,
			BaseServiceModuleProps<NestJwkServiceProps>,
			BaseServiceModuleProps<NestJwkServiceProps>
		>(props.jwk, base);

		return {
			module: AuthenticationModule,
			global: base?.isGlobal,
			controllers,
			providers: [
				{ provide: JWT_PROPS, useValue: jwtProps },
				{ provide: JWK_PROPS, useValue: jwkProps },
				NestJwtService,
				NestJwkService,
			],
			exports: [NestJwkService, NestJwkService],
		};
	}
}

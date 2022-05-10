import { DynamicModule, Module } from "@nestjs/common";
import { CacheController } from "../../controllers/cache/cache.controller";
import {
	BaseModuleProps,
	BaseModule,
	BaseServiceProps,
	BaseServiceModuleProps,
} from "@gylfie/common/lib/base";
import { ConfigService } from "@nestjs/config";
import {
	NestCacheService,
	NestCacheServiceProps,
} from "../../services/cache/cache.service";
import { CACHE_PROPS } from "./cache.constants";

export interface CacheServiceModuleProps
	extends BaseServiceModuleProps<NestCacheServiceProps> {}

export interface CacheModuleProps
	extends BaseModuleProps,
		CacheServiceModuleProps {}

@Module({
	controllers: [CacheController],
	providers: [NestCacheService],
	exports: [NestCacheService],
})
export class CacheModule extends BaseModule {
	static forRoot(
		props: CacheServiceModuleProps,
		base: BaseModuleProps
	): DynamicModule;
	static forRoot(props: CacheModuleProps): DynamicModule;
	static forRoot(
		props: CacheModuleProps | CacheServiceModuleProps,
		base?: BaseModuleProps
	): DynamicModule {
		// It should be able to read values in a dotenv
		// Such as Account ID, Service, and maybe the version of the sdk being run
		//
		const cacheProps = this.getProps<
			NestCacheServiceProps,
			CacheServiceModuleProps,
			CacheModuleProps
		>(props, base);

		const controllers = props.controller ? [CacheController] : undefined;

		return {
			module: CacheModule,
			global: base?.isGlobal,
			controllers,
			providers: [
				{ provide: CACHE_PROPS, useValue: cacheProps },
				NestCacheService,
				ConfigService,
			],
			exports: [NestCacheService],
		};
	}
}

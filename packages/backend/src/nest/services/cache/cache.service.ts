import { CacheService, CacheServiceProps } from "@gylfie/common";
import { Inject, Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CACHE_PROPS } from "../../modules/cache/cache.constants";
import { NestLoggerService } from "../logger";

export interface NestCacheServiceProps extends CacheServiceProps {
	cache?: boolean | { duration?: number };
}

/**
 * Gylfie Nestjs Dynamo Service
 * @decorator `@Injectable`
 * @param props - The properties required to create the service
 * @param configService - ConfigService provided through DI
 * @param logger - NestLoggerService provided through DI
 */
@Injectable()
// @ServiceState(8000, "LOCAL_DYNAMO_PORT")
export class NestCacheService extends CacheService {
	constructor(
		@Inject(CACHE_PROPS)
		props: NestCacheServiceProps,
		@Optional()
		configService?: ConfigService,
		@Optional()
		logger?: NestLoggerService
	) {
		super({
			...props,
			logger,
		});
	}
}

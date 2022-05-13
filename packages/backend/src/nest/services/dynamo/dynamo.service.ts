import {
	DynamoService,
	DynamoServiceProps,
	TableProps,
} from "@gylfie/common/lib/dynamo";
import { Inject, Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DYNAMO_PROPS } from "../../modules/dynamo/dynamo.constants";
import { NestCacheService } from "../cache";
import { NestLoggerService } from "../logger";

export interface NestDynamoServiceProps extends DynamoServiceProps {
	tables: TableProps[];
	port?: number;
	cache?: boolean | { duration?: number };
}

/**
 * Gylfie Nestjs Dynamo Service
 * @decorator `@Injectable`
 * @param props - The properties required to create the service
 * @param configService - ConfigService provided through DI
 * @param logger - NestLoggerService provided through DI
 * @param cacheService - NestCacheService provided through DI
 */
@Injectable()
export class NestDynamoService extends DynamoService {
	constructor(
		@Inject(DYNAMO_PROPS)
		props: NestDynamoServiceProps,
		@Optional()
		configService?: ConfigService,
		@Optional()
		logger?: NestLoggerService,
		@Optional()
		cacheService?: NestCacheService
	) {
		super({
			...props,
			port: props.port ?? configService?.get<number>("LOCAL_DYNAMO_PORT"),
			region: props.region ?? configService?.get<string>("DYNAMO_REGION"),
			cacheService,
			logger,
		});
	}
}

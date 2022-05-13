import {
	LoggerService,
	LoggerServiceProps,
	LogLevelType,
} from "@gylfie/common/lib/logger";
import { Inject, Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LOGGER_PROPS } from "../../modules/logger/logger.constants";

export interface NestLoggerServiceProps extends LoggerServiceProps {
	lambda?: string;
	console?: LogLevelType[] | true;
}

@Injectable()
export class NestLoggerService extends LoggerService {
	constructor(
		@Inject(LOGGER_PROPS)
		props: NestLoggerServiceProps,
		@Optional()
		configService?: ConfigService // private moduleRef: ModuleRef
	) {
		super(props);
	}
}

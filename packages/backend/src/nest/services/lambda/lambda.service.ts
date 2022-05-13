import { LambdaService, LambdaServiceProps } from "@gylfie/common/lib/lambda";
import { forwardRef, Inject, Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LAMBDA_PROPS } from "../../modules/lambda";
import { NestLoggerService } from "../logger/logger.service";

export interface NestLambdaServiceProps extends LambdaServiceProps {}

@Injectable()
export class NestLambdaService extends LambdaService {
	constructor(
		@Inject(LAMBDA_PROPS)
		props: NestLambdaServiceProps,
		@Optional()
		configService?: ConfigService,
		// @Optional()
		@Inject(forwardRef(() => NestLoggerService))
		logger?: NestLoggerService
	) {
		super({
			...props,
			port: props.port ?? configService?.get<number>("LOCAL_LAMBDA_PORT"),
			region: props.region ?? configService?.get<string>("LAMBDA_REGION"),
			logger,
		});
	}
}

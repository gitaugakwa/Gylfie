import { BucketProps, S3Service, S3ServiceProps } from "@gylfie/common/lib/s3";
import { Inject, Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { S3_PROPS } from "../../modules/s3/s3.constants";
import { NestLoggerService } from "../logger";

export interface NestS3ServiceProps extends S3ServiceProps {
	buckets: BucketProps[];
	port?: number;
}

@Injectable()
// @ServiceState(4566, "LOCAL_S3_PORT")
export class NestS3Service extends S3Service {
	constructor(
		@Inject(S3_PROPS)
		props: NestS3ServiceProps,
		@Optional()
		configService?: ConfigService,
		@Optional()
		logger?: NestLoggerService
	) {
		super({
			...props,
			port: props.port ?? configService?.get<number>("LOCAL_S3_PORT"),
			region: props.region ?? configService?.get<string>("S3_REGION"),
			logger,
		});
	}
}

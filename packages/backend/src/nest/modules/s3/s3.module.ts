import { DynamicModule, Module } from "@nestjs/common";
import { S3Controller } from "../../controllers/s3/s3.controller";
import {
	BaseModule,
	BaseModuleProps,
	BaseServiceProps,
	BaseServiceModuleProps,
} from "@gylfie/common/lib/base";
import { NestS3Service, NestS3ServiceProps } from "../../services";
import { S3_PROPS } from "./s3.constants";

export interface S3ServiceModuleProps
	extends BaseServiceModuleProps<NestS3ServiceProps> {}

export interface S3ModuleProps extends BaseModuleProps, S3ServiceModuleProps {}

@Module({
	controllers: [S3Controller],
	providers: [NestS3Service],
	exports: [NestS3Service],
})
export class S3Module extends BaseModule {
	static forRoot(
		props: S3ServiceModuleProps,
		base: BaseModuleProps
	): DynamicModule;
	static forRoot(props: S3ModuleProps): DynamicModule;
	static forRoot(
		props: S3ModuleProps | S3ServiceModuleProps,
		base?: BaseModuleProps
	): DynamicModule {
		// It should be able to read values in a dotenv
		// Such as Account ID, Service, and maybe the version of the sdk being run
		//

		const bucketProps = this.getProps<
			NestS3ServiceProps,
			S3ServiceModuleProps,
			S3ModuleProps
		>(props, base);
		const controllers = props.controller ? [S3Controller] : undefined;

		return {
			module: S3Module,
			global: base?.isGlobal,
			controllers,
			providers: [
				{ provide: S3_PROPS, useValue: bucketProps },
				NestS3Service,
			],
			exports: [NestS3Service],
		};
	}
}

import { DynamicModule, Module } from "@nestjs/common";
import { S3Controller } from "../../controllers/s3/s3.controller";
import {
	BaseModule,
	BaseModuleProps,
	BaseServiceProps,
	BaseServiceModuleProps,
} from "@gylfie/common/lib/base";
import {
	NestS3Service,
	NestS3ServiceProps,
} from "../../services/s3/s3.service";
import { S3_PROPS } from "./s3.constants";
import { LOCAL_S3_PORT } from "@gylfie/common";

export interface S3ServiceModuleProps
	extends BaseServiceModuleProps<NestS3ServiceProps> {}

export interface S3ModuleProps extends BaseModuleProps, S3ServiceModuleProps {}

@Module({
	controllers: [S3Controller],
	providers: [NestS3Service],
	exports: [NestS3Service],
})
export class S3Module extends BaseModule {
	static async forRoot(
		props: S3ServiceModuleProps,
		base: BaseModuleProps
	): Promise<DynamicModule>;
	static async forRoot(props: S3ModuleProps): Promise<DynamicModule>;
	static async forRoot(
		props: S3ModuleProps | S3ServiceModuleProps,
		base?: BaseModuleProps
	): Promise<DynamicModule> {
		// It should be able to read values in a dotenv
		// Such as Account ID, Service, and maybe the version of the sdk being run
		//

		const s3Props = this.getProps<
			NestS3ServiceProps,
			S3ServiceModuleProps,
			S3ModuleProps
		>(props, base);

		if (
			NestS3Service.isLocal() &&
			(s3Props.local?.checkIfActive ?? true) &&
			!s3Props.local?.isActive
		) {
			(s3Props.local ??= {}).isActive = await NestS3Service.isLocalActive(
				s3Props.port ??
					(parseInt(process.env.LOCAL_S3_PORT ?? "") || LOCAL_S3_PORT)
			);
		}
		const controllers = props.controller ? [S3Controller] : undefined;

		return {
			module: S3Module,
			global: base?.isGlobal,
			controllers,
			providers: [
				{ provide: S3_PROPS, useValue: s3Props },
				NestS3Service,
			],
			exports: [NestS3Service],
		};
	}
}

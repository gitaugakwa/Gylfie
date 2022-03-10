import { DynamicModule, Module } from "@nestjs/common";
import { NestLoggerService, NestLoggerServiceProps } from "../../services";
import {
	BaseModule,
	BaseModuleProps,
	BaseServiceModuleProps,
	BaseServiceProps,
} from "@gylfie/common/lib/base";
import { LOGGER_PROPS } from "./logger.constants";
import { LoggerController } from "../../controllers/logger/logger.controller";

export interface LoggerServiceModuleProps
	extends BaseServiceModuleProps<NestLoggerServiceProps> {}

export interface LoggerModuleProps
	extends BaseModuleProps,
		LoggerServiceModuleProps {}

@Module({
	controllers: [LoggerController],
	providers: [NestLoggerService],
	exports: [NestLoggerService],
})
export class LoggerModule extends BaseModule {
	protected static _logs: string[] = [];
	static forRoot(
		props: LoggerServiceModuleProps,
		base: BaseModuleProps
	): DynamicModule;
	static forRoot(props: LoggerModuleProps): DynamicModule;
	static forRoot(
		props: LoggerModuleProps | LoggerServiceModuleProps,
		base?: BaseModuleProps
	): DynamicModule {
		// It should be able to read values in a dotenv
		// Such as Account ID, Service, and maybe the version of the sdk being run
		//

		const loggerProps = this.getProps<
			NestLoggerServiceProps,
			LoggerServiceModuleProps,
			LoggerModuleProps
		>(props, base);

		const controllers = props.controller ? [LoggerController] : undefined;

		return {
			module: LoggerModule,
			global: base?.isGlobal,
			controllers,
			providers: [
				{ provide: LOGGER_PROPS, useValue: loggerProps },
				NestLoggerService,
			],
			exports: [NestLoggerService],
		};
	}
}

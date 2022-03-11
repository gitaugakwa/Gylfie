import {
	BaseService,
	BaseServiceProps,
	GylfieError,
	State,
} from "@gylfie/common/lib/base";
import {
	InternalLog,
	Log,
	LoggerServiceProps,
	LoggerTransport,
	LogLevel,
	LogLevelType,
} from "@gylfie/common/lib/logger";
import { Inject, Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Context } from "aws-lambda";
import { config, createLogger, format, Logger, transports } from "winston";
import TransportStream from "winston-transport";
import { LOGGER_PROPS } from "../../modules/logger/logger.constants";

// Should be able to generate the dedicated format for any external library being used
// Currently, only NestJS is supported
// Should be a ble to successfully build even through other libraries are not installed
// So if we support another library should be able to build and run properly without the other library
// peerDependencies makes this way better.
// We should be able to have different files for the different libraries
// So that when the one needed is imported, it does not import the other libraries
// That would result in an error
// Since we currently don't care about other libraries,
// we don't need to lay down the ground work
// But the current thought is that for some services,
// they may only be included through explicit paths, i.e. @gylfie/common/services/nest

export interface NestLoggerServiceProps extends LoggerServiceProps {
	lambda?: string;
	console?: LogLevelType[] | true;
}

// We are not conforming to how winston would log
// Since most logs will be dispatched at the end to the lambda,
// You could set individual logs to console out in case the end is not reached
// This would rescue essential logs
// Especially the errors and all
// The module using the service needs to ensure that no matter the error,
// The logger end function will be called

// The structure of a single log is as follows:
/**
 * {
 * 		context: { 				// This is the state at which the the logger was initialized in
 * 			developer: string	// Provided when the module is created
 * 			account: string		// Provided when the module is created
 * 			service: string		// Provided when the module is created
 * 			environment: string	// Provided when the module is created
 * 			request: object		// Provided when the service has been initialized with a request **AWS**
 * 			context: object		// Provided when the service has been initialized with a request **AWS**
 * 		}
 * 		logs: Log[				// The Logs emitted during the the scope of the Logging session
 * 			Log: {
 * 				message: string		// The message included in the log
 * 				level: string		// The level of the log emitted
 * 				timestamp: string	// The time of the log emitted
 * 				file: string		// The file where the log was emitted (maybe)
 * 				metadata: {
 * 					...				// Any other data provided when calling the log
 * 				}
 * 			}
 * 		]
 * }
 */

// Should be able to determine if it's a debug env and log debug to console
// We don't necessarily have to call the lambda here,
// we can just have a lambda call that then dumps the logs
interface GylfieContext {
	[key: string]: any;
	request?: any;
	context?: Context;
}

@Injectable()
export class NestLoggerService extends BaseService {
	public state: State;
	private logger: Logger;
	private transport: LoggerTransport;
	private context?: GylfieContext;
	private _logs: Promise<void>[] = [];

	constructor(
		@Inject(LOGGER_PROPS)
		private readonly props: NestLoggerServiceProps,
		@Optional()
		protected configService?: ConfigService // private moduleRef: ModuleRef
	) {
		super();
		let consoleTransports: TransportStream[];
		if (props.console == true) {
			consoleTransports = [new transports.Console({})];
		} else if (!props.console) {
			consoleTransports = [new transports.Console({ level: "error" })];
		} else {
			const level = this.getHighestLevel(props.console);
			consoleTransports = [new transports.Console({ level })];
		}
		this.logger = createLogger({
			levels: config.syslog.levels,
			// level: LogLevel["EMERGENCY"],
			format: format.combine(
				format.timestamp(),
				format.json(),
				format.metadata({
					fillExcept: ["message", "level", "timestamp", "label"],
				}),
				format.prettyPrint()
			),
			transports: [
				// Not sure if we need that
				// make a debug transport
				(this.transport = new LoggerTransport()),
				...consoleTransports,
			],
		});

		this.state = State.Local;
	}

	// assuming that when a lambda is running, it runs per request, i.e
	// if 5 users request the same page, that spins up 5 lambdas and not just one,
	// if not, that will mess up with the logging

	// We should have a details function that then adds the context to the logger
	// There's no need for having to explicitly state the beginning of logging
	// SO the interceptor will take the request object and use it to create request details
	// They are then added to the logger which will format the final log including the request
	// At the moment when the log is dumped,
	// the logger should be in a state where the

	begin(): NestLoggerService {
		this.clear();
		this.info("Logging Beginning");
		return this;
	}

	provideContext(context: GylfieContext) {
		// This can be called multiple times
		Object.assign(this.context, context);
	}

	end(): NestLoggerService {
		this.info("Logging Ending");
		return this;
	}

	private getHighestLevel(levels: LogLevelType[]) {
		let highestLevel = LogLevel.DEBUG;
		for (const levelName in levels) {
			const level = levelName as LogLevelType;
			if (LogLevel[level].value < highestLevel.value) {
				highestLevel = LogLevel[level];
			}
		}
		return highestLevel.name;
	}

	get logs(): InternalLog[] {
		return this.transport.logs;
	}

	public async fullLogObject(
		level: LogLevelType,
		options?: { specific?: boolean }
	) {
		// Extract base properties
		const { account, developer, environment, service } = this
			.props as BaseServiceProps;
		const logs = options?.specific
			? this.getLogs(level)
			: this.getLogs(...this.includedLevels(level));
		return {
			context: {
				account,
				developer,
				environment,
				service,
				...this.context,
			},
			logs,
		};
	}

	public async complete() {
		// for now use allSettled since we have no error handling in the logger
		// when error handling is complete, we can use all
		return (await Promise.allSettled(this._logs)).map((val) => val.status);
	}

	public async clear() {
		this.info("Clearing Logger");

		this.context = undefined;

		await this.complete();
		this.transport.clear();
	}

	public async flush(level?: LogLevelType) {
		this.logger.info("Flushing Logger");

		// Ensure logging is complete
		await this.complete();
		const logObject = this.fullLogObject(level ?? "DEBUG");
		this.clear();

		return logObject;
	}

	private includedLevels(level: LogLevelType): LogLevelType[] {
		return Object.entries(LogLevel)
			.filter(
				([levelName, value]) => LogLevel[level].value >= value.value
			)
			.map(([levelName, value]) => levelName as LogLevelType);
	}

	getLogs(...levels: LogLevelType[]): InternalLog[] {
		if (!levels) {
			return this.transport.logs;
		}

		return this.transport.getLogs(
			...levels.map((val) => LogLevel[val].name)
		);
	}

	// Should push each promise into an array tha
	// technically, all other async methods should be resolved before the logger is closed
	// any async method not resolved will not assure the logs
	// IMO, we create promises that then get pushed into an array
	// then when closing, we loop through all promises
	// this will have to be tested cause we are not sure what the timing will be
	async debug(debug: Log | string) {
		const promise = new Promise<void>((res, rej) => {
			if (typeof debug == "string") {
				this.logger.debug({ message: debug });
				res(undefined);
				return;
			}
			this.logger.debug(debug);
			res(undefined);
			return;
		});
		this._logs.push(promise);
		return promise;
	}

	async info(info: Log | string) {
		const promise = new Promise<void>((res, rej) => {
			if (typeof info == "string") {
				this.logger.info({ message: info });
				res(undefined);
				return;
			}
			this.logger.info(info);
			res(undefined);
			return;
		});
		this._logs.push(promise);
		return promise;
	}

	async notice(notice: Log | string) {
		const promise = new Promise<void>((res, rej) => {
			if (typeof notice == "string") {
				this.logger.notice({ message: notice });
				res(undefined);
				return;
			}
			this.logger.notice(notice);
			res(undefined);
			return;
		});
		this._logs.push(promise);
		return promise;
	}

	async warn(warn: Log | string) {
		const promise = new Promise<void>((res, rej) => {
			if (typeof warn == "string") {
				this.logger.warning({ message: warn });
				res(undefined);
				return;
			}
			this.logger.warning(warn);
			res(undefined);
			return;
		});
		this._logs.push(promise);
		return promise;
	}

	async error(error: Log | string) {
		const promise = new Promise<void>((res, rej) => {
			if (typeof error == "string") {
				this.logger.error({ message: error });
				res(undefined);
				return;
			}
			this.logger.error(error);
			res(undefined);
			return;
		});
		this._logs.push(promise);
		return promise;
	}

	async critical(crit: Log | string) {
		const promise = new Promise<void>((res, rej) => {
			if (typeof crit == "string") {
				this.logger.crit({ message: crit });
				res(undefined);
				return;
			}
			this.logger.crit(crit);
			res(undefined);
			return;
		});
		this._logs.push(promise);
		return promise;
	}

	async alert(alert: Log | string) {
		const promise = new Promise<void>((res, rej) => {
			if (typeof alert == "string") {
				this.logger.alert({ message: alert });
				res(undefined);
				return;
			}
			this.logger.alert(alert);
			res(undefined);
			return;
		});
		this._logs.push(promise);
		return promise;
	}

	async emergency(emerg: Log | string) {
		const promise = new Promise<void>((res, rej) => {
			if (typeof emerg == "string") {
				this.logger.emerg({ message: emerg });
				res(undefined);
				return;
			}
			this.logger.emerg(emerg);
			res(undefined);
			return;
		});
		this._logs.push(promise);
		return promise;
	}

	protected errorHandler(err?: any, inner?: GylfieError): GylfieError {
		throw new Error("Method not implemented.");
	}
}

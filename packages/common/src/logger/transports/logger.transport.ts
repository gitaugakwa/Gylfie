import { LogCallback } from "winston";
import Transport from "winston-transport";
import { State } from "../../base";
import { InternalLog, Log } from "../models";

interface LoggerTransportProps extends Transport.TransportStreamOptions {}

interface LogThroughWinston extends Log {
	metadata: { [key: string]: any };
	timestamp: string;
	level: string;
}

export class LoggerTransport extends Transport {
	private _logs: InternalLog[] = [];
	constructor(props?: LoggerTransportProps) {
		super(props);
	}

	log(log: LogThroughWinston, callback?: LogCallback): void {
		setImmediate(() => {
			let test: NodeJS.CallSite;
			// Format the log into internalLog
			log.metadata["state"] ??= State.INERT;
			log.metadata["service"] ??= "GLOBAL";
			const internalLog: InternalLog = {
				...log,
			};
			this._logs.push(internalLog);

			if (callback) {
				callback();
			}
		});
	}

	clear(): void {
		// clear _logs
		this._logs = [];
	}

	getLogs(...logLevel: string[]): InternalLog[] {
		if (!logLevel) {
			return this._logs;
		}
		return this._logs.filter((value) => logLevel.includes(value.level));
	}

	public get logs(): InternalLog[] {
		return this._logs;
	}

	public get debug(): InternalLog[] {
		return this.getLogs("debug");
	}
	public get info(): InternalLog[] {
		return this.getLogs("info");
	}
	public get notice(): InternalLog[] {
		return this.getLogs("notice");
	}
	public get warning(): InternalLog[] {
		return this.getLogs("warning");
	}
	public get error(): InternalLog[] {
		return this.getLogs("error");
	}
	public get critical(): InternalLog[] {
		return this.getLogs("crit");
	}
	public get alert(): InternalLog[] {
		return this.getLogs("alert");
	}
	public get emergency(): InternalLog[] {
		return this.getLogs("emerg");
	}
}

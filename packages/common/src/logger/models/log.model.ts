import { Context } from "aws-lambda";

interface LogLevel {
	name: string;
	value: number;
}

export interface Log {
	message: string;
}

export interface InternalLog {
	message: string;
	level: string;
	timestamp: string;
	// file: string;
	metadata: { [key: string]: any };
}

export const LogLevels: { [key: string]: LogLevel } = {
	emergency: { name: "emerg", value: 0 },
	alert: { name: "alert", value: 1 },
	critical: { name: "crit", value: 2 },
	error: { name: "error", value: 3 },
	warning: { name: "warning", value: 4 },
	notice: { name: "notice", value: 5 },
	info: { name: "info", value: 6 },
	debug: { name: "debug", value: 7 },
};

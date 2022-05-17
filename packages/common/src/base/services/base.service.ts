import { checkPortStatus, Status } from "portscanner";
import { GylfieError } from "../errors";
import { Credentials, Provider } from "@aws-sdk/types";
import { LoggerService } from "../../logger";

export enum State {
	ONLINE = "ONLINE", // Full online, i.e. running on aws
	LOCAL = "LOCAL", // Full local, i.e. running on a local instance
	HYBRID = "HYBRID", // Partially online, Partially local, i.e. the core is running but the dynamo instance is online
	INERT = "INERT", // Does not depend on state
}

export interface BaseServiceProps {
	account?: string;
	developer?: string;
	service?: string;
	environment?: string;
	credentials?: Credentials | Provider<Credentials> | undefined;
	port?: number;
	profile?: string;
	region?: string;
	// request?: any; // based on the request
	// context?: Context; // based on the request
	moduleLogs?: string[]; // for now, though it would be a log object
	logger?: LoggerService;
	local?: { checkIfActive?: boolean; isActive?: boolean };
}

export abstract class BaseService {
	public state: State = State.ONLINE;

	constructor() {}

	static isLocal(): boolean {
		if (process.env.LOCATION == "LOCAL") {
			return true;
		}
		return false;
	}

	protected isLocal(): boolean {
		return BaseService.isLocal();
	}

	static async isLocalActive(port: number) {
		return (await checkPortStatus(port)) == "open";
	}

	protected async isLocalActive(port: number) {
		return BaseService.isLocalActive(port);
	}

	protected abstract errorHandler(
		err?: any,
		inner?: GylfieError
	): GylfieError;
}

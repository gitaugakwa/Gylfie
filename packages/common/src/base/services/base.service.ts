import { checkPortStatus, Status } from "portscanner";
import { GylfieError } from "../errors";
import { Credentials, Provider } from "@aws-sdk/types";

export enum State {
	Online, // Full online, i.e. running on aws
	Local, // Full local, i.e. running on a local instance
	Hybrid, // Partially online, Partially local, i.e. the core is running but the dynamo instance is online
}

export interface BaseServiceProps {
	account?: string;
	developer?: string;
	service?: string;
	environment?: string;
	credentials?: Credentials | Provider<Credentials> | undefined;
	// request?: any; // based on the request
	// context?: Context; // based on the request
	moduleLogs?: string[]; // for now, though it would be a log object
}

export abstract class BaseService {
	public state: State = State.Online;

	constructor() {}

	protected isLocal(): boolean {
		if (process.env.LOCATION == "LOCAL") {
			return true;
		}
		return false;
	}

	protected async isLocalActive(port: number) {
		return (await checkPortStatus(port)) == "open";
	}

	protected abstract errorHandler(
		err?: any,
		inner?: GylfieError
	): GylfieError;
}

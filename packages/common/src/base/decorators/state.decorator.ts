import "reflect-metadata";
import { checkPortStatus } from "portscanner";
import { GylfieError } from "../errors";
import { State } from "../services";
import { ClassDecorator } from "./class.decorator";
import { getMetadata } from "../metadata";
// import { MethodDecorator } from "./dynamo/method.decorator";

// The concept is there but execution is quite hard
// Not sure how it'll work but currently we'll just have to be careful in prod code

export const STATE_KEY = "states";
export function States(...states: State[]) {
	return function (
		target: any,
		name: string,
		descriptor: PropertyDescriptor
	) {
		Reflect.defineMetadata(`_gylfie_${STATE_KEY}`, states, target, name);
		const method = descriptor.value;
		const state = getMetadata<State>(target, SERVICE_STATE_KEY);
		console.log(`Current State: ${state}`);

		descriptor.value = function (...args: any[]) {
			if (!states.includes(state)) {
				throw new GylfieError({
					code: "InvalidState",
					message: "Current state does not support current method",
					name: "CurrentStateInvalid",
				});
			}
			method.apply(this, args);
		};
	};
}

export const SERVICE_STATE_KEY = "serviceState";
/**
 * Sets the state of a service.
 * @param  {number} defaultPort
 * @param  {string|number} envPort?
 * @param  {number} propPort?
 * @returns CustomDecorator
 */
export function ServiceState(
	defaultPort: number,
	envPort?: string | number,
	propPort?: number
) {
	return ClassDecorator(
		SERVICE_STATE_KEY,
		deriveState(defaultPort, envPort, propPort)
		// {}
	);
}

export async function deriveState(
	defaultPort: number,
	envPort?: string | number,
	propPort?: number
): Promise<State> {
	const envPortRetrieved =
		typeof envPort == "string"
			? getPortFromEnv(process.env[envPort])
			: envPort;
	const port = envPortRetrieved ?? propPort ?? defaultPort;
	if (process.env.LOCATION == "LOCAL") {
		if (await isLocalActive(port)) {
			return State.Local;
		}
		return State.Hybrid;
	}
	return State.Online;
}

function getPortFromEnv(envVar?: string): number | undefined {
	if (envVar) {
		const envPort = process.env[envVar];
		if (typeof envPort == "number") {
			return envPort;
		}
		return undefined;
	}
	return undefined;
}

async function isLocalActive(port: number) {
	return (await checkPortStatus(port)) == "open";
}

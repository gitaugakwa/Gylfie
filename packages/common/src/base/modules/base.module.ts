import * as dotenv from "dotenv";
import { resolve } from "path";
import { BaseServiceProps } from "../services/base.service";

export interface BaseModuleProps {
	service?: string;
	developer?: string;
	environment?: string;
	account?: string;
	isGlobal?: boolean;
}

export interface BaseServiceModuleProps<T> {
	serviceProps: T;
	controller?: boolean;
}

enum Source {
	ENV,
	PROPS,
}

export abstract class BaseModule {
	protected static _logs: string[] = [];
	protected static _baseProps?: BaseServiceProps;

	// We could make this a base module that then is able to export other modules

	protected static mergeEnv() {
		const env = this.getEnvObject(resolve(process.cwd(), ".env"));
		process.env = { ...env, ...process.env };
	}

	protected static getEnvObject(path: string): dotenv.DotenvParseOutput {
		try {
			return dotenv.parse(path);
		} catch (err) {
			this._logs.push("Env file does not exist");
			throw err;
			// Throw proper error or not having an Env file,
		}
	}

	protected static getHighestPriority<T>(
		env?: T,
		props?: T
	): Source | undefined {
		// Hierarchy
		// process.env
		// prop
		if (env) {
			return Source.ENV;
		}
		if (props) {
			return Source.PROPS;
		}
		return undefined;
	}

	protected static get(envName: string, prop?: string): string | undefined {
		const envValue = process.env[envName];
		const propValue = prop;

		let returnValue: string | undefined;

		switch (BaseModule.getHighestPriority(envValue, propValue)) {
			case Source.ENV: {
				returnValue = envValue;
			}
			case Source.PROPS: {
				if (!envValue) {
					return (returnValue = propValue);
				} else {
					envValue == propValue
						? undefined
						: this._logs.push("process.env not equal to prop");
					return envValue;
				}
			}
			default: {
				this._logs.push(`${envName} not provided`);
				return undefined;
			}
		}
	}

	protected static parseBaseProps(
		props?: BaseModuleProps,
		options?: { throw?: boolean }
	): BaseServiceProps {
		if (this._baseProps) {
			return this._baseProps;
		}
		// Account Details
		// The user account that the logger is running on
		const account = this.get("GYLFIE_ACCOUNT", props?.account);

		if (!account) {
			throw new Error("No account defined");
		}

		// Developer Details
		// The developers working on the current service
		const developer = this.get("GYLFIE_DEVELOPER", props?.developer);

		if (!developer) {
			throw new Error("No developer defined");
		}

		// Service Details
		// The current Service
		const service = this.get("GYLFIE_SERVICE", props?.service);

		if (!service) {
			throw new Error("No service defined");
		}

		// Environment Details
		// The current Environment
		const environment = this.get("GYLFIE_ENVIRONMENT", props?.environment);

		if (!environment) {
			throw new Error("No environment defined");
		}

		return (this._baseProps = {
			account,
			developer,
			environment,
			moduleLogs: this._logs,
			// isGlobal: props?.isGlobal,
			service,
		});
	}

	protected static isBaseModuleProps(props: any): props is BaseModuleProps {
		return (
			props.account ||
			props.service ||
			props.developer ||
			props.environment ||
			props.isGlobal
		);
	}

	protected static getProps<
		TServiceProps,
		TServiceModuleProps extends BaseServiceModuleProps<TServiceProps>,
		TModuleProps extends TServiceModuleProps
	>(
		props: TModuleProps | TServiceModuleProps,
		base?: BaseModuleProps
	): TServiceProps {
		if (this.isBaseModuleProps(props)) {
			this.mergeEnv();
			const baseProps = this.parseBaseProps(props);
			const serviceProps = this.parseProps<
				TServiceProps,
				TServiceModuleProps
			>(baseProps, props);
			return serviceProps;
		}
		const baseProps = this.parseBaseProps(base);
		const serviceProps = this.parseProps<
			TServiceProps,
			TServiceModuleProps
		>(baseProps, props);
		return serviceProps;
	}

	static parseProps<
		TServiceProps,
		TServiceModuleProps extends BaseServiceModuleProps<TServiceProps>
	>(base: BaseServiceProps, props: TServiceModuleProps): TServiceProps {
		return { ...base, ...props.serviceProps };
	}
}

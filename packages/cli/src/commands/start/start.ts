import { ICommand, GylfieCommand } from "../command";
import { spawnSync, spawn } from "child_process";
import { IOption } from "../../options";
import { Command, OptionValues } from "commander";
import {
	Config,
	Context,
	DatabaseResource,
	DatabaseResourceProperties,
	FunctionResource,
	FunctionResourceProperties,
	MobileAppResourceProperties,
	GylfieDatabase,
	GylfieFunction,
	GylfieMobileApp,
	GylfieService,
	ResourceType,
	ServiceResourceProperties,
	StartableResource,
	SupportedResources,
} from "../../config";

export interface IStartCommand {
	options?: IOption[];
}

export class StartCommand extends GylfieCommand implements ICommand {
	constructor(props?: IStartCommand) {
		super();
		this.name = "Start Command";
		this.flag = "start";
		this.description = "Starts Gylfie Resources";
		this.options = props?.options;
		this.properties = [{ name: "resources..." }];
	}
	options: IOption[] | undefined;
	name?: string | undefined;
	description?: string | undefined;
	flag: string;
	alias?: string | undefined;
	properties?:
		| {
				name: string;
				required?: boolean | undefined;
		  }[]
		| undefined;

	private static spawn() {
		console.log("Spawning");
	}

	public static start(
		resources?: string[],
		options?: OptionValues,
		command?: Command
	) {
		const context = this.getContext();
		const { configPath, cwd } = context;
		// console.log(resources);
		try {
			if (context.configExists()) {
				const { config } = context;
				if (config.resources) {
					if (resources) {
						resources.forEach((resource) => {
							if (config.resources) {
								const res = config.resources[resource];
								if (res) {
									this.startResource(
										context,
										res,
										options,
										resource
									);
								}
								return;
							}
						});
						return;
					}
					Object.entries(config.resources).forEach(([name, res]) => {
						this.startResource(context, res, options, name);
					});
				}
				this.spawn();
				return;
			}
			this.uninitialized();
			return;
		} catch (err) {
			console.log(err);
		}
	}

	private static async startResource(
		// name:string,
		context: Context,
		resource: SupportedResources,
		options?: OptionValues,
		name?: string
	) {
		const request = {
			context,
			options,
		};

		const { type } = resource;

		switch (type) {
			case "function": {
				await new GylfieFunction(name, resource).start(request);
				return;
			}
			case "database": {
				try {
					await new GylfieDatabase(name, resource).start(request);
				} catch (err) {
					console.log(err);
				}
				return;
			}

			case "service": {
				await new GylfieService(name, resource).start(request);
				return;
			}
			case "mobile": {
				await new GylfieMobileApp(name, resource).start(request);
				return;
			}
		}
	}

	// support for npm only rn
	// might as well return the same cmd if it is not supported

	public action(...args: any[]) {
		StartCommand.start(...args);
	}

	private static generateStartCommand(
		defaultBuildCommand: string,
		props?: StartableResource,
		globals?: StartableResource,
		options?: OptionValues
	): string {
		if (options?.watch) {
			// As much as it would be nice to default watch to :watch
			// For situations that aren't configured for that,
			// should be left in normal start
			return (
				props?.startCommand ??
				globals?.startCommand ??
				defaultBuildCommand ??
				"npm run start"
			).concat(props?.watchAppend ?? globals?.watchAppend ?? ":watch");
		}
		return (
			props?.startCommand ??
			globals?.startCommand ??
			defaultBuildCommand ??
			"npm run start"
		);
	}
}

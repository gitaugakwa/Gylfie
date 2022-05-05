import { ICommand, GylfieCommand } from "../command";
import { spawnSync, spawn } from "child_process";
import { IOption } from "../../options";
import { Command, OptionValues } from "commander";
import {
	BuildableResource,
	Config,
	Context,
	DatabaseResource,
	DatabaseResourceProperties,
	FunctionResource,
	FunctionResourceProperties,
	LayerResourceProperties,
	GylfieMobileApp,
	ServiceResourceProperties,
	SupportedResources,
} from "../../config";

export interface IBuildCommand {
	options?: IOption[];
}

export class BuildCommand extends GylfieCommand implements ICommand {
	constructor(props?: IBuildCommand) {
		super();
		this.name = "Build Command";
		this.flag = "build";
		this.description = "Builds Gylfie Resources";
		this.options = props?.options;
		this.properties = [{ name: "resources..." }];
	}
	options?: IOption[] | undefined;
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

	public static build(
		resources?: string[],
		options?: OptionValues,
		command?: Command
	) {
		const context = this.getContext();
		const { configPath, cwd } = context;
		const { config } = context;
		// console.log(resources);
		try {
			if (context.configExists() && config && config.resources) {
				if (resources) {
					for (const resource of resources) {
						const res = config.resources[resource];
						if (res) {
							this.buildResource(
								resource,
								res,
								config,
								context,
								options
							);
						}
					}
					return;
				}
				Object.entries(config.resources).forEach(([name, resource]) => {
					this.buildResource(
						name,
						resource,
						config,
						context,
						options
					);
				});
			}
			this.uninitialized();
			return;
		} catch (err) {
			console.log(err);
		}
	}

	private static async buildResource(
		name: string,
		resource: SupportedResources,
		config: Config,
		context: Context,
		options?: OptionValues
	) {
		if (resource.type == "database") {
			const {} = resource;
		}
		const { type, properties, stages } = resource;
		const { globals } = config;
		const request = {
			context,
			options,
		};
		switch (type) {
			case "function": {
				const props = properties as FunctionResourceProperties;
				console.log(`Building ${name} Function`);
				const cmd = this.generateBuildCommand(
					"npm run build",
					props,
					globals?.function,
					options
				);
				const command = this.parseCommand(cmd.split(" ")[0]);
				const args = cmd.split(" ");
				args.shift();
				// console.log(properties.path);
				const instance = spawn(command, args, {
					cwd: props.path,
					detached: true,
					windowsHide: false,
					shell: true,
					// stdio: "pipe", // Send to the parent
					stdio: "ignore", // To ignore the parent
				});
				// console.log(instance);
				// console.log(instance.stdout.toString());
				// console.log(instance.stderr.toString());
				instance.unref(); // To detach from the parent
				console.log(`${name} Built`);
				return;
			}
			// case "database": {
			// 	const props = properties as DatabaseResourceProperties;

			// 	console.log(`Building ${name} Database`);
			// 	const cmd =
			// 		properties.buildCommand ??
			// 		globals?.database?.buildCommand ??
			// 		"npm run Build"; // ./Build.ps1
			// 	const command = this.parseCommand(cmd.split(" ")[0]);
			// 	const args = cmd.split(" ");
			// 	if (props.port) {
			// 		args.push(`-port`, `${props.port}`);
			// 	}
			// 	args.shift();
			// 	const instance = spawn(command, args, {
			// 		cwd: properties.path,
			// 		detached: true,
			// 		shell: true,
			// 		windowsHide: false,
			// 		stdio: "ignore", // To ignore the parent
			// 	});
			// 	instance.unref(); // To detach from the parent
			// 	console.log(`${name} Builded`);
			// 	return;
			// }
			// case "service": {
			// 	const props = properties as ServiceResourceProperties;
			// 	console.log(`Building ${name} Service`);
			// 	const cmd =
			// 		props.buildCommand ??
			// 		globals?.service?.buildCommand ??
			// 		"npm run Build";
			// 	const command = this.parseCommand(cmd.split(" ")[0]);
			// 	const args = cmd.split(" ");
			// 	args.shift();
			// 	// console.log(properties.path);
			// 	const instance = spawn(command, args, {
			// 		cwd: props.path,
			// 		detached: true,
			// 		windowsHide: false,
			// 		shell: true,
			// 		// stdio: "pipe", // Send to the parent
			// 		stdio: "ignore", // To ignore the parent
			// 	});
			// 	// console.log(instance);
			// 	// console.log(instance.stdout.toString());
			// 	// console.log(instance.stderr.toString());
			// 	instance.unref(); // To detach from the parent
			// 	console.log(`${name} Builded`);
			// }
			case "layer": {
				const props = properties as ServiceResourceProperties;
				console.log(`Building ${name} Service`);
				const cmd = this.generateBuildCommand(
					"npm run build",
					props,
					globals?.layer,
					options
				);

				const command = this.parseCommand(cmd.split(" ")[0]);
				const args = cmd.split(" ");
				args.shift();
				// console.log(properties.path);
				const instance = spawn(command, args, {
					cwd: props.path,
					detached: true,
					windowsHide: false,
					shell: true,
					// stdio: "pipe", // Send to the parent
					stdio: "ignore", // To ignore the parent
				});
				// console.log(instance);
				// console.log(instance.stdout.toString());
				// console.log(instance.stderr.toString());
				instance.unref(); // To detach from the parent
				console.log(`${name} Built`);
			}
			case "mobile": {
				await new GylfieMobileApp(name).build(request);
				return;
			}
		}
	}

	// support for npm only rn
	// might as well return the same cmd if it is not supported

	public action(...args: any[]) {
		BuildCommand.build(...args);
	}

	private static generateBuildCommand(
		defaultBuildCommand: string,
		props?: BuildableResource,
		globals?: BuildableResource,
		options?: OptionValues
	): string {
		if (options?.watch) {
			return (
				props?.buildCommand ??
				globals?.buildCommand ??
				defaultBuildCommand ??
				"npm run build"
			).concat(props?.watchAppend ?? globals?.watchAppend ?? ":watch");
		}
		return (
			props?.buildCommand ??
			globals?.buildCommand ??
			defaultBuildCommand ??
			"npm run build"
		);
	}
}

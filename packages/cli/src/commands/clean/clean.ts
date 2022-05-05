import { Command, OptionValues } from "commander";
import { ICommand, GylfieCommand } from "../command";
import { IOption, PackageOption } from "../../options";
import { createPromptModule, Answers } from "inquirer";
import {
	Context,
	ResourceDefinition,
	ResourceType,
	GylfieService,
	GylfieFunction,
	GylfieLayer,
	GylfieMobileApp,
	GylfieDatabase,
	SupportedResources,
	Config,
} from "../../config";

export interface ICleanCommand {
	options?: IOption[];
}

export class CleanCommand extends GylfieCommand implements ICommand {
	constructor(props?: ICleanCommand) {
		super();
		this.name = "Clean Command";
		this.flag = "clean";
		this.description = "Clean resource";
		// this.alias = "initialize";
		this.options = props?.options;
		this.properties = [{ name: "resources..." }];
	}
	name?: string | undefined;
	description?: string | undefined;
	flag: string;
	alias?: string | undefined;
	options?: IOption[];
	properties?:
		| {
				name: string;
				required?: boolean | undefined;
		  }[]
		| undefined;

	public static async clean(
		resources?: string[],
		options?: OptionValues,
		command?: Command
	) {
		const context = this.getContext();
		const { configPath, cwd } = context;
		const { config } = context;

		try {
			if (context.configExists() && config && config.resources) {
				if (resources) {
					for (const resource of resources) {
						const res = config.resources[resource];
						if (res) {
							this.cleanResource(
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
					this.cleanResource(
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

	private static async cleanResource(
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

		switch (type as ResourceType) {
			// case "service": {
			// 	await new GylfieService().create(request);
			// 	return;
			// }
			// case "function": {
			// 	await new GylfieFunction().create(request);
			// 	return;
			// }
			// case "layer": {
			// 	await new GylfieLayer().create(request);
			// 	return;
			// }
			// case "database": {
			// 	await new GylfieDatabase().create(request);
			// 	return;
			// }
			case "mobile": {
				console.log("call mobile clean");
				await new GylfieMobileApp(name).clean(request);
				return;
			}
			default: {
				console.log("Unsupported Type", type);
			}
		}
		return;
	}

	public async action(...args: any[]) {
		CleanCommand.clean(...args);
	}
}

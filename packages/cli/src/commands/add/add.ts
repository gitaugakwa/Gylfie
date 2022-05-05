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
} from "../../config";

export interface IAddCommand {
	options?: IOption[];
}

export class AddCommand extends GylfieCommand implements ICommand {
	constructor(props?: IAddCommand) {
		super();
		this.name = "Add Command";
		this.flag = "add";
		this.description = "Add resource of [type]";
		// this.alias = "initialize";
		this.options = props?.options;
		this.properties = [{ name: "type" }, { name: "path" }];
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

	public static async add(
		type?: ResourceType,
		path?: any,
		options?: OptionValues,
		command?: Command
	) {
		const context = this.getContext(path);
		const { cwd, configPath } = context;

		try {
			if (context.configExists()) {
				await this.addPrompt(context, options, type);

				return;
			}
			this.uninitialized();
			return;
		} catch (err) {
			// switch (err.code) {
			// 	case "ENOENT": {
			// 		// file not found - does not exist
			// 	}
			// 	default: {
			// 	}
			// }
			console.log("Unusual Error encountered during add");
			console.log(err);
		}
	}

	private static async addPrompt(
		context: Context,
		options?: OptionValues,
		type?: ResourceType
	) {
		const prompt = createPromptModule();
		const answers = await prompt(
			[
				{
					type: "list",
					name: "type",
					message: "Type of instance being added",
					choices: Object.keys(ResourceDefinition),
					default: "function",
				},
			],
			{ ...options, type }
		);

		// const { config } = context;

		// if (
		// 	config.resources &&
		// 	config.resources[answers.name] &&
		// 	!options?.force
		// ) {
		// 	console.log("Resource already exists");
		// 	return;
		// }

		const request = {
			context,
			options,
		};

		switch (answers.type as ResourceType) {
			case "service": {
				await new GylfieService().create(request);
				return;
			}
			case "function": {
				await new GylfieFunction().create(request);
				return;
			}
			case "layer": {
				await new GylfieLayer().create(request);
				return;
			}
			case "database": {
				await new GylfieDatabase().create(request);
				return;
			}
			case "mobile": {
				await new GylfieMobileApp().create(request);
				return;
			}
			default: {
				console.log("Unsupported Type", answers.type);
			}
		}
		return;
	}

	public async action(...args: any[]) {
		AddCommand.add(...args);
	}
}

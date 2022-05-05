import { ICommand, GylfieCommand } from "../command";
import { spawn } from "child_process";
import { IOption } from "../../options";
import { Command, OptionValues } from "commander";
import {
	Context,
	ResourceDefinition,
	ResourceType,
	SupportedResources,
} from "../../config";
import { createPromptModule } from "inquirer";

export interface IResourceCommand {
	options?: IOption[];
}

export class ResourceCommand extends GylfieCommand implements ICommand {
	constructor(props?: IResourceCommand) {
		super();
		this.name = "Resource Command";
		this.flag = "G";
		this.alias = "resource";
		this.description = "Set Resource properties for an Gylfie Resource";
		this.properties = [
			{ name: "name" },
			{ name: "property" },
			{ name: "value" },
		];
	}
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

	public static resource(
		name?: string,
		property?: string,
		value?: any,
		options?: OptionValues,
		command?: Command
	) {
		const context = this.getContext();
		const { configPath, cwd } = context;
		try {
			if (context.configExists()) {
				if (!name) {
					this.namePrompt(context);
				}
				if (name && property && value) {
					// context.addToConfig({
					// 	resources: {
					// 		[name]: {
					// 			[property]: value,
					// 		},
					// 	},
					// });
				}
				return;
			}
			this.uninitialized();
			return;
		} catch (err) {
			console.log(err);
		}
	}

	private static prompt(type?: string) {}

	private static async namePrompt(context: Context) {
		const prompt = createPromptModule();
		if (context.config.resources) {
			const answers = await prompt([
				{
					type: "list",
					name: "name",
					message: "Name of the resource",
					choices: [
						...Object.keys(context.config.resources),
						"New resource",
					],
					default: "New resource",
					// when: (answer) => {
					// 	return type ? false : true;
					// },
				},
			]);
			if (answers.name == "New resource") {
				this.createResourcePrompt(context);
			}
			return answers;
		}
		return this.createResourcePrompt(context);
	}

	private static async createResourcePrompt(context: Context) {
		const prompt = createPromptModule();
		const answers = await prompt([
			{
				type: "input",
				name: "name",
				message: "Name of the resource",
				// when: (answer) => {
				// 	return type ? false : true;
				// },
			},
			{
				type: "list",
				name: "type",
				message: "Type of the resource",
				choices: Object.keys(ResourceDefinition),
			},
		]);
		const mod: { [key: string]: SupportedResources } = {
			[answers.name]: {
				type: answers.type,
				stages: {},
				properties: {
					path: this.getPath(undefined, answers),
				},
			},
		};

		return answers;
	}

	public action(...args: any[]) {
		ResourceCommand.resource(...args);
	}
}

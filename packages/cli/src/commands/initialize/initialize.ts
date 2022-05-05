import { Command, OptionValues } from "commander";
import { join, isAbsolute } from "path";
import { statSync, writeFileSync } from "fs";
import { ICommand, GylfieCommand } from "../command";
import { IOption, PackageOption } from "../../options";
import { createPromptModule, Answers } from "inquirer";
import { Config } from "../../config";

export interface IInitializeCommand {
	options?: IOption[];
}

export class InitializeCommand extends GylfieCommand implements ICommand {
	constructor(props?: IInitializeCommand) {
		super();
		this.name = "Initialize Command";
		this.flag = "init";
		this.description = "Initializes the Gylfie CLI";
		this.alias = "initialize";
		this.options = props?.options;
		this.properties = [{ name: "path" }];
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

	public static async initialize(
		path?: string,
		options?: OptionValues,
		command?: Command
	) {
		const context = this.getContext(path);
		const { cwd, configPath } = context;

		try {
			if (context.configExists()) {
				if (options?.force) {
					const answers = await this.prompt(options);
					const config: Config = {
						developer: answers.developer,
						name: answers.name,
						package: answers.packageManager,
					};
					writeFileSync(configPath, JSON.stringify(config, null, 4));
					return;
				}
				this.uninitialized();
				return;
			}
			const answers = await this.prompt(options);
			const config: Config = {
				name: answers.name,
				developer: answers.developer,
				package: answers.packageManager,
			};
			writeFileSync(configPath, JSON.stringify(config, null, 4));
			return;
		} catch (err) {
			// switch (err.code) {
			// 	case "ENOENT": {
			// 		// file not found - does not exist
			// 	}
			// 	default: {
			// 	}
			// }
			console.log("Unusual Error encountered during initialization");
			console.log(err);
		}
	}

	private static async prompt(options?: OptionValues): Promise<Answers> {
		const prompt = createPromptModule();
		const packageOpt = new PackageOption();
		const answers = await prompt(
			[
				{
					type: "input",
					name: "name",
					message: "Name of the application",
				},
				{
					type: "input",
					name: "developer",
					message: "Developer of the application",
				},
				{
					type: "list",
					name: "packageManager",
					message: "Select your current package manager",
					choices: packageOpt.choices,
					default: packageOpt.default,
					when: (answer) => {
						return answer.packageManager ? false : true;
					},
				},
			],
			{ ...options }
		);
		return answers;
	}

	public async action(...args: any[]) {
		InitializeCommand.initialize(...args);
	}
}

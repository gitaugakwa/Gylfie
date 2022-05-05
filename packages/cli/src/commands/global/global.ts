import { ICommand, GylfieCommand } from "../command";
import { spawn } from "child_process";
import { IOption } from "../../options";
import { Command, OptionValues } from "commander";
import { ResourceType } from "../../config";

export interface IGlobalCommand {
	options?: IOption[];
}

export class GlobalCommand extends GylfieCommand implements ICommand {
	constructor(props?: IGlobalCommand) {
		super();
		this.name = "Global Command";
		this.flag = "G";
		this.alias = "global";
		this.description = "Set global properties for Gylfie Resources";
		this.properties = [
			{ name: "type" },
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

	public static global(
		type?: ResourceType,
		property?: string,
		value?: any,
		options?: OptionValues,
		command?: Command
	) {
		const context = this.getContext();
		const { configPath, cwd } = context;
		try {
			if (context.configExists()) {
				if (type && property && value) {
					context.addToConfig({
						globals: {
							[type]: {
								[property]: value,
							},
						},
					});
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

	public action(...args: any[]) {
		GlobalCommand.global(...args);
	}
}

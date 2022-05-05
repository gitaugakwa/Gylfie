import { ICommand, GylfieCommand } from "../command";
import { spawn } from "child_process";
import { IOption } from "../../options";
import { Command, OptionValues } from "commander";

export interface IGenerateCommand {
	options?: IOption[];
}

export class GenerateCommand extends GylfieCommand implements ICommand {
	constructor(props?: IGenerateCommand) {
		super();
		this.name = "Generate Command";
		this.flag = "g";
		this.alias = "generate";
		this.description = "Generate new Gylfie Resource";
		this.properties = [{ name: "type" }, { name: "path" }];
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

	public static generate(
		type?: string,
		path?: any,
		options?: OptionValues,
		command?: Command
	) {
		const context = this.getContext();
		const { cwd, configPath } = context;
		try {
			if (context.configExists()) {
				spawn("");
				return;
			}
			this.uninitialized();
			return;
		} catch (err) {
			console.log(err);
		}
	}

	public action(...args: any[]) {
		GenerateCommand.generate(...args);
	}
}

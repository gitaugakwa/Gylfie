import { Command, createCommand } from "commander";
import { IOption, OptionFactory } from "../options";
import { Factory, FlagProperties } from "../factory";
import { isAbsolute, join } from "path";
import { Answers } from "inquirer";
import { ResourceType, ResourceDefinition, Context } from "../config";

export interface ICommand extends FlagProperties {
	action: (...args: any[]) => void | Promise<void>;
	name?: string;
	description?: string;
	alias?: string;
	options?: IOption[];
}

export abstract class GylfieCommand {
	abstract action(...args: any[]): void | Promise<void>;

	public static derivePath(path?: string): string {
		const cwd = process.cwd();
		return join(
			`${path ? (isAbsolute(path) ? path : join(cwd, path)) : cwd}`,
			"gylfie.json"
		);
	}

	public static getPath(path?: string, answers?: Answers): string {
		const cwd = process.cwd();

		if (path) {
			return isAbsolute(path) ? path : join(cwd, path);
		}
		if (answers) {
			return join(
				cwd,
				ResourceDefinition[answers.type as ResourceType].folder,
				answers.name,
				answers.stage ?? ""
			);
		}
		return "";
	}

	public static getContext(path?: string): Context {
		try {
			return new Context(path);
		} catch (err) {
			console.log("Problem deriving Gylfie context");
			throw new Error("Unable to derive context");
		}
	}

	public static parseCommand(cmd: string): string {
		switch (cmd) {
			case "npm": {
				return /^win/.test(process.platform) ? "npm.cmd" : "npm";
			}
			default: {
				return cmd;
				throw new Error("Unsupported command");
			}
		}
	}

	public static addCommand(original: string, command: string): string {
		return original.concat(` && ${command}`);
	}

	protected static uninitialized() {
		console.log("Gylfie configuration does not exist");
		return;
	}
}

export class CommandFactory extends Factory {
	constructor(private program: Command) {
		super();
	}

	public add(...coms: ICommand[]): CommandFactory {
		coms.forEach((com) => {
			const command = createCommand(com.flag);
			command.arguments(this.parseCommandFlag(com)).action(com.action);
			// .name(com.name ?? com.flag);
			if (com.alias) {
				command.alias(com.alias);
			}
			if (com.description) {
				command.description(com.description);
			}
			if (com.options) {
				const optionFactory = new OptionFactory(command as Command);
				optionFactory.add(...com.options);
			}
			// command.help({error})
			this.program.addCommand(command);
		});
		return this;
	}

	protected parseCommandFlag(prop: FlagProperties): string {
		return (prop.properties ?? [])
			.map((property) => this.parseProperty(property))
			.join(" ");
	}
}

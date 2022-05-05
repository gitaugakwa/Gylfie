import { Command, Option } from "commander";
import { FlagProperties, Factory } from "../factory";

export interface IOption extends FlagProperties {
	description?: string;
	required?: boolean;
	default?:
		| { value: string | boolean; description?: string }
		| string
		| boolean;
	choices?: string[];
	help?: boolean;
}

export interface IOptions {
	default?:
		| { value: string | boolean; description?: string }
		| string
		| boolean;
}

export class OptionFactory extends Factory {
	constructor(private program: Command) {
		super();
	}

	public add(...options: IOption[]): OptionFactory {
		options.forEach((option) => {
			const parsedOption = this.parseOption(option);
			this.program.addOption(parsedOption);
		});
		return this;
	}

	protected parseOption(opt: IOption): Option {
		const option = new Option(this.parseOptionFlag(opt), opt.description);
		if (opt.default) {
			if (typeof opt.default == "object") {
				const { value, description } = opt.default;
				option.default(value, description);
			} else {
				option.default(opt.default);
			}
		}
		option.makeOptionMandatory(opt.required);
		if (opt.help == false) {
			option.hideHelp();
		}
		if (opt.choices) {
			option.choices(opt.choices);
		}
		// console.log(option);
		return option as Option;
	}

	protected parseOptionFlag(prop: FlagProperties) {
		return `-${prop.flag}${prop.alias ? `, --${prop.alias}` : ""}${
			prop.properties
				? ` ${prop.properties
						.map((property) => this.parseProperty(property))
						.join(" ")}`
				: ""
		}`;
	}
}

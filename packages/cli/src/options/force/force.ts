import { IOption, IOptions } from "../option";

export interface IForceOption extends IOptions {}

export class ForceOption implements IOption {
	constructor(props?: IForceOption) {
		this.flag = "f";
		this.alias = "force";
		this.description = "Force a command";
		this.default = props?.default;
		// this.choices = ["npm", "yarn"];
		// this.properties = [{ name: "type", required: true }];
		this.required = false;
	}
	flag: string;
	alias?: string;
	description?: string;
	default:
		| string
		| boolean
		| { value: string | boolean; description?: string | undefined }
		| undefined;
	choices?: string[];
	required?: boolean;
	properties?: {
		name: string;
		required?: boolean | undefined;
	}[];
}

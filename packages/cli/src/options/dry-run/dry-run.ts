import { IOption, IOptions } from "../option";

export interface IDryRunOption extends IOptions {}

export class DryRunOption implements IOption {
	constructor(props?: IDryRunOption) {
		this.flag = "d";
		this.alias = "dry-run";
		this.description =
			"Reports changes that would be made, but does not change the filesystem";
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

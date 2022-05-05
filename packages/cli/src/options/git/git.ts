import { IOption, IOptions } from "../option";

export interface IGitOption extends IOptions {}

export class GitOption implements IOption {
	constructor(props?: IGitOption) {
		this.flag = "g";
		this.alias = "skip-git";
		this.description = "Skip git repository initialization";
		this.default = props?.default;
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

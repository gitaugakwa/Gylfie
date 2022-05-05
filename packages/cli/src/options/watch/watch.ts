import { IOption, IOptions } from "../option";

export interface IWatchOption extends IOptions {}

export class WatchOption implements IOption {
	constructor(props?: IWatchOption) {
		this.flag = "w";
		this.alias = "watch";
		this.description = "Run in watch mode";
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

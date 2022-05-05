import { IOption, IOptions } from "../option";

export interface IPackageOption extends IOptions {}

export class PackageOption implements IOption {
	constructor(props?: IPackageOption) {
		this.flag = "p";
		this.alias = "package-manager";
		this.description = "Preferred package manager";
		this.default = props?.default;
		this.choices = ["npm","pnpm", "yarn"];
		this.properties = [{ name: "package-manager", required: true }];
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

import { ResourceDefinition } from "../../config";
import { IOption, IOptions } from "../option";

export interface IRuntimeOption extends IOptions {}

export class RuntimeOption implements IOption {
	constructor(props?: IRuntimeOption) {
		this.flag = "r";
		this.alias = "runtime";
		this.description = "The runtime of the resource";
		this.default = props?.default;
		this.choices = ResourceDefinition.function.runtimes;
		this.properties = [{ name: "runtime", required: true }];
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

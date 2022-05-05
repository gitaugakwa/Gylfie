import { IOption, IOptions } from "../option";

export interface IStageOption extends IOptions {}

export class StageOption implements IOption {
	constructor(props?: IStageOption) {
		this.flag = "s";
		this.alias = "stage";
		this.description = "Add or reference a stage";
		this.default = props?.default;
		this.properties = [{ name: "name", required: true }];
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

// import { decode } from "jsonwebtoken";
// import { DateTime } from "luxon";
// import { Payload } from "../authentication";

export interface PathQueryProps {
	value?: (string | number | boolean)[];
	description?: string;
	default?: boolean;
}

export class PathQuery {
	value?: (string | number | boolean)[];
	description?: string;
	default?: boolean;

	constructor(props: PathQueryProps) {
		Object.assign(this, props);
	}

	public static get schema(): PathQuery[] {
		return [
			new PathQuery({
				value: ["include", true],
				description: "The Schema will be included in the response",
			}),
			new PathQuery({
				value: ["only"],
				description: "Only the Schema will be included in the response",
			}),
			new PathQuery({
				value: ["exclude", "ignore", false],
				description: "The Schema will not be included in the response",
				default: true,
			}),
		];
	}
}

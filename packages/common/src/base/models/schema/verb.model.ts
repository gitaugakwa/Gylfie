// import { decode } from "jsonwebtoken";
// import { DateTime } from "luxon";
// import { Payload } from "../authentication";

import { PathQuery, PathQueryProps } from "./query.model";

interface PathVerbProps {
	queries?: { [key: string]: (string | number | boolean | PathQueryProps)[] };
	description?: string;
	model?: { [key: string]: string };
}

export class PathVerb {
	queries?: { [key: string]: (string | number | boolean | PathQuery)[] };
	description?: string;
	model?: { [key: string]: string };

	constructor(props: PathVerbProps) {
		Object.assign(this, props);
		this.description = props.description;
		this.model = props.model;

		if (props.queries) {
			this.queries = Object.fromEntries(
				Object.entries(props.queries).map(([name, query]) => [
					name,
					query.map((val) => {
						if (
							typeof val == "string" ||
							typeof val == "boolean" ||
							typeof val == "number"
						) {
							return val;
						}
						return new PathQuery(val);
					}),
				])
			);
		}
	}
}

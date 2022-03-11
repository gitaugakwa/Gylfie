// import { decode } from "jsonwebtoken";
// import { DateTime } from "luxon";
// import { Payload } from "../authentication";

import { PathVerb } from "./verb.model";

// const PathVerbs = ["GET", "POST", "PATCH", "DELETE"]

export interface PathSchemaProps {
	verbs?: VerbMap | ("POST" | "POST" | "PATCH" | "DELETE")[];
	paths?: { [key: string]: PathSchemaProps };
	description?: string;
}

interface VerbMap {
	GET?: PathVerb;
	POST?: PathVerb;
	PATCH?: PathVerb;
	DELETE?: PathVerb;
}

export class PathSchema {
	verbs?: VerbMap | ("POST" | "POST" | "PATCH" | "DELETE")[];
	paths?: { [key: string]: PathSchema };
	description?: string;
	constructor(schema: PathSchemaProps) {
		this.description = schema.description;
		if (Array.isArray(schema.verbs)) {
			this.verbs = schema.verbs;
		} else if (schema.verbs) {
			this.verbs = {};
			this.verbs.GET = schema.verbs.GET
				? new PathVerb(schema.verbs.GET)
				: undefined;
			this.verbs.POST = schema.verbs.POST
				? new PathVerb(schema.verbs.POST)
				: undefined;
			this.verbs.PATCH = schema.verbs.PATCH
				? new PathVerb(schema.verbs.PATCH)
				: undefined;
			this.verbs.DELETE = schema.verbs.DELETE
				? new PathVerb(schema.verbs.DELETE)
				: undefined;
		}
		if (schema.paths) {
			this.paths = Object.fromEntries(
				Object.entries(schema.paths).map(([name, schema]) => [
					name,
					new PathSchema(schema),
				])
			);
		}
		// Object.assign(this, schema);
	}
}

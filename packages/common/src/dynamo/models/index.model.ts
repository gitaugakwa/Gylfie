import { IndexKeyDefinition, PrimaryKeyDefinition } from "./key.model";

export enum INDEX_TYPE {
	GSI = "GSI",
	LSI = "LSI",
}

export interface IndexDefinition extends IndexKeyDefinition {
	projection: {
		type: "KEYS_ONLY" | "INCLUDE" | "ALL";
		attributes?: string[];
	};
	RCU: number;
	WCU: number;
}

import { IndexKeyDefinition, PrimaryKeyDefinition } from "./key.model";

export enum IndexType {
	GSI = "GSI",
	LSI = "LSI",
}

export interface IndexDefinition extends IndexKeyDefinition {
	projection:
		| "KEYS_ONLY"
		| "ALL"
		| {
				type: "INCLUDE";
				attributes: string[];
		  };
	RCU?: number;
	WCU?: number;
}

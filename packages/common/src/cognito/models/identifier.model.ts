import { validate } from "uuid";
import * as EmailValidator from "email-validator";
// export enum IdentifierType {
// 	ID,
// 	// FriendlyID,
// 	Email,
// }

export class AccessValidator {
	public static email(text: string): boolean {
		return EmailValidator.validate(text);
	}
	public static id(text: string): boolean {
		return validate(text);
	}
	// public static type(identifier: string | number): IdentifierType {
	// 	switch (typeof identifier) {
	// 		case "string": {
	// 			if (validate(identifier)) {
	// 				return IdentifierType.ID;
	// 			}
	// 			if (EmailValidator.validate(identifier)) {
	// 				return IdentifierType.Email;
	// 			}
	// 		}
	// 		// case "number": {
	// 		// 	return IdentifierType.FriendlyID;
	// 		// }
	// 		default: {
	// 			throw new Error("Invalid Identifier");
	// 		}
	// 	}
	// }
}

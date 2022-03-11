import { decode } from "jsonwebtoken";
import { GylfieError } from "../../base";
import { BaseServiceProps, BaseService } from "../../base/services";
import { Payload } from "../models";

export interface JwtServiceProps extends BaseServiceProps {}

export class JwtService extends BaseService {
	constructor(props?: JwtServiceProps) {
		super();
	}
	async getUserFromToken(userToken: string): Promise<undefined> {
		try {
			// const payload: Payload = <Payload>decode(userToken);
			// return new RegularUser({
			// 	accessTokenDecoded: <{ [key: string]: any }>(
			// 		decode(payload.accessToken)
			// 	),
			// 	...payload,
			// });
			return undefined;
		} catch (err) {
			// proper error thrown
			return undefined;
		}
	}
	protected errorHandler(err?: any, inner?: GylfieError): GylfieError {
		throw new Error("Method not implemented.");
	}
}

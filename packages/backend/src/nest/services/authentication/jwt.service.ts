import { Inject, Injectable } from "@nestjs/common";
import { decode } from "jsonwebtoken";
import { JWT_PROPS } from "../../modules/authentication/authentication.constants";
import { BaseNestService } from "../../base";
import { JwtService, JwtServiceProps } from "@gylfie/common/lib/authentication";

export interface NestJwtServiceProps extends JwtServiceProps {}

@Injectable()
export class NestJwtService extends BaseNestService {
	private service: JwtService;
	constructor(
		@Inject(JWT_PROPS)
		private readonly props: NestJwtServiceProps
	) {
		super();
		this.service = new JwtService(props);
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
}

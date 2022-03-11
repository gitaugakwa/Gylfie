import {
	createRemoteJWKSet,
	jwtVerify,
	FlattenedJWSInput,
	JWSHeaderParameters,
} from "jose";
import { GetKeyFunction } from "jose/dist/types/types";
import { BaseService, BaseServiceProps, State } from "../../base";
import { GylfieError } from "../../base/errors";

export interface JwkServiceProps extends BaseServiceProps {
	region?: string;
	userPoolId?: string;
}

// jose is best since it has jwk support
export class JwkService extends BaseService {
	readonly region: string;
	private remote?: GetKeyFunction<JWSHeaderParameters, FlattenedJWSInput>;

	constructor(props?: JwkServiceProps) {
		super();
		const userPoolId =
			props?.userPoolId ?? process.env.COGNITO_APP_USERPOOL_ID;
		this.region =
			props?.region ?? process.env.COGNITO_REGION ?? "eu-west-1";
		this.remote = userPoolId
			? createRemoteJWKSet(
					new URL(
						"https://cognito-idp." +
							this.region +
							".amazonaws.com/" +
							userPoolId +
							"/.well-known/jwks.json"
					)
			  )
			: undefined;
	}

	async verify(jwt: string): Promise<{
		payload: { [key: string]: any };
		protectedHeader: { [key: string]: any };
	}> {
		if (!this.remote) {
			throw new Error("COGNITO_APP_USERPOOL_ID is undefined");
		}
		return jwtVerify(jwt, this.remote);
	}

	protected errorHandler(err?: any, inner?: GylfieError): GylfieError {
		throw new Error("Method not implemented.");
	}
}

import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JWK_PROPS } from "../../modules/authentication/authentication.constants";
import { JwkService, JwkServiceProps } from "@gylfie/common/lib/authentication";
import {
	createRemoteJWKSet,
	jwtVerify,
	FlattenedJWSInput,
	JWSHeaderParameters,
	KeyLike,
} from "jose";
import { merge } from "lodash";
import { BaseNestService } from "../../base";

export interface NestJwkServiceProps extends JwkServiceProps {}

// jose is best since it has jwk support
@Injectable()
export class NestJwkService extends BaseNestService {
	private service: JwkService;
	constructor(
		@Inject(JWK_PROPS)
		private readonly props: NestJwkServiceProps
	) {
		super();
		this.service = new JwkService(props);
	}
}

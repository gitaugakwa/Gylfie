import { PassportStrategy } from "@nestjs/passport";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ExtractJwt, Strategy } from "passport-jwt";
// import { DecoderService } from "../../../services/authentication/decoder.service";
import { JWT_PROPS } from "../authentication.constants";
import { Payload } from "@gylfie/common/lib/authentication";
// import { JwkService } from "src/app/core/services";
// import { Payload, RegularUser } from "src/app/core/models";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private configService: ConfigService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: configService.get<string>("AUTHENTICATION_JWT_SECRET"),
		});
	}

	// Fix error handling
	async validate(payload: Payload): Promise<undefined> {
		return undefined;
	}
}

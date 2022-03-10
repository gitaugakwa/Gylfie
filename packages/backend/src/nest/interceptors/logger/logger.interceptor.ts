import {
	Injectable,
	NestInterceptor,
	ExecutionContext,
	CallHandler,
	Provider,
} from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { Observable } from "rxjs";
import { tap, map } from "rxjs/operators";
import { NestLoggerService } from "../../services";

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
	constructor(private logger: NestLoggerService) {}
	async intercept(
		context: ExecutionContext,
		next: CallHandler
	): Promise<Observable<Response>> {
		// So code here is run before and after the route execution
		const request = context.switchToHttp().getRequest();
		const headers = request.headers;
		let auth: string = headers["authorization"];
		// guards are technically run before interceptors
		// That should mean that there is already an active user in the request object
		// If so, just find the user, create a new user instance
		// If there's a problem,
		if (auth) {
			auth = auth.split(" ")[1];
			// const user = await this.jwtService.getUserFromToken(auth);
			// this.loggerService.start(user);
		} else {
		}
		this.logger.begin();
		return next.handle().pipe(
			tap(() => {
				console.log(this.logger.logs);
				this.logger.end();
				this.logger.flush();
				// console.log(this.loggerService.stop());
			})
		);
	}
}

export const LoggerInterceptorProvider: Provider<any> = {
	provide: APP_INTERCEPTOR,
	useClass: LoggerInterceptor,
};

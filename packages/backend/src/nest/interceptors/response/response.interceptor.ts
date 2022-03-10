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

import { GylfieResponse } from "@gylfie/common/lib/base";

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
	// can also have injection dependencies
	// a logging service
	// that then can be passed on to the routes then logs added dynamically
	// then in the tap function, handle the logs as needed
	constructor() {} // private loggerService: LoggerService // private jwtService: JwtService
	async intercept(
		context: ExecutionContext,
		next: CallHandler
	): Promise<Observable<GylfieResponse>> {
		// So code here is run before and after the route execution
		// Thus we can time the execution of a route and add it to the logs
		// not sure

		return next.handle().pipe(
			map((data) => {
				return { data };
			})
		);
	}
}

export const ResponseInterceptorProvider: Provider<any> = {
	provide: APP_INTERCEPTOR,
	useClass: ResponseInterceptor,
};

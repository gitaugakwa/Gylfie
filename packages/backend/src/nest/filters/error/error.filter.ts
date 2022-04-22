import {
	ExceptionFilter,
	Catch,
	ArgumentsHost,
	HttpException,
	HttpStatus,
	Optional,
	Provider,
} from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";

import { DateTime } from "luxon";

import { Response, Request } from "express";
import { GylfieError, GylfieResponse } from "@gylfie/common";
import { NestLoggerService } from "../../services";

@Catch()
export class ErrorFilter implements ExceptionFilter {
	constructor(
		@Optional()
		private logger?: NestLoggerService
	) {}
	catch(exception: any, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const res = ctx.getResponse<Response>();
		const req = ctx.getRequest<Request>();

		// if the exception is not a HttpException,
		// then it will be an emergency.
		// That is cause then the error has not been handled by the code

		// This might catch all errors

		// console.log("Error Filter");
		console.log(exception);

		let response: GylfieResponse;
		if (exception instanceof GylfieError) {
			// console.log("Gylfie Error");
			// console.log(exception);

			const { time, ...error } = exception.display();
			const status = exception.status ?? 500;
			response = {
				error: { ...error, status, time: time.toISO() },
			};
		} else if (exception instanceof HttpException) {
			const { message, name } = exception;
			const status = exception.getStatus();
			response = {
				error: {
					message,
					name,
					code: name,
					status,
					time: DateTime.utc().toISO(),
				},
			};
		} else {
			response = {
				error: {
					...exception,
					name: exception.name ?? "InternalServerError",
					code: exception.code ?? "InternalServerError",
					status: exception.status ?? 500,
					time: exception.time ?? DateTime.utc().toISO(),
				},
			};
		}
		console.log(this.logger?.logs);
		this.logger?.end();
		this.logger?.flush();
		res.status(response.error?.status ?? 500).json(response);
	}
}

export const ErrorFilterProvider: Provider<any> = {
	provide: APP_FILTER,
	useClass: ErrorFilter,
};

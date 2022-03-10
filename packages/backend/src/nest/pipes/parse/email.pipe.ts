import {
	PipeTransform,
	Injectable,
	ArgumentMetadata,
	Optional,
	HttpStatus,
} from "@nestjs/common";
import { isEmail } from "class-validator";
import {
	ErrorHttpStatusCode,
	HttpErrorByCode,
} from "@nestjs/common/utils/http-error-by-code.util";

interface ParseEmailOptions {
	errorHttpStatusCode?: HttpStatus;
}

@Injectable()
export class ParseEmailPipe implements PipeTransform {
	protected exceptionFactory: (errors: string) => any;
	constructor(@Optional() options?: ParseEmailOptions) {
		options = options || {};
		const { errorHttpStatusCode = HttpStatus.BAD_REQUEST } = options;

		this.exceptionFactory = (error) =>
			new HttpErrorByCode[errorHttpStatusCode as ErrorHttpStatusCode](
				error
			);
	}
	async transform(value: string, metadata: ArgumentMetadata) {
		if (!isEmail(value)) {
			throw this.exceptionFactory(
				`Validation failed (email is expected)`
			);
		}
		return value;
	}
}

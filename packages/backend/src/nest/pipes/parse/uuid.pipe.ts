import {
	PipeTransform,
	Injectable,
	ArgumentMetadata,
	Optional,
	HttpStatus,
} from "@nestjs/common";
import {
	ErrorHttpStatusCode,
	HttpErrorByCode,
} from "@nestjs/common/utils/http-error-by-code.util";

function isUUID(uuid: string) {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
		uuid
	);
}

interface ParseAnyVersionUUIDOptions {
	errorHttpStatusCode?: HttpStatus;
}

@Injectable()
export class ParseAnyVersionUUIDPipe implements PipeTransform {
	protected exceptionFactory: (errors: string) => any;
	constructor(@Optional() options?: ParseAnyVersionUUIDOptions) {
		options = options || {};
		const { errorHttpStatusCode = HttpStatus.BAD_REQUEST } = options;

		this.exceptionFactory = (error) =>
			new HttpErrorByCode[errorHttpStatusCode as ErrorHttpStatusCode](
				error
			);
	}
	async transform(value: string, metadata: ArgumentMetadata) {
		if (!isUUID(value)) {
			throw this.exceptionFactory(`Validation failed (uuid is expected)`);
		}
		return value;
	}
}

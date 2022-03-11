import {
	registerDecorator,
	ValidationOptions,
	ValidatorConstraint,
	ValidatorConstraintInterface,
	ValidationArguments,
} from "class-validator";
import { Placeholder } from "../placeholders";

@ValidatorConstraint({ async: true })
export class ExcludePlaceholdersConstraints
	implements ValidatorConstraintInterface
{
	validate(value: any, args: ValidationArguments) {
		if (typeof value == "string") return !Placeholder.hasPlaceholder(value);
		return true;
	}
}

export function ExcludePlaceholders(validationOptions?: ValidationOptions) {
	return function (object: Object, propertyName: string) {
		registerDecorator({
			target: object.constructor,
			propertyName: propertyName,
			options: validationOptions,
			constraints: [],
			validator: ExcludePlaceholdersConstraints,
		});
	};
}

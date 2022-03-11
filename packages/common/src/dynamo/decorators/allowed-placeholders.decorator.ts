import {
	registerDecorator,
	ValidationOptions,
	ValidatorConstraint,
	ValidatorConstraintInterface,
	ValidationArguments,
} from "class-validator";
import { Placeholder } from "../placeholders";
import { xor, uniq } from "lodash";

@ValidatorConstraint({ async: true })
export class AllowedPlaceholdersConstraints
	implements ValidatorConstraintInterface
{
	validate(value: any, args: ValidationArguments) {
		const [allowed] = args.constraints;
		if (typeof value == "string" && Placeholder.hasPlaceholder(value)) {
			const placeholders = xor(
				Placeholder.getPlaceholders(value).filter(
					(val) => !Placeholder.hasPlaceholder(value)
				),
				allowed
			);
			placeholders.push(allowed);
			const uniquePlaceholders = uniq(placeholders);
			return !xor(uniquePlaceholders, allowed).length;
		}

		return true;
	}
}

export function AllowedPlaceholders(
	allowed: string[],
	validationOptions?: ValidationOptions
) {
	return function (object: Object, propertyName: string) {
		registerDecorator({
			target: object.constructor,
			propertyName: propertyName,
			options: validationOptions,
			constraints: [allowed],
			validator: AllowedPlaceholdersConstraints,
		});
	};
}

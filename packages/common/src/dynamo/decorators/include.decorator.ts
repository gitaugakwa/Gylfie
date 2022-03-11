import "reflect-metadata";
import { ClassDecorator, MemberDecorator } from "../../base/decorators";

interface IncludeProps {}
interface IncludeAllProps {}

export function Include(props?: IncludeProps) {
	return MemberDecorator({ "include": true });
}

export function IncludeAll(props?: IncludeAllProps) {
	return ClassDecorator("includeAll", true, {
		enumerable: false,
		configurable: false,
		writable: false,
	});
}

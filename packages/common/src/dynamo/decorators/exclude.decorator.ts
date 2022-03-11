import { ClassDecorator, MemberDecorator } from "../../base/decorators";
import { Exclude as CTExclude } from "class-transformer";
interface ExcludeProps {
	classTransformer?: boolean;
	gylfie?: boolean;
}
interface ExcludeAllProps {}

// Should be able to be used on a class in order to
// exclude all members except the ones included
// we could define ExcludeAll
export function Exclude(props?: ExcludeProps) {
	if (props) {
		const { classTransformer, gylfie } = props;
		const decorators: PropertyDecorator[] = [];
		classTransformer && decorators.push(CTExclude());
		return MemberDecorator(
			gylfie ? { "exclude": true } : {},
			...decorators
		);
	}
	return MemberDecorator({ "exclude": true });
}

export function ExcludeAll(props?: ExcludeAllProps) {
	return ClassDecorator("excludeAll", true, {
		enumerable: false,
		configurable: false,
		writable: false,
	});
}

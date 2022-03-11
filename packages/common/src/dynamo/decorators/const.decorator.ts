import { MemberDecorator } from "../../base/decorators";

export interface ConstProps {}
export function Const(props?: ConstProps) {
	return MemberDecorator({ "const": true });
}

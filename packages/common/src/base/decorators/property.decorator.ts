import "reflect-metadata";
import { MemberDecorator } from "./member.decorator";

interface PropertyProps {
	constant?: boolean;
	exclude?: boolean;
	include?: boolean;
	public?: boolean;
}

const PropertyMap: { [key: string]: string } = {
	constant: "const",
	exclude: "exclude",
	include: "include",
	public: "public",
};

export function Property(props: PropertyProps) {
	const properties = Object.fromEntries(
		Object.entries(props)
			.filter(([name, value]) => {
				if (typeof value != "undefined") {
					return true;
				}
				return false;
			})
			.map(([name, value]) => {
				return [PropertyMap[name], value];
			})
	);
	return MemberDecorator(properties);
}

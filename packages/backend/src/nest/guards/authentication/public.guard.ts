import { CustomDecorator, SetMetadata } from "@nestjs/common";

export const PUBLIC_KEY = "isPublic";
export function NestPublic(): CustomDecorator<string> {
	return SetMetadata(PUBLIC_KEY, true);
}

import { Access } from "./access.model";

export interface BucketProps {
	name: string;
	access:
		| Access
		| "authenticated-read"
		| "private"
		| "public-read"
		| "public-read-write";
}

export class Bucket {
	constructor(props?: BucketProps) {}
}

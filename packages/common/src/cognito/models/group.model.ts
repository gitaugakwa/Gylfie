export class GroupResponse {
	groupName?: string;
	userPoolID?: string;
	description?: string;
	roleArn?: string;
	precedence?: number;
	lastModifiedDate?: Date;
	creationDate?: Date;

	constructor(props: Partial<GroupResponse>) {
		Object.assign(this, props);
	}
}

export class Group {}

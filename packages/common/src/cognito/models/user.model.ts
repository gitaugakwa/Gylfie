// import { v1 } from "uuid";
// import { Entity, Exclude, Const } from "../../decorators/dynamo";
// import {
// 	DynamoDBMap,
// 	DynamoDBValue,
// 	INDEX_TYPE,
// 	RegularItem,
// 	EntityInterfaceProps,
// 	isEntityInterface,
// } from "../dynamo";
// import { DateTime } from "luxon";

// interface UserProps extends RegularUserProps {
// 	[key: string]: DynamoDBValue;
// 	email: string;
// }

// export interface RegularUserProps {
// 	[key: string]: DynamoDBValue;
// 	id: string;
// }

// export class RegularUser extends RegularItem {
// 	id?: string;
// 	constructor(props: RegularUserProps | EntityInterfaceProps) {
// 		if (isEntityInterface(props)) {
// 			super(props);
// 			return;
// 		}
// 		super();
// 		const isRegularUserProps = function (
// 			props: any
// 		): props is RegularUserProps {
// 			return props.email && !props.friendlyID && !props.id;
// 		};
// 		Object.assign(this, props);
// 		if (isRegularUserProps(props)) {
// 			this.id = v1();
// 			return;
// 		}
// 	}
// }

// @Entity({
// 	name: "BaseUser",
// 	primaryKey: {
// 		partitionKey: "USER#{{userID}}",
// 		sortKey: "user",
// 	},
// 	indexes: {
// 		GSI1: {
// 			type: INDEX_TYPE.GSI,
// 			partitionKey: "{{email}}",
// 			sortKey: "USER#{{userID}}",
// 		},
// 		GSI2: {
// 			type: INDEX_TYPE.GSI,
// 			partitionKey: "user",
// 			sortKey: "USER#{{userID}}",
// 		},
// 		GSI3: {
// 			type: INDEX_TYPE.GSI,
// 			partitionKey: "{{creationDate}}",
// 			sortKey: "{{creationTime}}",
// 		},
// 		GSI4: {
// 			type: INDEX_TYPE.GSI,
// 			partitionKey: "user",
// 			sortKey: "{{friendlyID}}",
// 		},
// 	},
// 	// This should apply in general, pretty much every application should follow this structure
// 	// GSIs will depend on the user implementation
// 	// But tbh, if we are modifying GSIs, they will have to communicate to us for that
// })
// // This is weird. When it comes to Users, it's hard
// // Since this is joint between cognito and Dynamo
// // We could take in a class as a param and that can then be used
// export class User extends RegularUser {
// 	// [key: string]: any;
// 	@Exclude()
// 	@Const()
// 	id?: string;
// 	@Exclude()
// 	email?: string;
// 	@Exclude()
// 	type?: string;
// 	@Exclude()
// 	creationDate?: string;
// 	@Exclude()
// 	creationTime?: string;
// 	@Exclude()
// 	friendlyID?: string;
// 	@Exclude()
// 	updatedAt?: string;
// 	constructor(props: UserProps | EntityInterfaceProps) {
// 		if (isEntityInterface(props)) {
// 			super(props);
// 			return;
// 		}
// 		super(props);
// 		const isUserProps = function (props: any): props is UserProps {
// 			return props.email && !props.friendlyID && !props.userID;
// 		};
// 		Object.assign(this, props);
// 		if (isUserProps(props)) {
// 			// fix this
// 			// make this formatable by table hopefully
// 			const dateTime = DateTime.utc();
// 			this.creationDate = dateTime.toISODate();
// 			this.creationTime = dateTime.toISOTime();
// 			this.email = props.email;
// 			this.type = "user";
// 			this.id = v1();
// 			this.friendlyID = this.generateFriendlyID();
// 			return;
// 		}
// 	}
// }

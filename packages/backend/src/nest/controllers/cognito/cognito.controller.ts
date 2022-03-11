import { Controller, Post, Put, Get, Patch, Body } from "@nestjs/common";
// import { Groups } from "@gylfie/common/lib/base";
import { GroupResponse } from "@gylfie/common/lib/cognito";
import { NestCognitoService } from "../../services/cognito";
// import { GroupResponse } from "@gylfie/common";
// import {} from "@gylfie/common";
// import {} from '@gylfie/common'

@Controller("cognito")
export class CognitoController {
	constructor(private cognitoService: NestCognitoService) {}

	@Post("/groups")
	// @Groups("Developer")
	async createGroup(
		@Body()
		group: {
			groupName: string;
			description?: string;
			precedence?: number;
		}
	): Promise<GroupResponse> {
		return this.cognitoService.createGroup(group);
	}
}

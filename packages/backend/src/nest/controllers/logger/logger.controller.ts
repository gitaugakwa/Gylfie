import { Controller, Post, Put, Get, Patch, Body } from "@nestjs/common";
import { NestLoggerService } from "../../services/logger";
// import { Groups, Public } from "../../../decorators";

@Controller("logger")
export class LoggerController {
	constructor(private loggerService: NestLoggerService) {}

	// @Public()
	@Get()
	public async getLogs() {
		return this.loggerService.fullLogObject("DEBUG");
	}
}

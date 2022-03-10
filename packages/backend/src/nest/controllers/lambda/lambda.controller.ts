import { Controller, Post, Put, Get, Patch, Body } from "@nestjs/common";
import { NestLambdaService } from "../../services/lambda";

@Controller("lambda")
export class LambdaController {
	constructor(private lambdaService: NestLambdaService) {}
}
